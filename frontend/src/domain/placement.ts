export interface Placement {
  id: string;
  materialId: string;
  xMm: number;
  yMm: number;
  rotationDeg: number;
  colorOverride?: string;
}

export function normalizeRotation(rotationDeg: number): number {
  if (!Number.isFinite(rotationDeg)) return Number.NaN;
  const normalized = rotationDeg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function createPlacementId(existingIds: ReadonlySet<string>): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const baseId = `place-${randomPart}`;
  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) suffix += 1;
  return `${baseId}-${suffix}`;
}

export function countPlacementsByMaterial(
  placements: readonly Placement[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const placement of placements) {
    counts[placement.materialId] = (counts[placement.materialId] ?? 0) + 1;
  }
  return counts;
}

