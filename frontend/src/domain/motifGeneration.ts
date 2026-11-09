import { selectionAabb } from "./editing";
import { distanceBetweenGeometries, geometriesOverlap } from "./geometry/intersections";
import { aabbDistance, EPSILON_MM, geometryAabb, type Aabb, type PlacementGeometry } from "./geometry/primitives";
import { createPlacementGeometry, degreesToRadians, rotatePoint } from "./geometry/transforms";
import { validateAllPlacements } from "./geometry/validation";
import type { Material } from "./material";
import { countPlacementsByMaterial, normalizeRotation, type Placement } from "./placement";
import { createArcLengthTable, sampleArcLength, type ArcPoint } from "./arcLength";

export const MOTIF_PATTERN_TYPES = ["line", "ring", "spiral", "wave", "flower", "geometric"] as const;
export type MotifPatternType = (typeof MOTIF_PATTERN_TYPES)[number];

export const MOTIF_SYMMETRIES = ["none", "horizontal", "vertical", "four-way", "radial"] as const;
export type MotifSymmetry = (typeof MOTIF_SYMMETRIES)[number];

export const RADIAL_REPEAT_OPTIONS = [3, 4, 5, 6, 8, 12] as const;

export interface WeightedMaterialSelection {
  materialId: string;
  weight: number;
}

export interface MotifGenerationRequest {
  pattern: MotifPatternType;
  widthMm: number;
  heightMm: number;
  centerXmm: number;
  centerYmm: number;
  materials: WeightedMaterialSelection[];
  targetGapMm: number;
  minimumGapMm: number;
  symmetry: MotifSymmetry;
  radialRepeats: number;
  repeatCount: number;
  densityPercent: number;
  seed: string;
}

export interface MotifGenerationLimits {
  maxPlacements: number;
  maxCandidates: number;
  maxDurationMs: number;
}

export const DEFAULT_GENERATION_LIMITS: MotifGenerationLimits = {
  maxPlacements: 5_000,
  maxCandidates: 40_000,
  maxDurationMs: 1_000,
};

export interface MotifGenerationEstimate {
  estimatedCount: number;
  capacity: number;
  suitable: boolean;
  warnings: string[];
  errors: string[];
}

export interface MotifGenerationReport {
  totalCount: number;
  countsByMaterial: Record<string, number>;
  actualWidthMm: number;
  actualHeightMm: number;
  symmetry: MotifSymmetry;
  targetGapMm: number;
  minimumGapMm: number;
  acceptedCandidates: number;
  rejectedCandidates: number;
  warnings: string[];
  durationMs: number;
}

export type MotifGenerationResult =
  | { ok: true; placements: Placement[]; report: MotifGenerationReport }
  | { ok: false; code: "INVALID_REQUEST" | "CANDIDATE_LIMIT" | "TIME_LIMIT" | "NO_VALID_PLACEMENT"; message: string; errors: string[] };

export interface PatternCandidate {
  x: number;
  y: number;
  rotationDeg: number;
  materialId?: string;
}

interface IndexedPlacement {
  geometry: PlacementGeometry;
  aabb: Aabb;
}

const MIN_DIMENSION_MM = 1;
const MAX_DIMENSION_MM = 5_000;
const MAX_REPEAT_COUNT = 100;
const POSITION_KEY_SCALE = 1_000_000;

function isPattern(value: unknown): value is MotifPatternType {
  return typeof value === "string" && MOTIF_PATTERN_TYPES.includes(value as MotifPatternType);
}

function isSymmetry(value: unknown): value is MotifSymmetry {
  return typeof value === "string" && MOTIF_SYMMETRIES.includes(value as MotifSymmetry);
}

