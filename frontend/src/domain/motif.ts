export type MeasurementUnit = "mm" | "cm";

export interface MotifDimensions {
  widthMm: number;
  heightMm: number;
}

export const DEFAULT_MOTIF: MotifDimensions = {
  widthMm: 200,
  heightMm: 250,
};

export const MOTIF_LIMITS = {
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

export function validateMotifDimensions(widthMm: number, heightMm: number): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) {
    errors.push("Motif genişliği ve yüksekliği geçerli bir sayı olmalıdır.");
    return errors;
  }

  if (widthMm < MOTIF_LIMITS.minMm || heightMm < MOTIF_LIMITS.minMm) {
    errors.push(`Motif ölçüleri en az ${MOTIF_LIMITS.minMm} mm olmalıdır.`);
  }

  if (widthMm > MOTIF_LIMITS.maxMm || heightMm > MOTIF_LIMITS.maxMm) {
    errors.push(`Motif ölçüleri en fazla ${MOTIF_LIMITS.maxMm} mm olabilir.`);
  }

  return errors;
}

