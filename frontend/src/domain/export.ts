import { geometryAabb, type Aabb } from "./geometry/primitives";
import { createPlacementGeometry } from "./geometry/transforms";
import type { Material } from "./material";
import type { MotifDimensions } from "./motif";
import type { Placement } from "./placement";

export const EXPORT_DPI_OPTIONS = [150, 300, 600] as const;
export const MAX_EXPORT_PIXELS = 64_000_000;
export const MAX_EXPORT_EDGE_PX = 16_384;

export type ExportAreaMode = "motif" | "placements";
export type ExportFormat = "png" | "jpeg";

export interface ExportBounds extends Aabb {
  widthMm: number;
  heightMm: number;
}

export interface ExportPlan {
  bounds: ExportBounds;
  widthPx: number;
  heightPx: number;
  estimatedBytes: number;
  exceedsLimit: boolean;
  hasOutsidePlacements: boolean;
}

export function millimetersToPixels(mm: number, dpi: number): number {
  return (mm * dpi) / 25.4;
}

function withDimensions(aabb: Aabb): ExportBounds {
  return { ...aabb, widthMm: aabb.maxX - aabb.minX, heightMm: aabb.maxY - aabb.minY };
}

export function motifBounds(motif: MotifDimensions): ExportBounds {
  return withDimensions({
    minX: -motif.widthMm / 2,
    maxX: motif.widthMm / 2,
    minY: -motif.heightMm / 2,
    maxY: motif.heightMm / 2,
  });
}

export function placementBounds(
  placements: readonly Placement[],
  materials: readonly Material[],
): ExportBounds | null {
  let result: Aabb | null = null;
  for (const placement of placements) {
    const material = materials.find((item) => item.id === placement.materialId);
    if (!material) continue;
    const current = geometryAabb(createPlacementGeometry(placement, material));
    result = result
      ? {
          minX: Math.min(result.minX, current.minX), maxX: Math.max(result.maxX, current.maxX),
          minY: Math.min(result.minY, current.minY), maxY: Math.max(result.maxY, current.maxY),
        }
      : current;
  }
  return result ? withDimensions(result) : null;
}

export function createExportPlan(input: {
  areaMode: ExportAreaMode;
  motif: MotifDimensions;
  placements: readonly Placement[];
  materials: readonly Material[];
  marginMm: number;
  dpi: number;
}): ExportPlan | null {
  const raw = input.areaMode === "motif"
    ? motifBounds(input.motif)
    : placementBounds(input.placements, input.materials);
  if (!raw) return null;
  const margin = input.areaMode === "placements" && Number.isFinite(input.marginMm)
    ? Math.max(0, input.marginMm)
    : 0;
  const bounds = withDimensions({
    minX: raw.minX - margin, maxX: raw.maxX + margin,
    minY: raw.minY - margin, maxY: raw.maxY + margin,
  });
  const widthPx = Math.max(1, Math.ceil(millimetersToPixels(bounds.widthMm, input.dpi)));
  const heightPx = Math.max(1, Math.ceil(millimetersToPixels(bounds.heightMm, input.dpi)));
  const motifArea = motifBounds(input.motif);
  const placed = placementBounds(input.placements, input.materials);
  const hasOutsidePlacements = Boolean(placed && (
    placed.minX < motifArea.minX || placed.maxX > motifArea.maxX ||
    placed.minY < motifArea.minY || placed.maxY > motifArea.maxY
  ));
  const estimatedBytes = widthPx * heightPx * 4;
  return {
    bounds, widthPx, heightPx, estimatedBytes, hasOutsidePlacements,
    exceedsLimit: widthPx > MAX_EXPORT_EDGE_PX || heightPx > MAX_EXPORT_EDGE_PX ||
      widthPx * heightPx > MAX_EXPORT_PIXELS,
  };
}
