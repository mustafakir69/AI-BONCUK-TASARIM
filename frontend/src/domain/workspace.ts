export type MeasurementUnit = "mm" | "cm";

export interface WorkspaceDimensions {
  widthMm: number;
  heightMm: number;
}

export const DEFAULT_WORKSPACE: WorkspaceDimensions = {
  widthMm: 200,
  heightMm: 250,
};

export const WORKSPACE_LIMITS = {
  minMm: 1,
  maxMm: 5000,
} as const;

export function toMillimeters(value: number, unit: MeasurementUnit): number {
  return unit === "cm" ? value * 10 : value;
}

export function fromMillimeters(valueMm: number, unit: MeasurementUnit): number {
  return unit === "cm" ? valueMm / 10 : valueMm;
}

export function formatMeasurement(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function validateWorkspaceDimensions(
  widthMm: number,
  heightMm: number,
): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) {
    errors.push("Genişlik ve yükseklik geçerli bir sayı olmalıdır.");
    return errors;
  }

  if (widthMm < WORKSPACE_LIMITS.minMm || heightMm < WORKSPACE_LIMITS.minMm) {
    errors.push(`Ölçüler en az ${WORKSPACE_LIMITS.minMm} mm olmalıdır.`);
  }

  if (widthMm > WORKSPACE_LIMITS.maxMm || heightMm > WORKSPACE_LIMITS.maxMm) {
    errors.push(`Ölçüler en fazla ${WORKSPACE_LIMITS.maxMm} mm olabilir.`);
  }

  return errors;
}