export function validateMotifGenerationRequest(
  request: MotifGenerationRequest,
  catalog: readonly Material[],
): string[] {
  const errors: string[] = [];
  if (!isPattern(request.pattern)) errors.push("Geçerli bir motif türü seçin.");
  if (!Number.isFinite(request.widthMm) || request.widthMm < MIN_DIMENSION_MM || request.widthMm > MAX_DIMENSION_MM) {
    errors.push(`Motif genişliği ${MIN_DIMENSION_MM}–${MAX_DIMENSION_MM} mm arasında olmalıdır.`);
  }
  if (!Number.isFinite(request.heightMm) || request.heightMm < MIN_DIMENSION_MM || request.heightMm > MAX_DIMENSION_MM) {
    errors.push(`Motif yüksekliği ${MIN_DIMENSION_MM}–${MAX_DIMENSION_MM} mm arasında olmalıdır.`);
  }
  if (!Number.isFinite(request.centerXmm) || !Number.isFinite(request.centerYmm)) {
    errors.push("Motif merkezi sonlu milimetre koordinatları taşımalıdır.");
  }
  if (!Number.isFinite(request.minimumGapMm) || request.minimumGapMm < 0 || request.minimumGapMm > 100) {
    errors.push("Minimum boncuk aralığı 0–100 mm arasında olmalıdır.");
  }
  if (!Number.isFinite(request.targetGapMm) || request.targetGapMm < 0 || request.targetGapMm > 100) {
    errors.push("Hedef boncuk aralığı 0–100 mm arasında olmalıdır.");
  }
  if (!Number.isInteger(request.repeatCount) || request.repeatCount < 1 || request.repeatCount > MAX_REPEAT_COUNT) {
    errors.push(`Tekrar sayısı 1–${MAX_REPEAT_COUNT} arasında tam sayı olmalıdır.`);
  }
  if (!Number.isFinite(request.densityPercent) || request.densityPercent < 1 || request.densityPercent > 100) {
    errors.push("Yoğunluk %1–%100 arasında olmalıdır.");
  }
  if (!isSymmetry(request.symmetry)) errors.push("Geçerli bir simetri türü seçin.");
  if (request.symmetry === "radial" && !RADIAL_REPEAT_OPTIONS.includes(request.radialRepeats as (typeof RADIAL_REPEAT_OPTIONS)[number])) {
    errors.push("Radyal simetri tekrarı 3, 4, 5, 6, 8 veya 12 olmalıdır.");
  }
  if (typeof request.seed !== "string" || request.seed.trim().length === 0 || request.seed.length > 100) {
    errors.push("Rastgelelik tohumu 1–100 karakter arasında olmalıdır.");
  }
  if (!Array.isArray(request.materials) || request.materials.length === 0) {
    errors.push("En az bir etkin katalog malzemesi seçin.");
  } else {
    const catalogById = new Map(catalog.map((material) => [material.id, material]));
    const ids = new Set<string>();
    for (const selection of request.materials) {
      const material = catalogById.get(selection.materialId);
      if (!material || !material.active) errors.push(`Seçilen malzeme kullanılamıyor: ${selection.materialId}.`);
      if (ids.has(selection.materialId)) errors.push("Aynı malzeme üretim listesinde birden fazla kez bulunamaz.");
      if (!Number.isFinite(selection.weight) || selection.weight <= 0 || selection.weight > 10_000) {
        errors.push("Malzeme kullanım oranları pozitif ve en fazla 10.000 olmalıdır.");
      }
      ids.add(selection.materialId);
    }
  }
  return [...new Set(errors)];
}

function hashSeed(seed: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0 || 1;
}

function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function symmetryMultiplier(request: MotifGenerationRequest): number {
  if (request.symmetry === "horizontal" || request.symmetry === "vertical") return 2;
  if (request.symmetry === "four-way") return 4;
  if (request.symmetry === "radial") return request.radialRepeats;
  return 1;
}

function maxMaterialDiameter(materials: readonly Material[]): number {
  return Math.max(...materials.map((material) => Math.hypot(material.widthMm, material.heightMm)));
}

