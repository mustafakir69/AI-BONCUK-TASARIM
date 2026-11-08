import { validateAllPlacements } from "./geometry/validation";
import type { PlacementGroup } from "./group";
import { isMaterial, type Material } from "./material";
import { validateMotifDimensions, type MotifDimensions } from "./motif";
import { normalizeRotation, type Placement } from "./placement";

export const PROJECT_SCHEMA_VERSION = "1.1" as const;
export const LEGACY_PROJECT_SCHEMA_VERSION = "1.0" as const;

export interface DesignProject {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  motif: MotifDimensions;
  settings: {
    minimumGapMm: number;
    keyboardStepMm: number;
    keyboardShiftStepMm: number;
  };
  materials: Material[];
  placements: Placement[];
  groups: PlacementGroup[];
}

export interface ProjectContent {
  name: string;
  motif: MotifDimensions;
  minimumGapMm: number;
  keyboardStepMm: number;
  keyboardShiftStepMm: number;
  materials: readonly Material[];
  placements: readonly Placement[];
  groups: readonly PlacementGroup[];
}

export type ProjectParseResult =
  | { ok: true; project: DesignProject }
  | { ok: false; error: string };

export interface ResolvedProjectImport {
  project: DesignProject;
  catalog: Material[];
  conflictCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidPlacement(value: unknown): value is Placement {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" && value.id.trim().length > 0 &&
    typeof value.materialId === "string" && value.materialId.trim().length > 0 &&
    typeof value.xMm === "number" && Number.isFinite(value.xMm) &&
    typeof value.yMm === "number" && Number.isFinite(value.yMm) &&
    typeof value.rotationDeg === "number" && Number.isFinite(value.rotationDeg) &&
    (value.colorOverride === undefined ||
      (typeof value.colorOverride === "string" && /^#[0-9A-F]{6}$/i.test(value.colorOverride)))
  );
}

function parseGroups(value: unknown, placementIds: ReadonlySet<string>): PlacementGroup[] | null {
  if (!Array.isArray(value)) return null;
  const result: PlacementGroup[] = [];
  const groupIds = new Set<string>();
  const groupedPlacements = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim() ||
      !Array.isArray(item.placementIds) || item.placementIds.length < 2 ||
      !item.placementIds.every((id) => typeof id === "string" && placementIds.has(id))) return null;
    const ids = item.placementIds as string[];
    if (new Set(ids).size !== ids.length || groupIds.has(item.id) || ids.some((id) => groupedPlacements.has(id))) return null;
    groupIds.add(item.id);
    ids.forEach((id) => groupedPlacements.add(id));
    result.push({ id: item.id, placementIds: [...ids] });
  }
  return result;
}

function materialDefinitionEquals(a: Material, b: Material): boolean {
  return (
    a.name === b.name && a.shape === b.shape && a.widthMm === b.widthMm &&
    a.heightMm === b.heightMm && a.color.toUpperCase() === b.color.toUpperCase() &&
    a.holeDiameterMm === b.holeDiameterMm && a.active === b.active
  );
}

function importId(baseId: string, ids: ReadonlySet<string>): string {
  const base = `${baseId}-proje`;
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function usedMaterials(materials: readonly Material[], placements: readonly Placement[]): Material[] {
  const usedIds = new Set(placements.map((placement) => placement.materialId));
  return materials.filter((material) => usedIds.has(material.id)).map((material) => ({ ...material }));
}

export function createProjectId(): string {
  const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `project-${randomPart}`;
}

export function createProjectDocument(
  metadata: Pick<DesignProject, "id" | "name" | "createdAt" | "updatedAt">,
  content: Omit<ProjectContent, "name">,
): DesignProject {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    ...metadata,
    name: metadata.name.trim() || "İsimsiz tasarım",
    motif: { ...content.motif },
    settings: {
      minimumGapMm: content.minimumGapMm,
      keyboardStepMm: content.keyboardStepMm,
      keyboardShiftStepMm: content.keyboardShiftStepMm,
    },
    materials: usedMaterials(content.materials, content.placements),
    placements: content.placements.map((placement) => ({ ...placement })),
    groups: content.groups.map((group) => ({ ...group, placementIds: [...group.placementIds] })),
  };
}

