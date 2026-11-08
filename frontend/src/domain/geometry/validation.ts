import type { Material } from "../material";
import type { Placement } from "../placement";
import { aabbDistance, EPSILON_MM, geometryAabb } from "./primitives";
import { distanceBetweenGeometries, geometriesOverlap } from "./intersections";
import { createPlacementGeometry } from "./transforms";

export type PlacementIssueCode =
  | "INVALID_NUMBER"
  | "MATERIAL_NOT_FOUND"
  | "MATERIAL_INACTIVE"
  | "OVERLAP"
  | "MIN_GAP_VIOLATION";

export interface PlacementIssue {
  code: PlacementIssueCode;
  relatedPlacementId?: string;
}

export type PlacementValidationResult =
  | { valid: true }
  | { valid: false; issues: PlacementIssue[] };

export function validatePlacement(
  candidate: Placement,
  placements: readonly Placement[],
  materials: readonly Material[],
  minimumGapMm: number,
): PlacementValidationResult {
  if (
    !Number.isFinite(candidate.xMm) ||
    !Number.isFinite(candidate.yMm) ||
    !Number.isFinite(candidate.rotationDeg) ||
    !Number.isFinite(minimumGapMm) ||
    minimumGapMm < 0
  ) {
    return { valid: false, issues: [{ code: "INVALID_NUMBER" }] };
  }

  const material = materials.find((item) => item.id === candidate.materialId);
  if (!material) return { valid: false, issues: [{ code: "MATERIAL_NOT_FOUND" }] };
  if (!material.active) return { valid: false, issues: [{ code: "MATERIAL_INACTIVE" }] };

  const candidateGeometry = createPlacementGeometry(candidate, material);
  const candidateAabb = geometryAabb(candidateGeometry);

  for (const other of placements) {
    if (other.id === candidate.id) continue;
    const otherMaterial = materials.find((item) => item.id === other.materialId);
    if (!otherMaterial) return { valid: false, issues: [{ code: "MATERIAL_NOT_FOUND", relatedPlacementId: other.id }] };
    const otherGeometry = createPlacementGeometry(other, otherMaterial);
    const broadDistance = aabbDistance(candidateAabb, geometryAabb(otherGeometry));
    if (broadDistance > minimumGapMm + EPSILON_MM) continue;

    if (geometriesOverlap(candidateGeometry, otherGeometry)) {
      return { valid: false, issues: [{ code: "OVERLAP", relatedPlacementId: other.id }] };
    }

    if (
      minimumGapMm > 0 &&
      distanceBetweenGeometries(candidateGeometry, otherGeometry) + EPSILON_MM < minimumGapMm
    ) {
      return { valid: false, issues: [{ code: "MIN_GAP_VIOLATION", relatedPlacementId: other.id }] };
    }
  }

  return { valid: true };
}

export function validateAllPlacements(
  placements: readonly Placement[],
  materials: readonly Material[],
  minimumGapMm: number,
): PlacementValidationResult {
  if (!Number.isFinite(minimumGapMm) || minimumGapMm < 0) {
    return { valid: false, issues: [{ code: "INVALID_NUMBER" }] };
  }
  const byMaterialId = new Map(materials.map((material) => [material.id, material]));
  const entries: Array<{
    placement: Placement;
    geometry: ReturnType<typeof createPlacementGeometry>;
    aabb: ReturnType<typeof geometryAabb>;
  }> = [];

  for (const placement of placements) {
    if (!Number.isFinite(placement.xMm) || !Number.isFinite(placement.yMm) || !Number.isFinite(placement.rotationDeg)) {
      return { valid: false, issues: [{ code: "INVALID_NUMBER" }] };
    }
    const material = byMaterialId.get(placement.materialId);
    if (!material) return { valid: false, issues: [{ code: "MATERIAL_NOT_FOUND", relatedPlacementId: placement.id }] };
    if (!material.active) return { valid: false, issues: [{ code: "MATERIAL_INACTIVE", relatedPlacementId: placement.id }] };
    const geometry = createPlacementGeometry(placement, material);
    entries.push({ placement, geometry, aabb: geometryAabb(geometry) });
  }

  entries.sort((a, b) => a.aabb.minX - b.aabb.minX);
  let active: typeof entries = [];
  for (const current of entries) {
    active = active.filter((item) => item.aabb.maxX + minimumGapMm + EPSILON_MM >= current.aabb.minX);
    for (const other of active) {
      if (aabbDistance(current.aabb, other.aabb) > minimumGapMm + EPSILON_MM) continue;
      if (geometriesOverlap(current.geometry, other.geometry)) {
        return { valid: false, issues: [{ code: "OVERLAP", relatedPlacementId: other.placement.id }] };
      }
      if (
        minimumGapMm > 0 &&
        distanceBetweenGeometries(current.geometry, other.geometry) + EPSILON_MM < minimumGapMm
      ) {
        return { valid: false, issues: [{ code: "MIN_GAP_VIOLATION", relatedPlacementId: other.placement.id }] };
      }
    }
    active.push(current);
  }
  return { valid: true };
}

export function placementIssueMessage(result: PlacementValidationResult): string | null {
  if (result.valid) return null;
  const code = result.issues[0]?.code;
  if (code === "OVERLAP") return "Bu konum başka bir malzemeyle çakışıyor.";
  if (code === "MIN_GAP_VIOLATION") return "Bu konum minimum malzeme aralığını sağlamıyor.";
  if (code === "MATERIAL_NOT_FOUND") return "Yerleşimin bağlı olduğu malzeme bulunamadı.";
  if (code === "MATERIAL_INACTIVE") return "Devre dışı malzeme yerleştirilemez.";
  return "Konum veya açı geçerli bir sayı olmalıdır.";
}