export function estimateMotifGeneration(
  request: MotifGenerationRequest,
  catalog: readonly Material[],
  limits: MotifGenerationLimits = DEFAULT_GENERATION_LIMITS,
): MotifGenerationEstimate {
  const errors = validateMotifGenerationRequest(request, catalog);
  if (errors.length > 0) return { estimatedCount: 0, capacity: 0, suitable: false, warnings: [], errors };
  const selected = catalog.filter((material) => request.materials.some((item) => item.materialId === material.id));
  const pitch = maxMaterialDiameter(selected) + Math.max(request.targetGapMm, request.minimumGapMm);
  const areaCapacity = Math.max(1, Math.floor((request.widthMm * request.heightMm) / Math.max(1, pitch * pitch)));
  const pathFactor = request.pattern === "geometric" ? 1 : request.pattern === "line" ? 0.18 : 0.38;
  const estimatedCount = Math.min(
    limits.maxPlacements,
    Math.max(1, Math.round(areaCapacity * pathFactor * (request.densityPercent / 100) * Math.min(2, symmetryMultiplier(request)))),
  );
  const warnings: string[] = [];
  if (request.widthMm < pitch || request.heightMm < pitch) warnings.push("Seçilen malzeme motif ölçülerine sığmayabilir.");
  if (estimatedCount >= limits.maxPlacements) warnings.push(`Tahmin güvenlik sınırı olan ${limits.maxPlacements.toLocaleString("tr-TR")} boncuğa ulaşıyor.`);
  if (request.minimumGapMm > Math.min(request.widthMm, request.heightMm) / 4) warnings.push("Minimum aralık motif ölçüsüne göre çok büyük.");
  if (request.targetGapMm < request.minimumGapMm) warnings.push("Hedef aralık, güvenlik aralığından küçük olduğu için güvenlik aralığı kullanılacak.");
  return { estimatedCount, capacity: Math.min(areaCapacity, limits.maxPlacements), suitable: warnings.length === 0, warnings, errors: [] };
}

function pushLimited(target: PatternCandidate[], candidate: PatternCandidate, limit: number): boolean {
  if (target.length >= limit) return false;
  target.push(candidate);
  return true;
}

interface PatternPath {
  points: ArcPoint[];
  closed: boolean;
}

interface PathItem {
  materialId: string;
  desiredGapFromPrevious: number;
}

function curvePoints(count: number, pointAt: (ratio: number) => ArcPoint, closed: boolean): ArcPoint[] {
  const points: ArcPoint[] = [];
  const last = closed ? count - 1 : count;
  for (let index = 0; index <= last; index += 1) points.push(pointAt(index / count));
  return points;
}

function patternPaths(
  request: MotifGenerationRequest,
  usableHalfWidth: number,
  usableHalfHeight: number,
): PatternPath[] {
  if (request.pattern === "line") {
    return Array.from({ length: request.repeatCount }, (_, line) => {
      const y = request.repeatCount === 1
        ? 0
        : -usableHalfHeight + 2 * usableHalfHeight * line / (request.repeatCount - 1);
      return { points: [{ x: -usableHalfWidth, y }, { x: usableHalfWidth, y }], closed: false };
    });
  }
  if (request.pattern === "ring") {
    return Array.from({ length: request.repeatCount }, (_, index) => {
      const ratio = (index + 1) / request.repeatCount;
      return {
        points: curvePoints(720, (value) => {
          const angle = 2 * Math.PI * value;
          return { x: usableHalfWidth * ratio * Math.cos(angle), y: usableHalfHeight * ratio * Math.sin(angle) };
        }, true),
        closed: true,
      };
    });
  }
  if (request.pattern === "spiral") {
    const sampleCount = Math.min(8_000, Math.max(720, request.repeatCount * 360));
    return [{
      points: curvePoints(sampleCount, (ratio) => {
        const angle = 2 * Math.PI * request.repeatCount * ratio;
        return {
          x: usableHalfWidth * ratio * Math.cos(angle),
          y: usableHalfHeight * ratio * Math.sin(angle),
        };
      }, false),
      closed: false,
    }];
  }
  if (request.pattern === "wave") {
    const sampleCount = Math.min(8_000, Math.max(720, request.repeatCount * 240));
    return [{
      points: curvePoints(sampleCount, (ratio) => ({
        x: -usableHalfWidth + 2 * usableHalfWidth * ratio,
        y: usableHalfHeight * Math.sin(2 * Math.PI * request.repeatCount * ratio),
      }), false),
      closed: false,
    }];
  }
  if (request.pattern === "flower") {
    const petals = Math.max(3, request.repeatCount);
    const sampleCount = Math.min(8_000, Math.max(720, petals * 240));
    return [{
      points: curvePoints(sampleCount, (ratio) => {
        const angle = 2 * Math.PI * ratio;
        const radius = 0.62 + 0.38 * Math.cos(petals * angle);
        return {
          x: usableHalfWidth * radius * Math.cos(angle),
          y: usableHalfHeight * radius * Math.sin(angle),
        };
      }, true),
      closed: true,
    }];
  }
  return [];
}

