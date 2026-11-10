import type { Material } from "./material";

export const AI_DESIGN_REQUEST_SCHEMA_VERSION = "1.0" as const;
export const AI_DESIGN_PLAN_SCHEMA_VERSION = "1.0" as const;

export const AI_MATERIAL_SELECTION_MODES = ["user-only", "ai-selects", "collaborative"] as const;
export type AiMaterialSelectionMode = (typeof AI_MATERIAL_SELECTION_MODES)[number];

export const AI_SYMMETRY_PREFERENCES = ["none", "optional", "horizontal", "vertical", "four-way", "radial"] as const;
export type AiSymmetryPreference = (typeof AI_SYMMETRY_PREFERENCES)[number];

export interface AiReferenceImageDescriptor {
  name: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  widthPx: number;
  heightPx: number;
}

export interface AiDesignRequest {
  schemaVersion: typeof AI_DESIGN_REQUEST_SCHEMA_VERSION;
  prompt: string;
  referenceImage?: AiReferenceImageDescriptor;
  target: { widthMm: number; heightMm: number };
  materialSelection: {
    mode: AiMaterialSelectionMode;
    selectedMaterialIds: string[];
  };
  constraints: {
    minimumGapMm: number;
    targetGapMm: number;
    densityPercent: number;
    symmetry: AiSymmetryPreference;
    maxPlacements: number;
  };
}

export type AiPlanComponentKind = "path" | "region" | "cluster" | "accent" | "border";
export type AiPlacementStrategy = "follow-path" | "fill-region" | "edge" | "scatter" | "cluster";
export type AiPlanGeometryType =
  | "line" | "polyline" | "bezier" | "ellipse" | "rectangle" | "point-cluster" | "unsupported";

export interface AiPlanPoint {
  xMm: number;
  yMm: number;
}

export interface AiPlanComponentGeometry {
  type: AiPlanGeometryType;
  points: AiPlanPoint[];
  closed: boolean;
  interpretationNote: string;
}

export interface AiDesignPlanComponent {
  id: string;
  kind: AiPlanComponentKind;
  label: string;
  centerXmm: number;
  centerYmm: number;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
  layer: number;
  priority: number;
  geometry?: AiPlanComponentGeometry;
  placement: {
    strategy: AiPlacementStrategy;
    materialIds: string[];
    targetGapMm: number;
    densityPercent: number;
    maxPlacements: number;
  };
}

export interface AiDesignPlan {
  schemaVersion: typeof AI_DESIGN_PLAN_SCHEMA_VERSION;
  description: string;
  target: { widthMm: number; heightMm: number };
  materialIds: string[];
  components: AiDesignPlanComponent[];
  densityRegions: Array<{
    id: string;
    centerXmm: number;
    centerYmm: number;
    widthMm: number;
    heightMm: number;
    densityPercent: number;
    layer: number;
  }>;
  symmetry: { type: AiSymmetryPreference; repeatCount?: number | null };
  placementInstructions: string[];
  warnings: string[];
  uncertainties: string[];
}

export interface AiValidationIssue {
  path: string;
  message: string;
}

export type AiValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: AiValidationIssue[] };

const MAX_PROMPT_LENGTH = 10_000;
const MAX_PLAN_COMPONENTS = 200;
const MAX_DENSITY_REGIONS = 100;
const MAX_PLAN_TEXT_ITEMS = 50;
const MAX_TEXT_LENGTH = 2_000;
const MAX_PLACEMENTS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isShortText(value: unknown, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= MAX_TEXT_LENGTH && (allowEmpty || value.trim().length > 0);
}

function uniqueStrings(value: unknown, maximum: number): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every((item) => isShortText(item)) &&
    new Set(value).size === value.length;
}

export function allowedMaterialIdsForRequest(
  request: AiDesignRequest,
  catalog: readonly Material[],
): Set<string> {
  if (request.materialSelection.mode === "user-only") {
    return new Set(request.materialSelection.selectedMaterialIds);
  }
  return new Set(catalog.filter((material) => material.active).map((material) => material.id));
}

export function requiredMaterialIdsForRequest(request: AiDesignRequest): Set<string> {
  return request.materialSelection.mode === "collaborative"
    ? new Set(request.materialSelection.selectedMaterialIds)
    : new Set();
}

