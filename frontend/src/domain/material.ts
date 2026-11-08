export const MATERIAL_SHAPES = ["square", "rectangle", "circle", "ring"] as const;

export type MaterialShape = (typeof MATERIAL_SHAPES)[number];

export interface Material {
  id: string;
  name: string;
  shape: MaterialShape;
  widthMm: number;
  heightMm: number;
  color: string;
  holeDiameterMm?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDraft {
  name: string;
  shape: MaterialShape;
  widthMm: number;
  heightMm: number;
  color: string;
  holeDiameterMm?: number;
}

export type MaterialField =
  | "name"
  | "shape"
  | "widthMm"
  | "heightMm"
  | "color"
  | "holeDiameterMm";

export type MaterialValidationErrors = Partial<Record<MaterialField, string>>;

export type MaterialRemovalResult =
  | { removed: true; materials: Material[] }
  | { removed: false; materials: Material[]; reason: "MATERIAL_NOT_FOUND" | "MATERIAL_IN_USE" };

export const MATERIAL_MAX_DIMENSION_MM = 1000;
const EQUALITY_EPSILON_MM = 1e-7;

const DEFAULT_CREATED_AT = "2026-11-08T00:00:00.000Z";

export const INITIAL_MATERIALS: readonly Material[] = [
  {
    id: "mat-seed-bead",
    name: "Kum boncuk",
    shape: "square",
    widthMm: 2.5,
    heightMm: 2.5,
    color: "#C99A45",
    active: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "mat-bugle-bead",
    name: "Boru boncuk",
    shape: "rectangle",
    widthMm: 2.5,
    heightMm: 4,
    color: "#6B8EAD",
    active: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "mat-pearl",
    name: "İnci",
    shape: "circle",
    widthMm: 4,
    heightMm: 4,
    color: "#F2EEE3",
    active: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "mat-sequin",
    name: "Pul",
    shape: "ring",
    widthMm: 5,
    heightMm: 5,
    holeDiameterMm: 1.5,
    color: "#D7A2C8",
    active: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

export function cloneInitialMaterials(): Material[] {
  return INITIAL_MATERIALS.map((material) => ({ ...material }));
}

function isPositiveDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MATERIAL_MAX_DIMENSION_MM;
}

function dimensionsAreEqual(widthMm: number, heightMm: number): boolean {
  return Math.abs(widthMm - heightMm) <= EQUALITY_EPSILON_MM;
}

export function isMaterialShape(value: unknown): value is MaterialShape {
  return typeof value === "string" && MATERIAL_SHAPES.includes(value as MaterialShape);
}

export function validateMaterialDraft(draft: MaterialDraft): MaterialValidationErrors {
  const errors: MaterialValidationErrors = {};
  const name = draft.name.trim();

  if (name.length === 0) {
    errors.name = "Malzeme adı boş bırakılamaz.";
  } else if (name.length > 100) {
    errors.name = "Malzeme adı en fazla 100 karakter olabilir.";
  }

  if (!isMaterialShape(draft.shape)) {
    errors.shape = "Geçerli bir malzeme türü seçin.";
  }

  if (!isPositiveDimension(draft.widthMm)) {
    errors.widthMm = `Genişlik 0 ile ${MATERIAL_MAX_DIMENSION_MM} mm arasında olmalıdır.`;
  }

  if (!isPositiveDimension(draft.heightMm)) {
    errors.heightMm = `Yükseklik 0 ile ${MATERIAL_MAX_DIMENSION_MM} mm arasında olmalıdır.`;
  }

  if (!/^#[0-9A-F]{6}$/i.test(draft.color)) {
    errors.color = "Renk #RRGGBB biçiminde olmalıdır.";
  }

  if (
    (draft.shape === "square" || draft.shape === "circle" || draft.shape === "ring") &&
    isPositiveDimension(draft.widthMm) &&
    isPositiveDimension(draft.heightMm) &&
    !dimensionsAreEqual(draft.widthMm, draft.heightMm)
  ) {
    errors.heightMm =
      draft.shape === "square"
        ? "Kare için genişlik ve yükseklik eşit olmalıdır."
        : "Daire çapı için genişlik ve yükseklik eşit olmalıdır.";
  }

  if (draft.shape === "ring") {
    if (!Number.isFinite(draft.holeDiameterMm) || (draft.holeDiameterMm ?? 0) <= 0) {
      errors.holeDiameterMm = "Delik çapı sıfırdan büyük olmalıdır.";
    } else if ((draft.holeDiameterMm ?? 0) >= draft.widthMm) {
      errors.holeDiameterMm = "Delik çapı dış çaptan küçük olmalıdır.";
    }
  }

  return errors;
}

export function hasMaterialValidationErrors(errors: MaterialValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function createMaterial(
  draft: MaterialDraft,
  id: string,
  now = new Date().toISOString(),
): Material {
  const errors = validateMaterialDraft(draft);
  if (hasMaterialValidationErrors(errors)) {
    throw new Error("Geçersiz malzeme taslağı oluşturulamaz.");
  }

  return {
    id,
    name: draft.name.trim(),
    shape: draft.shape,
    widthMm: draft.widthMm,
    heightMm: draft.heightMm,
    color: draft.color.toUpperCase(),
    ...(draft.shape === "ring" ? { holeDiameterMm: draft.holeDiameterMm } : {}),
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateMaterial(
  material: Material,
  draft: MaterialDraft,
  now = new Date().toISOString(),
): Material {
  const updated = createMaterial(draft, material.id, now);
  return {
    ...updated,
    active: material.active,
    createdAt: material.createdAt,
  };
}

export function createMaterialId(existingIds: ReadonlySet<string>): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const baseId = `mat-${randomPart}`;

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
}

export function removeMaterial(
  materials: readonly Material[],
  materialId: string,
  usageCount = 0,
): MaterialRemovalResult {
  if (!materials.some((material) => material.id === materialId)) {
    return { removed: false, materials: [...materials], reason: "MATERIAL_NOT_FOUND" };
  }

  if (usageCount > 0) {
    return { removed: false, materials: [...materials], reason: "MATERIAL_IN_USE" };
  }

  return {
    removed: true,
    materials: materials.filter((material) => material.id !== materialId),
  };
}

export function isMaterial(value: unknown): value is Material {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Material>;
  if (
    typeof candidate.id !== "string" ||
    candidate.id.trim().length === 0 ||
    typeof candidate.name !== "string" ||
    typeof candidate.widthMm !== "number" ||
    typeof candidate.heightMm !== "number" ||
    typeof candidate.color !== "string" ||
    typeof candidate.active !== "boolean" ||
    typeof candidate.createdAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.createdAt)) ||
    typeof candidate.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(candidate.updatedAt)) ||
    !isMaterialShape(candidate.shape)
  ) {
    return false;
  }

  if (
    (candidate.shape === "ring" && typeof candidate.holeDiameterMm !== "number") ||
    (candidate.shape !== "ring" && candidate.holeDiameterMm !== undefined)
  ) {
    return false;
  }

  const draft: MaterialDraft = {
    name: candidate.name,
    shape: candidate.shape,
    widthMm: candidate.widthMm,
    heightMm: candidate.heightMm,
    color: candidate.color,
    holeDiameterMm: candidate.holeDiameterMm,
  };

  return !hasMaterialValidationErrors(validateMaterialDraft(draft));
}

export function formatMillimeters(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(value);
}