function materialRadiusAlong(
  material: Material,
  materialRotationDeg: number,
  directionDeg: number,
): number {
  if (material.shape === "circle" || material.shape === "ring") return material.widthMm / 2;
  const relative = degreesToRadians(directionDeg - materialRotationDeg);
  return Math.abs(Math.cos(relative)) * material.widthMm / 2 +
    Math.abs(Math.sin(relative)) * material.heightMm / 2;
}

function desiredCenterDistance(
  previous: Material,
  previousRotationDeg: number,
  next: Material,
  nextRotationDeg: number,
  directionDeg: number,
  request: MotifGenerationRequest,
): number {
  const physicalGap = Math.max(request.targetGapMm, request.minimumGapMm);
  const densityFactor = 100 / request.densityPercent;
  return (
    materialRadiusAlong(previous, previousRotationDeg, directionDeg) +
    materialRadiusAlong(next, nextRotationDeg, directionDeg) +
    physicalGap
  ) * densityFactor;
}

function samplePathCandidates(
  path: PatternPath,
  request: MotifGenerationRequest,
  materialsById: ReadonlyMap<string, Material>,
  random: () => number,
  limit: number,
): PatternCandidate[] {
  const table = createArcLengthTable(path.points, path.closed);
  if (table.totalLength <= EPSILON_MM || limit < 1) return [];

  const firstMaterialId = chooseMaterial(request.materials, random);
  const items: PathItem[] = [{ materialId: firstMaterialId, desiredGapFromPrevious: 0 }];
  let provisionalDistance = 0;
  while (items.length < limit) {
    const previousItem = items.at(-1)!;
    const previousMaterial = materialsById.get(previousItem.materialId)!;
    const previousSample = sampleArcLength(table, provisionalDistance);
    const nextMaterialId = chooseMaterial(request.materials, random);
    const nextMaterial = materialsById.get(nextMaterialId)!;
    const approximateNext = sampleArcLength(table, provisionalDistance + previousMaterial.widthMm + nextMaterial.widthMm);
    const gap = desiredCenterDistance(
      previousMaterial,
      previousSample.rotationDeg,
      nextMaterial,
      approximateNext.rotationDeg,
      previousSample.rotationDeg,
      request,
    );
    const nextDistance = provisionalDistance + gap;
    if (path.closed) {
      const firstMaterial = materialsById.get(firstMaterialId)!;
      const closure = desiredCenterDistance(
        nextMaterial,
        approximateNext.rotationDeg,
        firstMaterial,
        sampleArcLength(table, 0).rotationDeg,
        approximateNext.rotationDeg,
        request,
      );
      if (nextDistance + closure > table.totalLength + EPSILON_MM) break;
    } else if (nextDistance > table.totalLength + EPSILON_MM) break;
    items.push({ materialId: nextMaterialId, desiredGapFromPrevious: gap });
    provisionalDistance = nextDistance;
  }

  const firstMaterial = materialsById.get(firstMaterialId)!;
  let totalDesiredLength = items.slice(1).reduce((sum, item) => sum + item.desiredGapFromPrevious, 0);
  if (path.closed && items.length > 1) {
    const lastItem = items.at(-1)!;
    const lastMaterial = materialsById.get(lastItem.materialId)!;
    const lastSample = sampleArcLength(table, totalDesiredLength);
    totalDesiredLength += desiredCenterDistance(
      lastMaterial,
      lastSample.rotationDeg,
      firstMaterial,
      sampleArcLength(table, 0).rotationDeg,
      lastSample.rotationDeg,
      request,
    );
  }

  const scale = path.closed && totalDesiredLength > EPSILON_MM
    ? table.totalLength / totalDesiredLength
    : 1;
  const startDistance = path.closed ? 0 : Math.max(0, (table.totalLength - totalDesiredLength) / 2);
  const result: PatternCandidate[] = [];
  let distance = startDistance;
  for (const [index, item] of items.entries()) {
    if (index > 0) distance += item.desiredGapFromPrevious * scale;
    const sample = sampleArcLength(table, distance);
    result.push({ ...sample, materialId: item.materialId });
  }
  return result;
}

