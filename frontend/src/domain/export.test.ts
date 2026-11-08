import { describe, expect, it } from "vitest";
import { INITIAL_MATERIALS } from "./material";
import { createExportPlan, MAX_EXPORT_PIXELS, millimetersToPixels, placementBounds } from "./export";

const motif = { widthMm: 200, heightMm: 250 };

describe("görsel çıktı geometrisi", () => {
  it("DPI değerini fiziksel ölçüden piksele dönüştürür", () => {
    expect(millimetersToPixels(25.4, 300)).toBeCloseTo(300);
  });

  it("PNG için motif sınırlarını zoom ve pan olmadan hesaplar", () => {
    const plan = createExportPlan({ areaMode: "motif", motif, placements: [], materials: INITIAL_MATERIALS, marginMm: 0, dpi: 150 });
    expect(plan?.bounds).toMatchObject({ minX: -100, maxX: 100, minY: -125, maxY: 125 });
    expect(plan?.widthPx).toBe(Math.ceil(200 * 150 / 25.4));
  });

  it("JPEG için yerleşim sınırına kullanıcı kenar payını ekler", () => {
    const plan = createExportPlan({
      areaMode: "placements", motif, materials: INITIAL_MATERIALS, marginMm: 5, dpi: 300,
      placements: [{ id: "p", materialId: "mat-pearl", xMm: -10, yMm: 4, rotationDeg: 0 }],
    });
    expect(plan?.bounds).toMatchObject({ minX: -17, maxX: -3, minY: -3, maxY: 11, widthMm: 14, heightMm: 14 });
  });

  it("döndürülmüş dikdörtgenin gerçek AABB sınırını kullanır", () => {
    const bounds = placementBounds(
      [{ id: "p", materialId: "mat-bugle-bead", xMm: 0, yMm: 0, rotationDeg: 90 }],
      INITIAL_MATERIALS,
    );
    expect(bounds?.widthMm).toBeCloseTo(4);
    expect(bounds?.heightMm).toBeCloseTo(2.5);
  });

  it("motif dışında kalan yerleşimi kırpma uyarısı için işaretler", () => {
    const plan = createExportPlan({
      areaMode: "motif", motif, materials: INITIAL_MATERIALS, marginMm: 0, dpi: 150,
      placements: [{ id: "p", materialId: "mat-pearl", xMm: 101, yMm: 0, rotationDeg: 0 }],
    });
    expect(plan?.hasOutsidePlacements).toBe(true);
  });

  it("boş yerleşim alanını ve aşırı bellek isteyen çıktıyı güvenli reddeder", () => {
    expect(createExportPlan({ areaMode: "placements", motif, placements: [], materials: INITIAL_MATERIALS, marginMm: 0, dpi: 300 })).toBeNull();
    const huge = createExportPlan({ areaMode: "motif", motif: { widthMm: 5000, heightMm: 5000 }, placements: [], materials: INITIAL_MATERIALS, marginMm: 0, dpi: 600 });
    expect((huge?.widthPx ?? 0) * (huge?.heightPx ?? 0)).toBeGreaterThan(MAX_EXPORT_PIXELS);
    expect(huge?.exceedsLimit).toBe(true);
  });
});
