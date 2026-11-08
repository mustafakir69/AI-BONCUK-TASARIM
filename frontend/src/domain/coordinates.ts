export interface PointMm {
  x: number;
  y: number;
}

export interface PointPx {
  x: number;
  y: number;
}

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhysicalSize {
  widthMm: number;
  heightMm: number;
}

export interface ViewportTransform {
  originPx: PointPx;
  pixelsPerMm: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_PIXELS_PER_MM = 2;
export const MIN_PIXELS_PER_MM = 0.1;
export const MAX_PIXELS_PER_MM = 64;

const RULER_STEPS_MM = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function screenCenter(rect: ScreenRect): PointPx {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function createViewportTransform(
  viewCenterMm: PointMm,
  pixelsPerMm: number,
  drawableRect: ScreenRect,
): ViewportTransform {
  const centerPx = screenCenter(drawableRect);

  return {
    pixelsPerMm,
    originPx: {
      x: centerPx.x - viewCenterMm.x * pixelsPerMm,
      y: centerPx.y - viewCenterMm.y * pixelsPerMm,
    },
  };
}

export function worldToScreen(pointMm: PointMm, viewport: ViewportTransform): PointPx {
  return {
    x: viewport.originPx.x + pointMm.x * viewport.pixelsPerMm,
    y: viewport.originPx.y + pointMm.y * viewport.pixelsPerMm,
  };
}

export function screenToWorld(pointPx: PointPx, viewport: ViewportTransform): PointMm {
  return {
    x: (pointPx.x - viewport.originPx.x) / viewport.pixelsPerMm,
    y: (pointPx.y - viewport.originPx.y) / viewport.pixelsPerMm,
  };
}

export function panViewCenterByPixels(
  viewCenterMm: PointMm,
  deltaPx: PointPx,
  pixelsPerMm: number,
): PointMm {
  return {
    x: viewCenterMm.x - deltaPx.x / pixelsPerMm,
    y: viewCenterMm.y - deltaPx.y / pixelsPerMm,
  };
}

export function zoomViewCenterAtPoint(
  viewCenterMm: PointMm,
  previousPixelsPerMm: number,
  nextPixelsPerMm: number,
  anchorPx: PointPx,
  drawableRect: ScreenRect,
): PointMm {
  const previousViewport = createViewportTransform(
    viewCenterMm,
    previousPixelsPerMm,
    drawableRect,
  );
  const anchorWorld = screenToWorld(anchorPx, previousViewport);
  const centerPx = screenCenter(drawableRect);

  return {
    x: anchorWorld.x - (anchorPx.x - centerPx.x) / nextPixelsPerMm,
    y: anchorWorld.y - (anchorPx.y - centerPx.y) / nextPixelsPerMm,
  };
}

export function getVisibleWorldBounds(
  viewport: ViewportTransform,
  drawableRect: ScreenRect,
): WorldBounds {
  const topLeft = screenToWorld({ x: drawableRect.x, y: drawableRect.y }, viewport);
  const bottomRight = screenToWorld(
    {
      x: drawableRect.x + drawableRect.width,
      y: drawableRect.y + drawableRect.height,
    },
    viewport,
  );

  return {
    minX: Math.min(topLeft.x, bottomRight.x),
    maxX: Math.max(topLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, bottomRight.y),
    maxY: Math.max(topLeft.y, bottomRight.y),
  };
}

export function selectRulerStep(
  pixelsPerMm: number,
  minimumLabelSpacingPx = 56,
): number {
  return RULER_STEPS_MM.find((stepMm) => stepMm * pixelsPerMm >= minimumLabelSpacingPx)
    ?? 10000;
}

export function selectMinorStep(majorStepMm: number): number {
  if (majorStepMm <= 1) return 1;
  if (majorStepMm === 5) return 1;
  return majorStepMm / 5;
}

export function getVisibleTickValues(
  minMm: number,
  maxMm: number,
  stepMm: number,
  maximumTicks = 2000,
): number[] {
  if (
    !Number.isFinite(minMm)
    || !Number.isFinite(maxMm)
    || !Number.isFinite(stepMm)
    || stepMm <= 0
  ) {
    return [];
  }

  const start = Math.ceil(minMm / stepMm) * stepMm;
  const values: number[] = [];

  for (let value = start; value <= maxMm + stepMm * 1e-9; value += stepMm) {
    if (values.length >= maximumTicks) break;
    values.push(Number(value.toFixed(9)));
  }

  return values;
}

export function fitPhysicalSizeToRect(
  physicalSize: PhysicalSize,
  drawableRect: ScreenRect,
  paddingPx = 64,
): number {
  const availableWidth = Math.max(1, drawableRect.width - paddingPx * 2);
  const availableHeight = Math.max(1, drawableRect.height - paddingPx * 2);
  const scale = Math.min(
    availableWidth / physicalSize.widthMm,
    availableHeight / physicalSize.heightMm,
  );

  return clamp(scale, MIN_PIXELS_PER_MM, MAX_PIXELS_PER_MM);
}

export function formatCoordinate(valueMm: number): string {
  const normalized = Math.abs(valueMm) < 0.005 ? 0 : valueMm;
  return normalized.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRulerValue(valueMm: number): string {
  const normalized = Math.abs(valueMm) < 1e-9 ? 0 : valueMm;
  return Number.isInteger(normalized)
    ? normalized.toLocaleString("tr-TR")
    : normalized.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