function patternCandidates(
  request: MotifGenerationRequest,
  pitch: number,
  limit: number,
  materialsById: ReadonlyMap<string, Material>,
  random: () => number,
): PatternCandidate[] {
  const result: PatternCandidate[] = [];
  const halfWidth = request.widthMm / 2;
  const halfHeight = request.heightMm / 2;
  const usableHalfWidth = Math.max(0, halfWidth - pitch / 2);
  const usableHalfHeight = Math.max(0, halfHeight - pitch / 2);

  if (request.pattern !== "geometric") {
    for (const path of patternPaths(request, usableHalfWidth, usableHalfHeight)) {
      const candidates = samplePathCandidates(path, request, materialsById, random, limit - result.length);
      for (const candidate of candidates) {
        if (!pushLimited(result, candidate, limit)) return result;
      }
    }
    return result;
  }

  const regularPitch = pitch * (100 / request.densityPercent);
  const columns = Math.max(1, Math.floor((2 * usableHalfWidth) / regularPitch));
  const rows = Math.max(1, Math.floor((2 * usableHalfHeight) / regularPitch));
  for (let row = 0; row <= rows; row += 1) {
    const y = rows === 0 ? 0 : -usableHalfHeight + (2 * usableHalfHeight * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const stagger = row % 2 === 1 ? regularPitch / 2 : 0;
      const x = -usableHalfWidth + (2 * usableHalfWidth * column) / columns + stagger;
      if (x > usableHalfWidth + EPSILON_MM) continue;
      const rotationDeg = ((row + column) % Math.max(1, request.repeatCount)) * (180 / Math.max(1, request.repeatCount));
      if (!pushLimited(result, {
        x,
        y,
        rotationDeg: normalizeRotation(rotationDeg),
        materialId: chooseMaterial(request.materials, random),
      }, limit)) return result;
    }
  }
  return result;
}

export function applyMotifSymmetry(
  candidate: Readonly<PatternCandidate>,
  symmetry: MotifSymmetry,
  radialRepeats: number,
): PatternCandidate[] {
  if (symmetry === "horizontal") {
    return [candidate, { ...candidate, x: candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(-candidate.rotationDeg) }];
  }
  if (symmetry === "vertical") {
    return [candidate, { ...candidate, x: -candidate.x, y: candidate.y, rotationDeg: normalizeRotation(180 - candidate.rotationDeg) }];
  }
  if (symmetry === "four-way") {
    return [
      candidate,
      { ...candidate, x: candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(-candidate.rotationDeg) },
      { ...candidate, x: -candidate.x, y: candidate.y, rotationDeg: normalizeRotation(180 - candidate.rotationDeg) },
      { ...candidate, x: -candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(180 + candidate.rotationDeg) },
    ];
  }
  if (symmetry === "radial") {
    const result: PatternCandidate[] = [];
    for (let index = 0; index < radialRepeats; index += 1) {
      const degrees = (360 * index) / radialRepeats;
      const rotated = rotatePoint(candidate, degreesToRadians(degrees));
      result.push({ ...candidate, x: rotated.x, y: rotated.y, rotationDeg: normalizeRotation(candidate.rotationDeg + degrees) });
    }
    return result;
  }
  return [candidate];
}