export function validateAiDesignRequest(
  request: AiDesignRequest,
  catalog: readonly Material[],
): AiValidationResult<AiDesignRequest> {
  const issues: AiValidationIssue[] = [];
  if (request.schemaVersion !== AI_DESIGN_REQUEST_SCHEMA_VERSION) {
    issues.push({ path: "schemaVersion", message: "AI tasarım isteği sürümü desteklenmiyor." });
  }
  const prompt = request.prompt.trim();
  if (!request.referenceImage && prompt.length === 0) {
    issues.push({ path: "prompt", message: "Bir tasarım tarifi yazın veya referans görsel ekleyin." });
  } else if (request.prompt.length > MAX_PROMPT_LENGTH) {
    issues.push({ path: "prompt", message: `Tasarım tarifi en fazla ${MAX_PROMPT_LENGTH.toLocaleString("tr-TR")} karakter olabilir.` });
  }
  if (request.referenceImage) {
    const image = request.referenceImage;
    if (
      !isShortText(image.name) ||
      !(["image/jpeg", "image/png", "image/webp"] as const).includes(image.mimeType) ||
      !Number.isInteger(image.sizeBytes) || image.sizeBytes < 1 || image.sizeBytes > 8 * 1024 * 1024 ||
      !Number.isInteger(image.widthPx) || !Number.isInteger(image.heightPx) ||
      image.widthPx < 1 || image.heightPx < 1 || image.widthPx > 8_192 || image.heightPx > 8_192 ||
      image.widthPx * image.heightPx > 32_000_000
    ) issues.push({ path: "referenceImage", message: "Referans görsel üst verisi güvenlik sınırlarını sağlamıyor." });
  }
  if (!finiteInRange(request.target.widthMm, 1, 5_000) || !finiteInRange(request.target.heightMm, 1, 5_000)) {
    issues.push({ path: "target", message: "Hedef genişlik ve yükseklik 1–5.000 mm arasında olmalıdır." });
  }
  if (!AI_MATERIAL_SELECTION_MODES.includes(request.materialSelection.mode)) {
    issues.push({ path: "materialSelection.mode", message: "Geçerli bir malzeme seçim modu seçin." });
  }
  const activeIds = new Set(catalog.filter((material) => material.active).map((material) => material.id));
  const selectedIds = request.materialSelection.selectedMaterialIds;
  if (new Set(selectedIds).size !== selectedIds.length) {
    issues.push({ path: "materialSelection.selectedMaterialIds", message: "Aynı malzeme birden fazla kez seçilemez." });
  }
  if (selectedIds.some((id) => !activeIds.has(id))) {
    issues.push({ path: "materialSelection.selectedMaterialIds", message: "Seçim yalnız etkin katalog malzemelerini içerebilir." });
  }
  if ((request.materialSelection.mode === "user-only" || request.materialSelection.mode === "collaborative") && selectedIds.length === 0) {
    issues.push({ path: "materialSelection.selectedMaterialIds", message: "Bu modda en az bir katalog malzemesi seçin." });
  }
  if (request.materialSelection.mode === "ai-selects" && activeIds.size === 0) {
    issues.push({ path: "materialSelection", message: "AI seçimi için en az bir etkin katalog malzemesi gerekir." });
  }
  if (!finiteInRange(request.constraints.minimumGapMm, 0, 100)) {
    issues.push({ path: "constraints.minimumGapMm", message: "Minimum güvenlik aralığı 0–100 mm arasında olmalıdır." });
  }
  if (!finiteInRange(request.constraints.targetGapMm, 0, 100)) {
    issues.push({ path: "constraints.targetGapMm", message: "Hedef boncuk aralığı 0–100 mm arasında olmalıdır." });
  }
  if (!finiteInRange(request.constraints.densityPercent, 1, 100)) {
    issues.push({ path: "constraints.densityPercent", message: "Tasarım yoğunluğu %1–%100 arasında olmalıdır." });
  }
  if (!AI_SYMMETRY_PREFERENCES.includes(request.constraints.symmetry)) {
    issues.push({ path: "constraints.symmetry", message: "Geçerli bir simetri tercihi seçin." });
  }
  if (!Number.isInteger(request.constraints.maxPlacements) || request.constraints.maxPlacements < 1 || request.constraints.maxPlacements > MAX_PLACEMENTS) {
    issues.push({ path: "constraints.maxPlacements", message: `Maksimum boncuk sayısı 1–${MAX_PLACEMENTS.toLocaleString("tr-TR")} arasında tam sayı olmalıdır.` });
  }
  return issues.length > 0 ? { ok: false, issues } : {
    ok: true,
    value: {
      ...request,
      prompt,
      materialSelection: { ...request.materialSelection, selectedMaterialIds: [...selectedIds] },
    },
  };
}

