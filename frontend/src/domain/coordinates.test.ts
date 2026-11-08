import { describe, expect, it } from "vitest";
import {
  createViewportTransform,
  fitPhysicalSizeToRect,
  getVisibleTickValues,
  panViewCenterByPixels,
  screenToWorld,
  selectRulerStep,
  worldToScreen,
  zoomViewCenterAtPoint,
  type ScreenRect,
} from "./coordinates";

const drawableRect: ScreenRect = { x: 30, y: 30, width: 970, height: 670 };

describe("fiziksel koordinat dönüşümleri", () => {
  it("negatif ve pozitif dünya koordinatlarını kayıpsız dönüştürür", () => {
    const viewport = createViewportTransform({ x: 25, y: -40 }, 3.5, drawableRect);
    const worldPoint = { x: -125.5, y: 82.25 };
    const screenPoint = worldToScreen(worldPoint, viewport);

    expect(screenToWorld(screenPoint, viewport).x).toBeCloseTo(worldPoint.x, 10);
    expect(screenToWorld(screenPoint, viewport).y).toBeCloseTo(worldPoint.y, 10);
  });

  it("pan hareketini fiziksel koordinatları değiştirmeden görünüm merkezine uygular", () => {
    const nextCenter = panViewCenterByPixels({ x: 0, y: 0 }, { x: 100, y: -50 }, 2);

    expect(nextCenter).toEqual({ x: -50, y: 25 });
    const viewport = createViewportTransform(nextCenter, 2, drawableRect);
    expect(screenToWorld({ x: 515, y: 365 }, viewport)).toEqual(nextCenter);
  });

  it("zoom sırasında işaretçinin altındaki milimetre noktasını sabit tutar", () => {
    const center = { x: -30, y: 45 };
    const anchor = { x: 740, y: 210 };
    const before = createViewportTransform(center, 2, drawableRect);
    const worldBefore = screenToWorld(anchor, before);
    const nextCenter = zoomViewCenterAtPoint(center, 2, 8, anchor, drawableRect);
    const after = createViewportTransform(nextCenter, 8, drawableRect);
    const worldAfter = screenToWorld(anchor, after);

    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 10);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 10);
  });

  it("zoom seviyesine göre okunabilir cetvel aralığı seçer", () => {
    expect(selectRulerStep(60)).toBe(1);
    expect(selectRulerStep(15)).toBe(5);
    expect(selectRulerStep(6)).toBe(10);
    expect(selectRulerStep(1.2)).toBe(50);
    expect(selectRulerStep(0.6)).toBe(100);
  });

  it("negatif değerlerden geçen simetrik cetvel işaretleri üretir", () => {
    expect(getVisibleTickValues(-126, 126, 50)).toEqual([-100, -50, 0, 50, 100]);
  });

  it("motif ölçüsünü yalnız ekrana sığdırma ölçeği için kullanır", () => {
    const smallMotifScale = fitPhysicalSizeToRect(
      { widthMm: 100, heightMm: 150 },
      drawableRect,
    );
    const largeMotifScale = fitPhysicalSizeToRect(
      { widthMm: 300, heightMm: 400 },
      drawableRect,
    );

    expect(smallMotifScale).toBeGreaterThan(largeMotifScale);
    expect(drawableRect).toEqual({ x: 30, y: 30, width: 970, height: 670 });
  });
});