function chooseMaterial(selections: readonly WeightedMaterialSelection[], random: () => number): string {
  const total = selections.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const selection of selections) {
    cursor -= selection.weight;
    if (cursor <= 0) return selection.materialId;
  }
  return selections.at(-1)!.materialId;
}

function positionKey(x: number, y: number): string {
  return `${Math.round(x * POSITION_KEY_SCALE)}:${Math.round(y * POSITION_KEY_SCALE)}`;
}

class SpatialPlacementIndex {
  private readonly cells = new Map<string, Set<IndexedPlacement>>();

  constructor(private readonly cellSize: number, private readonly minimumGapMm: number) {}

  private cellRange(aabb: Aabb): [number, number, number, number] {
    const gap = this.minimumGapMm;
    return [
      Math.floor((aabb.minX - gap) / this.cellSize),
      Math.floor((aabb.maxX + gap) / this.cellSize),
      Math.floor((aabb.minY - gap) / this.cellSize),
      Math.floor((aabb.maxY + gap) / this.cellSize),
    ];
  }

  query(aabb: Aabb): IndexedPlacement[] {
    const [minX, maxX, minY, maxY] = this.cellRange(aabb);
    const result = new Set<IndexedPlacement>();
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (const entry of this.cells.get(`${x}:${y}`) ?? []) result.add(entry);
      }
    }
    return [...result];
  }

  insert(entry: IndexedPlacement): void {
    const [minX, maxX, minY, maxY] = this.cellRange(entry.aabb);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const key = `${x}:${y}`;
        const cell = this.cells.get(key) ?? new Set<IndexedPlacement>();
        cell.add(entry);
        this.cells.set(key, cell);
      }
    }
  }

  remove(entry: IndexedPlacement): void {
    const [minX, maxX, minY, maxY] = this.cellRange(entry.aabb);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const key = `${x}:${y}`;
        const cell = this.cells.get(key);
        if (!cell) continue;
        cell.delete(entry);
        if (cell.size === 0) this.cells.delete(key);
      }
    }
  }
}

function withinBounds(aabb: Aabb, request: MotifGenerationRequest): boolean {
  const minX = request.centerXmm - request.widthMm / 2;
  const maxX = request.centerXmm + request.widthMm / 2;
  const minY = request.centerYmm - request.heightMm / 2;
  const maxY = request.centerYmm + request.heightMm / 2;
  return aabb.minX + EPSILON_MM >= minX && aabb.maxX - EPSILON_MM <= maxX &&
    aabb.minY + EPSILON_MM >= minY && aabb.maxY - EPSILON_MM <= maxY;
}

function collides(entry: IndexedPlacement, others: readonly IndexedPlacement[], gap: number): boolean {
  for (const other of others) {
    if (aabbDistance(entry.aabb, other.aabb) > gap + EPSILON_MM) continue;
    if (geometriesOverlap(entry.geometry, other.geometry)) return true;
    if (gap > 0 && distanceBetweenGeometries(entry.geometry, other.geometry) + EPSILON_MM < gap) return true;
  }
  return false;
}

function elapsed(startedAt: number): number {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
}

