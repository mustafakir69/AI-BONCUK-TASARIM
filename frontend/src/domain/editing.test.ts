import { describe, expect, it } from "vitest";
import { alignPlacements, placementAabb, selectPlacementsInRect } from "./editing";
import { INITIAL_MATERIALS } from "./material";

const pearl = INITIAL_MATERIALS.find((material) => material.id === "mat-pearl")!;
const bugle = INITIAL_MATERIALS.find((material) => material.id === "mat-bugle-bead")!;

describe("gelişmiş düzenleme geometrisi", () => {
  it("seçim dikdörtgenine kısmen giren gerçek geometriyi seçer, yalnız teğeti seçmez", () => {
    const placement = { id: "p", materialId: pearl.id, xMm: 0, yMm: 0, rotationDeg: 0 };
    expect(selectPlacementsInRect({ minX: 1, maxX: 3, minY: -1, maxY: 1 }, [placement], [pearl])).toEqual(new Set(["p"]));
    expect(selectPlacementsInRect({ minX: 2, maxX: 3, minY: -1, maxY: 1 }, [placement], [pearl])).toEqual(new Set());
  });

  it("hizalamada döndürülmüş nesnelerin gerçek sınırlarını kullanır", () => {
    const placements = [
      { id: "a", materialId: bugle.id, xMm: 0, yMm: 0, rotationDeg: 90 },
      { id: "b", materialId: bugle.id, xMm: 10, yMm: 10, rotationDeg: 0 },
    ];
    const aligned = alignPlacements(placements, [bugle], "left");
    const lefts = aligned.map((item) => placementAabb(item, bugle).minX);
    expect(lefts[0]).toBeCloseTo(lefts[1]!);
  });

  it("yatay dağıtmada gerçek genişlikler arasında eşit boşluk bırakır", () => {
    const placements = [0, 20, 50].map((x, index) => ({ id: `p${index}`, materialId: pearl.id, xMm: x, yMm: 0, rotationDeg: 0 }));
    const distributed = alignPlacements(placements, [pearl], "distribute-horizontal");
    expect(distributed.map((item) => item.xMm)).toEqual([0, 25, 50]);
  });

  it("5.000 nesneli seçim alanını doğrusal taramayla işler", () => {
    const placements = Array.from({ length: 5000 }, (_, index) => ({
      id: `p${index}`, materialId: pearl.id, xMm: index * 10, yMm: 0, rotationDeg: 0,
    }));
    const selected = selectPlacementsInRect(
      { minX: -3, maxX: 49_993, minY: -3, maxY: 3 }, placements, [pearl],
    );
    expect(selected.size).toBe(5000);
  });
});
