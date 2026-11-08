import { selectionAabb } from "./editing";
import { distanceBetweenGeometries, geometriesOverlap } from "./geometry/intersections";
import { aabbDistance, EPSILON_MM, geometryAabb, type Aabb, type PlacementGeometry } from "./geometry/primitives";
import { createPlacementGeometry, degreesToRadians, rotatePoint } from "./geometry/transforms";
import { validateAllPlacements } from "./geometry/validation";
import type { Material } from "./material";
import { countPlacementsByMaterial, normalizeRotation, type Placement } from "./placement";

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
  const pitch = maxMaterialDiameter(selected) + request.minimumGapMm;
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
  return { estimatedCount, capacity: Math.min(areaCapacity, limits.maxPlacements), suitable: warnings.length === 0, warnings, errors: [] };
}

function pushLimited(target: PatternCandidate[], candidate: PatternCandidate, limit: number): boolean {
  if (target.length >= limit) return false;
  target.push(candidate);
  return true;
}

function patternCandidates(request: MotifGenerationRequest, pitch: number, limit: number): PatternCandidate[] {
  const result: PatternCandidate[] = [];
  const halfWidth = request.widthMm / 2;
  const halfHeight = request.heightMm / 2;
  const usableHalfWidth = Math.max(0, halfWidth - pitch / 2);
  const usableHalfHeight = Math.max(0, halfHeight - pitch / 2);

  if (request.pattern === "line") {
    const lines = request.repeatCount;
    for (let line = 0; line < lines; line += 1) {
      const y = lines === 1 ? 0 : -usableHalfHeight + (2 * usableHalfHeight * line) / (lines - 1);
      const steps = Math.max(1, Math.floor((2 * usableHalfWidth) / pitch));
      for (let step = 0; step <= steps; step += 1) {
        const x = steps === 0 ? 0 : -usableHalfWidth + (2 * usableHalfWidth * step) / steps;
        if (!pushLimited(result, { x, y, rotationDeg: 0 }, limit)) return result;
      }
    }
    return result;
  }

  if (request.pattern === "ring") {
    for (let ring = 1; ring <= request.repeatCount; ring += 1) {
      const ratio = ring / request.repeatCount;
      const rx = usableHalfWidth * ratio;
      const ry = usableHalfHeight * ratio;
      const circumference = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
      const steps = Math.max(1, Math.floor(circumference / pitch));
      for (let step = 0; step < steps; step += 1) {
        const angle = (2 * Math.PI * step) / steps;
        if (!pushLimited(result, {
          x: rx * Math.cos(angle), y: ry * Math.sin(angle),
          rotationDeg: normalizeRotation((angle * 180) / Math.PI + 90),
        }, limit)) return result;
      }
    }
    return result;
  }

  if (request.pattern === "spiral") {
    const turns = request.repeatCount;
    const approximateLength = Math.PI * turns * Math.max(usableHalfWidth, usableHalfHeight);
    const steps = Math.max(2, Math.floor(approximateLength / pitch));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const angle = 2 * Math.PI * turns * ratio;
      const x = usableHalfWidth * ratio * Math.cos(angle);
      const y = usableHalfHeight * ratio * Math.sin(angle);
      const nextAngle = angle + 0.001;
      const nextRatio = Math.min(1, ratio + 0.001);
      const dx = usableHalfWidth * nextRatio * Math.cos(nextAngle) - x;
      const dy = usableHalfHeight * nextRatio * Math.sin(nextAngle) - y;
      if (!pushLimited(result, { x, y, rotationDeg: normalizeRotation((Math.atan2(dy, dx) * 180) / Math.PI) }, limit)) return result;
    }
    return result;
  }

  if (request.pattern === "wave") {
    const steps = Math.max(1, Math.floor((2 * usableHalfWidth) / pitch));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const x = -usableHalfWidth + 2 * usableHalfWidth * ratio;
      const phase = 2 * Math.PI * request.repeatCount * ratio;
      const y = usableHalfHeight * Math.sin(phase);
      const slope = usableHalfHeight * Math.cos(phase) * 2 * Math.PI * request.repeatCount / Math.max(EPSILON_MM, 2 * usableHalfWidth);
      if (!pushLimited(result, { x, y, rotationDeg: normalizeRotation((Math.atan2(slope, 1) * 180) / Math.PI) }, limit)) return result;
    }
    return result;
  }

  if (request.pattern === "flower") {
    const petals = Math.max(3, request.repeatCount);
    const circumference = 2 * Math.PI * Math.max(usableHalfWidth, usableHalfHeight);
    const steps = Math.max(petals * 4, Math.floor(circumference / pitch));
    for (let step = 0; step < steps; step += 1) {
      const angle = (2 * Math.PI * step) / steps;
      const radius = 0.62 + 0.38 * Math.cos(petals * angle);
      const x = usableHalfWidth * radius * Math.cos(angle);
      const y = usableHalfHeight * radius * Math.sin(angle);
      const next = angle + 0.001;
      const nextRadius = 0.62 + 0.38 * Math.cos(petals * next);
      const dx = usableHalfWidth * nextRadius * Math.cos(next) - x;
      const dy = usableHalfHeight * nextRadius * Math.sin(next) - y;
      if (!pushLimited(result, { x, y, rotationDeg: normalizeRotation((Math.atan2(dy, dx) * 180) / Math.PI) }, limit)) return result;
    }
    return result;
  }

  const columns = Math.max(1, Math.floor((2 * usableHalfWidth) / pitch));
  const rows = Math.max(1, Math.floor((2 * usableHalfHeight) / pitch));
  for (let row = 0; row <= rows; row += 1) {
    const y = rows === 0 ? 0 : -usableHalfHeight + (2 * usableHalfHeight * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const stagger = row % 2 === 1 ? pitch / 2 : 0;
      const x = -usableHalfWidth + (2 * usableHalfWidth * column) / columns + stagger;
      if (x > usableHalfWidth + EPSILON_MM) continue;
      const rotationDeg = ((row + column) % Math.max(1, request.repeatCount)) * (180 / Math.max(1, request.repeatCount));
      if (!pushLimited(result, { x, y, rotationDeg: normalizeRotation(rotationDeg) }, limit)) return result;
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
    return [candidate, { x: candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(-candidate.rotationDeg) }];
  }
  if (symmetry === "vertical") {
    return [candidate, { x: -candidate.x, y: candidate.y, rotationDeg: normalizeRotation(180 - candidate.rotationDeg) }];
  }
  if (symmetry === "four-way") {
    return [
      candidate,
      { x: candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(-candidate.rotationDeg) },
      { x: -candidate.x, y: candidate.y, rotationDeg: normalizeRotation(180 - candidate.rotationDeg) },
      { x: -candidate.x, y: -candidate.y, rotationDeg: normalizeRotation(180 + candidate.rotationDeg) },
    ];
  }
  if (symmetry === "radial") {
    const result: PatternCandidate[] = [];
    for (let index = 0; index < radialRepeats; index += 1) {
      const degrees = (360 * index) / radialRepeats;
      const rotated = rotatePoint(candidate, degreesToRadians(degrees));
      result.push({ x: rotated.x, y: rotated.y, rotationDeg: normalizeRotation(candidate.rotationDeg + degrees) });
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
  const pitch = maxMaterialDiameter(selected) + request.minimumGapMm;
  const baseCandidates = patternCandidates(request, pitch, limits.maxCandidates);
  if (baseCandidates.length >= limits.maxCandidates) {
    return {
      ok: false,
      code: "CANDIDATE_LIMIT",
      message: "Motif aday sayısı güvenlik sınırını aşıyor. Ölçüyü, tekrar sayısını veya yoğunluğu azaltın.",
      errors: [`En fazla ${limits.maxCandidates.toLocaleString("tr-TR")} aday işlenebilir.`],
    };
  }

  const random = createSeededRandom(request.seed.trim());
  const index = new SpatialPlacementIndex(Math.max(1, pitch), request.minimumGapMm);
  const accepted: Placement[] = [];
  const seenPositions = new Set<string>();
  let rejected = 0;
  let considered = 0;
  let placementSequence = 0;
  let reachedPlacementLimit = false;

  for (const base of baseCandidates) {
    if (request.densityPercent < 100 && random() * 100 >= request.densityPercent) continue;
    const materialId = chooseMaterial(request.materials, random);
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
      const placement: Placement = {
        id: `motif-${hashSeed(request.seed).toString(36)}-${placementSequence}`,
        materialId,
        xMm,
        yMm,
        rotationDeg: normalizeRotation(transformed.rotationDeg),
      };
      placementSequence += 1;
      const geometry = createPlacementGeometry(placement, material);
      const entry = { geometry, aabb: geometryAabb(geometry) };
      if (!withinBounds(entry.aabb, request) || collides(entry, index.query(entry.aabb), request.minimumGapMm)) {
        rejected += 1;
        continue;
      }
      accepted.push(placement);
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
    minimumGapMm: request.minimumGapMm,
    acceptedCandidates: accepted.length,
    rejectedCandidates: rejected,
    warnings,
    durationMs: elapsed(startedAt),
  };
  return { ok: true, placements: accepted, report };
}