export function serializeProject(project: DesignProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseProjectJson(text: string): ProjectParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Dosya geçerli JSON biçiminde değil." };
  }
  if (!isRecord(value)) return { ok: false, error: "Proje dosyasının kök nesnesi geçersiz." };
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION && value.schemaVersion !== LEGACY_PROJECT_SCHEMA_VERSION) {
    return { ok: false, error: `Desteklenmeyen proje biçimi: ${String(value.schemaVersion ?? "sürüm yok")}.` };
  }
  if (
    typeof value.id !== "string" || !value.id.trim() ||
    typeof value.name !== "string" || !value.name.trim() || value.name.length > 120 ||
    !isIsoDate(value.createdAt) || !isIsoDate(value.updatedAt) ||
    !isRecord(value.motif) || typeof value.motif.widthMm !== "number" ||
    typeof value.motif.heightMm !== "number" ||
    validateMotifDimensions(value.motif.widthMm, value.motif.heightMm).length > 0 ||
    !isRecord(value.settings) || typeof value.settings.minimumGapMm !== "number" ||
    !Number.isFinite(value.settings.minimumGapMm) || value.settings.minimumGapMm < 0 ||
    value.settings.minimumGapMm > 100 || !Array.isArray(value.materials) ||
    !Array.isArray(value.placements)
  ) return { ok: false, error: "Proje üst bilgileri, motif ölçüleri veya minimum aralık geçersiz." };

  if (!value.materials.every(isMaterial)) {
    return { ok: false, error: "Proje malzeme kayıtlarından en az biri geçersiz." };
  }
  const materials = value.materials.map((material) => ({ ...material }));
  const materialIds = new Set(materials.map((material) => material.id));
  if (materialIds.size !== materials.length) {
    return { ok: false, error: "Proje malzeme kimlikleri benzersiz olmalıdır." };
  }
  if (!value.placements.every(isValidPlacement)) {
    return { ok: false, error: "Yerleşim kayıtlarından en az biri geçersiz veya sonlu olmayan sayı içeriyor." };
  }
  const placements = value.placements.map((placement) => ({
    ...placement,
    rotationDeg: normalizeRotation(placement.rotationDeg),
  }));
  const placementIds = new Set(placements.map((placement) => placement.id));
  if (placementIds.size !== placements.length) {
    return { ok: false, error: "Yerleşim kimlikleri benzersiz olmalıdır." };
  }
  if (placements.some((placement) => !materialIds.has(placement.materialId))) {
    return { ok: false, error: "Bir yerleşimin başvurduğu malzeme proje dosyasında bulunamadı." };
  }
  const legacy = value.schemaVersion === LEGACY_PROJECT_SCHEMA_VERSION;
  const keyboardStepMm = legacy ? 0.5 : value.settings.keyboardStepMm;
  const keyboardShiftStepMm = legacy ? 5 : value.settings.keyboardShiftStepMm;
  if (
    typeof keyboardStepMm !== "number" || !Number.isFinite(keyboardStepMm) || keyboardStepMm <= 0 || keyboardStepMm > 100 ||
    typeof keyboardShiftStepMm !== "number" || !Number.isFinite(keyboardShiftStepMm) || keyboardShiftStepMm <= 0 || keyboardShiftStepMm > 1000
  ) return { ok: false, error: "Klavye taşıma ayarları geçersiz." };
  const groups = parseGroups(legacy ? [] : value.groups, placementIds);
  if (!groups) return { ok: false, error: "Proje grup kayıtları geçersiz veya çakışan üyelik içeriyor." };
  const geometry = validateAllPlacements(placements, materials, value.settings.minimumGapMm);
  if (!geometry.valid) {
    const code = geometry.issues[0]?.code;
    return {
      ok: false,
      error: code === "OVERLAP"
        ? "Proje çakışan yerleşimler içeriyor."
        : code === "MIN_GAP_VIOLATION"
          ? "Proje minimum malzeme aralığını ihlal ediyor."
          : "Proje geometrisi geçersiz.",
    };
  }
  return {
    ok: true,
    project: {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id: value.id,
      name: value.name.trim(),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      motif: { widthMm: value.motif.widthMm, heightMm: value.motif.heightMm },
      settings: { minimumGapMm: value.settings.minimumGapMm, keyboardStepMm, keyboardShiftStepMm },
      materials,
      placements,
      groups,
    },
  };
}

export function resolveProjectImport(
  project: DesignProject,
  localCatalog: readonly Material[],
): ResolvedProjectImport {
  const catalog = localCatalog.map((material) => ({ ...material }));
  const ids = new Set(catalog.map((material) => material.id));
  const idMap = new Map<string, string>();
  let conflictCount = 0;

  for (const incoming of project.materials) {
    const local = catalog.find((material) => material.id === incoming.id);
    if (!local) {
      catalog.push({ ...incoming });
      ids.add(incoming.id);
      idMap.set(incoming.id, incoming.id);
    } else if (materialDefinitionEquals(local, incoming)) {
      idMap.set(incoming.id, incoming.id);
    } else {
      const nextId = importId(incoming.id, ids);
      catalog.push({ ...incoming, id: nextId });
      ids.add(nextId);
      idMap.set(incoming.id, nextId);
      conflictCount += 1;
    }
  }

  const placements = project.placements.map((placement) => ({
    ...placement,
    materialId: idMap.get(placement.materialId) ?? placement.materialId,
  }));
  const projectMaterials = usedMaterials(catalog, placements);
  return {
    conflictCount,
    catalog,
    project: { ...project, materials: projectMaterials, placements },
  };
}

export function projectContentFingerprint(content: ProjectContent): string {
  const materials = usedMaterials(content.materials, content.placements)
    .map((material) => ({
      id: material.id,
      name: material.name,
      shape: material.shape,
      widthMm: material.widthMm,
      heightMm: material.heightMm,
      color: material.color,
      holeDiameterMm: material.holeDiameterMm,
      active: material.active,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({
    name: content.name.trim() || "İsimsiz tasarım",
    motif: content.motif,
    minimumGapMm: content.minimumGapMm,
    keyboardStepMm: content.keyboardStepMm,
    keyboardShiftStepMm: content.keyboardShiftStepMm,
    materials,
    placements: content.placements,
    groups: content.groups,
  });
}