export function generateMotif(
  request: MotifGenerationRequest,
  catalog: readonly Material[],
  limits: MotifGenerationLimits = DEFAULT_GENERATION_LIMITS,
): MotifGenerationResult {
  const errors = validateMotifGenerationRequest(request, catalog);
  if (errors.length > 0) return { ok: false, code: "INVALID_REQUEST", message: errors[0]!, errors };
  if (!Number.isInteger(limits.maxPlacements) || limits.maxPlacements < 1 ||
    !Number.isInteger(limits.maxCandidates) || limits.maxCandidates < 1 ||
    !Number.isFinite(limits.maxDurationMs) || limits.maxDurationMs <= 0) {
    return { ok: false, code: "INVALID_REQUEST", message: "Üretim güvenlik sınırları geçersiz.", errors: ["Üretim güvenlik sınırları geçersiz."] };
  }

  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const byId = new Map(catalog.map((material) => [material.id, material]));
  const selected = request.materials.map((item) => byId.get(item.materialId)!);
  const pitch = maxMaterialDiameter(selected) + Math.max(request.targetGapMm, request.minimumGapMm);
  const random = createSeededRandom(request.seed.trim());
  const baseCandidates = patternCandidates(request, pitch, limits.maxCandidates, byId, random);
  if (baseCandidates.length >= limits.maxCandidates) {
    return {
      ok: false,
      code: "CANDIDATE_LIMIT",
      message: "Motif aday sayısı güvenlik sınırını aşıyor. Ölçüyü, tekrar sayısını veya yoğunluğu azaltın.",
      errors: [`En fazla ${limits.maxCandidates.toLocaleString("tr-TR")} aday işlenebilir.`],
    };
  }

  const index = new SpatialPlacementIndex(Math.max(1, pitch), request.minimumGapMm);
  const accepted: Placement[] = [];
  const acceptedEntries: IndexedPlacement[] = [];
  const seenPositions = new Set<string>();
  let rejected = 0;
  let considered = 0;
  let placementSequence = 0;
  let reachedPlacementLimit = false;

  for (const base of baseCandidates) {
    const materialId = base.materialId ?? chooseMaterial(request.materials, random);
    const material = byId.get(materialId)!;
    for (const transformed of applyMotifSymmetry(base, request.symmetry, request.radialRepeats)) {
      considered += 1;
      if (considered > limits.maxCandidates) {
        return {
          ok: false,
          code: "CANDIDATE_LIMIT",
          message: "Simetri sonrası aday sayısı güvenlik sınırını aşıyor.",
          errors: [`En fazla ${limits.maxCandidates.toLocaleString("tr-TR")} aday işlenebilir.`],
        };
      }
      if ((considered & 255) === 0 && elapsed(startedAt) > limits.maxDurationMs) {
        return {
          ok: false,
          code: "TIME_LIMIT",
          message: "Motif üretimi süre sınırını aştı. Yoğunluğu, ölçüyü veya tekrar sayısını azaltın.",
          errors: [`Üretim en fazla ${limits.maxDurationMs.toLocaleString("tr-TR")} ms çalışabilir.`],
        };
      }
      const xMm = request.centerXmm + transformed.x;
      const yMm = request.centerYmm + transformed.y;
      const key = positionKey(xMm, yMm);
      if (seenPositions.has(key)) {
        rejected += 1;
        continue;
      }
      seenPositions.add(key);
      let placement: Placement = {
        id: `motif-${hashSeed(request.seed).toString(36)}-${placementSequence}`,
        materialId,
        xMm,
        yMm,
        rotationDeg: normalizeRotation(transformed.rotationDeg),
      };
      placementSequence += 1;
      const initialGeometry = createPlacementGeometry(placement, material);
      let entry: IndexedPlacement = { geometry: initialGeometry, aabb: geometryAabb(initialGeometry) };
      if (!withinBounds(entry.aabb, request)) {
        rejected += 1;
        continue;
      }
      if (collides(entry, index.query(entry.aabb), request.minimumGapMm)) {
        let relaxed = false;
        const previousPlacement = accepted.at(-1);
        const previousEntry = acceptedEntries.at(-1);
        const previousMaterial = previousPlacement ? byId.get(previousPlacement.materialId) : undefined;
        if (
          request.symmetry === "none" && request.pattern !== "geometric" &&
          previousPlacement && previousEntry && previousMaterial
        ) {
          index.remove(previousEntry);
          const baseShift = Math.max(
            0.1,
            (Math.max(request.targetGapMm, request.minimumGapMm) +
              Math.min(material.widthMm, material.heightMm, previousMaterial.widthMm, previousMaterial.heightMm)) / 4,
          );
          for (const factor of [0.5, 1, 1.5]) {
            const previousAngle = degreesToRadians(previousPlacement.rotationDeg);
            const currentAngle = degreesToRadians(placement.rotationDeg);
            const shift = baseShift * factor;
            const shiftedPrevious: Placement = {
              ...previousPlacement,
              xMm: previousPlacement.xMm - Math.cos(previousAngle) * shift,
              yMm: previousPlacement.yMm - Math.sin(previousAngle) * shift,
            };
            const shiftedCurrent: Placement = {
              ...placement,
              xMm: placement.xMm + Math.cos(currentAngle) * shift,
              yMm: placement.yMm + Math.sin(currentAngle) * shift,
            };
            const previousGeometry = createPlacementGeometry(shiftedPrevious, previousMaterial);
            const shiftedPreviousEntry: IndexedPlacement = {
              geometry: previousGeometry,
              aabb: geometryAabb(previousGeometry),
            };
            const currentGeometry = createPlacementGeometry(shiftedCurrent, material);
            const shiftedCurrentEntry: IndexedPlacement = {
              geometry: currentGeometry,
              aabb: geometryAabb(currentGeometry),
            };
            if (
              !withinBounds(shiftedPreviousEntry.aabb, request) ||
              !withinBounds(shiftedCurrentEntry.aabb, request) ||
              collides(shiftedPreviousEntry, index.query(shiftedPreviousEntry.aabb), request.minimumGapMm)
            ) continue;
            index.insert(shiftedPreviousEntry);
            const currentCollides = collides(
              shiftedCurrentEntry,
              index.query(shiftedCurrentEntry.aabb),
              request.minimumGapMm,
            );
            if (currentCollides) {
              index.remove(shiftedPreviousEntry);
              continue;
            }
            accepted[accepted.length - 1] = shiftedPrevious;
            acceptedEntries[acceptedEntries.length - 1] = shiftedPreviousEntry;
            placement = shiftedCurrent;
            entry = shiftedCurrentEntry;
            relaxed = true;
            break;
          }
          if (!relaxed) index.insert(previousEntry);
        }
        if (!relaxed) {
          rejected += 1;
          continue;
        }
      }
      accepted.push(placement);
      acceptedEntries.push(entry);
      index.insert(entry);
      if (accepted.length >= limits.maxPlacements) {
        reachedPlacementLimit = true;
        break;
      }
    }
    if (reachedPlacementLimit) break;
  }

  if (accepted.length === 0) {
    return {
      ok: false,
      code: "NO_VALID_PLACEMENT",
      message: "Seçilen ölçü ve aralıkta geçerli boncuk yerleşimi üretilemedi.",
      errors: ["Yoğunluğu azaltın, motif ölçüsünü büyütün veya daha küçük bir malzeme seçin."],
    };
  }
  const finalValidation = validateAllPlacements(accepted, catalog, request.minimumGapMm);
  if (!finalValidation.valid) {
    return { ok: false, code: "NO_VALID_PLACEMENT", message: "Üretilen motif son geometri doğrulamasını geçemedi.", errors: ["Mevcut geometri kuralları korunarak sonuç reddedildi."] };
  }

  const bounds = selectionAabb(accepted, catalog);
  const warnings: string[] = [];
  if (reachedPlacementLimit) warnings.push(`Üretim ${limits.maxPlacements.toLocaleString("tr-TR")} boncuk güvenlik sınırında durduruldu.`);
  if (rejected > accepted.length / 2) warnings.push("Adayların önemli bir bölümü sınır veya çakışma nedeniyle reddedildi; yoğunluğu azaltmayı ya da motif ölçüsünü büyütmeyi deneyin.");
  const report: MotifGenerationReport = {
    totalCount: accepted.length,
    countsByMaterial: countPlacementsByMaterial(accepted),
    actualWidthMm: bounds ? bounds.maxX - bounds.minX : 0,
    actualHeightMm: bounds ? bounds.maxY - bounds.minY : 0,
    symmetry: request.symmetry,
    targetGapMm: request.targetGapMm,
    minimumGapMm: request.minimumGapMm,
    acceptedCandidates: accepted.length,
    rejectedCandidates: rejected,
    warnings,
    durationMs: elapsed(startedAt),
  };
  return { ok: true, placements: accepted, report };
}