function validateMaterialIds(
  value: unknown,
  path: string,
  allowedIds: ReadonlySet<string>,
  issues: AiValidationIssue[],
): value is string[] {
  if (!uniqueStrings(value, 100) || value.length === 0) {
    issues.push({ path, message: "Malzeme kimlikleri benzersiz ve sınırlı bir dizi olmalıdır." });
    return false;
  }
  if (value.some((id) => !allowedIds.has(id))) {
    issues.push({ path, message: "Plan katalog dışı veya bu istekte izin verilmeyen malzeme içeriyor." });
    return false;
  }
  return true;
}

function validateTextList(value: unknown, path: string, issues: AiValidationIssue[]): value is string[] {
  if (!Array.isArray(value) || value.length > MAX_PLAN_TEXT_ITEMS || !value.every((item) => isShortText(item))) {
    issues.push({ path, message: "Metin listesi geçersiz veya güvenlik sınırını aşıyor." });
    return false;
  }
  return true;
}

export function parseAiDesignPlan(
  value: unknown,
  request: AiDesignRequest,
  catalog: readonly Material[],
): AiValidationResult<AiDesignPlan> {
  const issues: AiValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: "$", message: "AI çıktısı bir tasarım planı nesnesi olmalıdır." }] };
  if (value.schemaVersion !== AI_DESIGN_PLAN_SCHEMA_VERSION) issues.push({ path: "schemaVersion", message: "Tasarım planı sürümü desteklenmiyor." });
  if (!isShortText(value.description)) issues.push({ path: "description", message: "Tasarım açıklaması zorunlu ve sınırlı uzunlukta olmalıdır." });

  const target = value.target;
  if (!isRecord(target) || !finiteInRange(target.widthMm, 1, 5_000) || !finiteInRange(target.heightMm, 1, 5_000)) {
    issues.push({ path: "target", message: "Plan hedef ölçüleri geçersiz." });
  } else if (target.widthMm !== request.target.widthMm || target.heightMm !== request.target.heightMm) {
    issues.push({ path: "target", message: "Plan hedef ölçüleri doğrulanmış kullanıcı isteğiyle aynı olmalıdır." });
  }

  const allowedIds = allowedMaterialIdsForRequest(request, catalog);
  const materialIdsValid = validateMaterialIds(value.materialIds, "materialIds", allowedIds, issues);
  const planMaterialIds = materialIdsValid ? new Set(value.materialIds as string[]) : new Set<string>();
  for (const requiredId of requiredMaterialIdsForRequest(request)) {
    if (!planMaterialIds.has(requiredId)) issues.push({ path: "materialIds", message: `Zorunlu malzeme planda eksik: ${requiredId}.` });
  }

  const componentKinds: readonly AiPlanComponentKind[] = ["path", "region", "cluster", "accent", "border"];
  const strategies: readonly AiPlacementStrategy[] = ["follow-path", "fill-region", "edge", "scatter", "cluster"];
  const components = value.components;
  const componentIds = new Set<string>();
  let requestedPlacements = 0;
  if (!Array.isArray(components) || components.length === 0 || components.length > MAX_PLAN_COMPONENTS) {
    issues.push({ path: "components", message: `Plan 1–${MAX_PLAN_COMPONENTS} motif bileşeni içermelidir.` });
  } else {
    components.forEach((component, index) => {
      const path = `components[${index}]`;
      if (!isRecord(component)) {
        issues.push({ path, message: "Motif bileşeni nesne olmalıdır." });
        return;
      }
      if (!isShortText(component.id) || componentIds.has(component.id as string)) issues.push({ path: `${path}.id`, message: "Bileşen kimliği boş veya yinelenmiş." });
      else componentIds.add(component.id);
      if (!componentKinds.includes(component.kind as AiPlanComponentKind)) issues.push({ path: `${path}.kind`, message: "Bileşen türü geçersiz." });
      if (!isShortText(component.label)) issues.push({ path: `${path}.label`, message: "Bileşen etiketi geçersiz." });
      const withinX = finiteInRange(component.centerXmm, -request.target.widthMm / 2, request.target.widthMm / 2);
      const withinY = finiteInRange(component.centerYmm, -request.target.heightMm / 2, request.target.heightMm / 2);
      if (!withinX || !withinY) issues.push({ path, message: "Bileşen merkezi hedef motif koordinatlarının dışında." });
      if (!finiteInRange(component.widthMm, 0.01, request.target.widthMm) || !finiteInRange(component.heightMm, 0.01, request.target.heightMm)) issues.push({ path, message: "Bileşen boyutları geçersiz." });
      if (!finiteInRange(component.rotationDeg, 0, 359.999999)) issues.push({ path: `${path}.rotationDeg`, message: "Dönüş açısı [0, 360) aralığında olmalıdır." });
      if (!Number.isInteger(component.layer) || !finiteInRange(component.layer, 0, 1_000) || !Number.isInteger(component.priority) || !finiteInRange(component.priority, 0, 1_000)) issues.push({ path, message: "Katman ve öncelik 0–1.000 arasında tam sayı olmalıdır." });
      if (component.geometry !== undefined) {
        const geometry = component.geometry;
        const geometryTypes: readonly AiPlanGeometryType[] = ["line", "polyline", "bezier", "ellipse", "rectangle", "point-cluster", "unsupported"];
        if (!isRecord(geometry) || !geometryTypes.includes(geometry.type as AiPlanGeometryType) ||
          !Array.isArray(geometry.points) || geometry.points.length > 100 ||
          !geometry.points.every((point) => isRecord(point) &&
            finiteInRange(point.xMm, -request.target.widthMm / 2, request.target.widthMm / 2) &&
            finiteInRange(point.yMm, -request.target.heightMm / 2, request.target.heightMm / 2)) ||
          typeof geometry.closed !== "boolean" || !isShortText(geometry.interpretationNote)) {
          issues.push({ path: `${path}.geometry`, message: "Bileşen geometrisi geçersiz veya hedef koordinatlarının dışında." });
        }
      }
      if (!isRecord(component.placement)) {
        issues.push({ path: `${path}.placement`, message: "Yerleşim üretim talimatı eksik." });
        return;
      }
      const placement = component.placement;
      if (!strategies.includes(placement.strategy as AiPlacementStrategy)) issues.push({ path: `${path}.placement.strategy`, message: "Yerleşim stratejisi geçersiz." });
      validateMaterialIds(placement.materialIds, `${path}.placement.materialIds`, planMaterialIds, issues);
      if (!finiteInRange(placement.targetGapMm, 0, 100) || !finiteInRange(placement.densityPercent, 1, 100)) issues.push({ path: `${path}.placement`, message: "Yerleşim aralığı veya yoğunluğu geçersiz." });
      if (!Number.isInteger(placement.maxPlacements) || !finiteInRange(placement.maxPlacements, 1, MAX_PLACEMENTS)) issues.push({ path: `${path}.placement.maxPlacements`, message: "Bileşen boncuk sınırı geçersiz." });
      else requestedPlacements += placement.maxPlacements;
    });
  }
  if (requestedPlacements > request.constraints.maxPlacements) issues.push({ path: "components", message: "Bileşen boncuk sınırlarının toplamı kullanıcı üst sınırını aşıyor." });

  const regions = value.densityRegions;
  const regionIds = new Set<string>();
  if (!Array.isArray(regions) || regions.length > MAX_DENSITY_REGIONS) {
    issues.push({ path: "densityRegions", message: `Plan en fazla ${MAX_DENSITY_REGIONS} yoğunluk bölgesi içerebilir.` });
  } else {
    regions.forEach((region, index) => {
      const path = `densityRegions[${index}]`;
      if (!isRecord(region)) {
        issues.push({ path, message: "Yoğunluk bölgesi nesne olmalıdır." });
        return;
      }
      if (!isShortText(region.id) || regionIds.has(region.id as string)) issues.push({ path: `${path}.id`, message: "Yoğunluk bölgesi kimliği boş veya yinelenmiş." });
      else regionIds.add(region.id);
      if (!finiteInRange(region.centerXmm, -request.target.widthMm / 2, request.target.widthMm / 2) || !finiteInRange(region.centerYmm, -request.target.heightMm / 2, request.target.heightMm / 2) || !finiteInRange(region.widthMm, 0.01, request.target.widthMm) || !finiteInRange(region.heightMm, 0.01, request.target.heightMm) || !finiteInRange(region.densityPercent, 1, 100) || !Number.isInteger(region.layer) || !finiteInRange(region.layer, 0, 1_000)) {
        issues.push({ path, message: "Yoğunluk bölgesinin koordinat, boyut, yoğunluk veya katman değeri geçersiz." });
      }
    });
  }

  const symmetry = value.symmetry;
  if (!isRecord(symmetry) || !AI_SYMMETRY_PREFERENCES.includes(symmetry.type as AiSymmetryPreference)) {
    issues.push({ path: "symmetry", message: "Simetri talimatı geçersiz." });
  } else if (symmetry.type === "radial" && (!Number.isInteger(symmetry.repeatCount) || !finiteInRange(symmetry.repeatCount, 3, 12))) {
    issues.push({ path: "symmetry.repeatCount", message: "Radyal tekrar 3–12 arasında tam sayı olmalıdır." });
  }
  validateTextList(value.placementInstructions, "placementInstructions", issues);
  validateTextList(value.warnings, "warnings", issues);
  validateTextList(value.uncertainties, "uncertainties", issues);

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as AiDesignPlan };
}
