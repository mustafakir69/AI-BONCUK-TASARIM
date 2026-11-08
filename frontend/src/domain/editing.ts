import { geometriesOverlap } from "./geometry/intersections";
import { geometryAabb, type Aabb, type PolygonGeometry } from "./geometry/primitives";
import { createPlacementGeometry, degreesToRadians, rotatePoint } from "./geometry/transforms";
import type { Material } from "./material";
import { normalizeRotation, type Placement } from "./placement";

export type AlignmentOperation =
  | "left" | "right" | "top" | "bottom"
  | "center-horizontal" | "center-vertical"
  | "distribute-horizontal" | "distribute-vertical";

export interface WorldRect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function materialMap(materials: readonly Material[]): Map<string, Material> {
  return new Map(materials.map((material) => [material.id, material]));
}

export function placementAabb(placement: Placement, material: Material): Aabb {
  return geometryAabb(createPlacementGeometry(placement, material));
}

export function selectionAabb(
  placements: readonly Placement[],
  materials: readonly Material[],
): Aabb | null {
  const byId = materialMap(materials);
  let result: Aabb | null = null;
  for (const placement of placements) {
    const material = byId.get(placement.materialId);
    if (!material) continue;
    const current = placementAabb(placement, material);
    result = result ? {
      minX: Math.min(result.minX, current.minX), maxX: Math.max(result.maxX, current.maxX),
      minY: Math.min(result.minY, current.minY), maxY: Math.max(result.maxY, current.maxY),
    } : current;
  }
  return result;
}

export function selectPlacementsInRect(
  rect: WorldRect,
  placements: readonly Placement[],
  materials: readonly Material[],
): Set<string> {
  if (rect.maxX <= rect.minX || rect.maxY <= rect.minY) return new Set();
  const selectionGeometry: PolygonGeometry = {
    kind: "polygon",
    points: [
      { x: rect.minX, y: rect.minY }, { x: rect.maxX, y: rect.minY },
      { x: rect.maxX, y: rect.maxY }, { x: rect.minX, y: rect.maxY },
    ],
  };
  const byId = materialMap(materials);
  const result = new Set<string>();
  for (const placement of placements) {
    const material = byId.get(placement.materialId);
    if (material && geometriesOverlap(createPlacementGeometry(placement, material), selectionGeometry)) {
      result.add(placement.id);
    }
  }
  return result;
}

export function translatePlacements(
  placements: readonly Placement[],
  dxMm: number,
  dyMm: number,
): Placement[] {
  return placements.map((placement) => ({
    ...placement,
    xMm: placement.xMm + dxMm,
    yMm: placement.yMm + dyMm,
  }));
}

export function rotatePlacementsAroundSelection(
  placements: readonly Placement[],
  materials: readonly Material[],
  angleDeg: number,
): Placement[] {
  const bounds = selectionAabb(placements, materials);
  if (!bounds) return [...placements];
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const radians = degreesToRadians(angleDeg);
  return placements.map((placement) => {
    const offset = rotatePoint({ x: placement.xMm - center.x, y: placement.yMm - center.y }, radians);
    return {
      ...placement,
      xMm: center.x + offset.x,
      yMm: center.y + offset.y,
      rotationDeg: normalizeRotation(placement.rotationDeg + angleDeg),
    };
  });
}

export function alignPlacements(
  placements: readonly Placement[],
  materials: readonly Material[],
  operation: AlignmentOperation,
): Placement[] {
  const byId = materialMap(materials);
  const entries = placements.flatMap((placement) => {
    const material = byId.get(placement.materialId);
    return material ? [{ placement, bounds: placementAabb(placement, material) }] : [];
  });
  if (entries.length < 2) return [...placements];

  const overall = selectionAabb(placements, materials)!;
  if (operation === "distribute-horizontal" || operation === "distribute-vertical") {
    if (entries.length < 3) return [...placements];
    const horizontal = operation === "distribute-horizontal";
    const sorted = [...entries].sort((a, b) => horizontal
      ? (a.bounds.minX + a.bounds.maxX) - (b.bounds.minX + b.bounds.maxX)
      : (a.bounds.minY + a.bounds.maxY) - (b.bounds.minY + b.bounds.maxY));
    const span = horizontal ? overall.maxX - overall.minX : overall.maxY - overall.minY;
    const occupied = sorted.reduce((sum, item) => sum + (horizontal
      ? item.bounds.maxX - item.bounds.minX
      : item.bounds.maxY - item.bounds.minY), 0);
    const gap = (span - occupied) / (sorted.length - 1);
    let cursor = horizontal ? overall.minX : overall.minY;
    const updates = new Map<string, Placement>();
    for (const item of sorted) {
      const currentMin = horizontal ? item.bounds.minX : item.bounds.minY;
      const size = horizontal
        ? item.bounds.maxX - item.bounds.minX
        : item.bounds.maxY - item.bounds.minY;
      const delta = cursor - currentMin;
      updates.set(item.placement.id, {
        ...item.placement,
        xMm: item.placement.xMm + (horizontal ? delta : 0),
        yMm: item.placement.yMm + (horizontal ? 0 : delta),
      });
      cursor += size + gap;
    }
    return placements.map((placement) => updates.get(placement.id) ?? placement);
  }

  return entries.map(({ placement, bounds }) => {
    let dx = 0;
    let dy = 0;
    if (operation === "left") dx = overall.minX - bounds.minX;
    if (operation === "right") dx = overall.maxX - bounds.maxX;
    if (operation === "top") dy = overall.minY - bounds.minY;
    if (operation === "bottom") dy = overall.maxY - bounds.maxY;
    if (operation === "center-horizontal") {
      dx = (overall.minX + overall.maxX - bounds.minX - bounds.maxX) / 2;
    }
    if (operation === "center-vertical") {
      dy = (overall.minY + overall.maxY - bounds.minY - bounds.maxY) / 2;
    }
    return { ...placement, xMm: placement.xMm + dx, yMm: placement.yMm + dy };
  });
}
