import { describe, expect, it } from "vitest";
import { countPlacementsByMaterial, normalizeRotation, type Placement } from "./placement";

describe("yerleşim modeli", () => {
  it("açıları [0, 360) aralığına normalize eder", () => {
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-15)).toBe(345);
  });

  it("malzeme sayacını yalnız gerçek yerleşimlerden türetir", () => {
    const placements: Placement[] = [
      { id: "1", materialId: "seed", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "2", materialId: "seed", xMm: 10, yMm: 0, rotationDeg: 0 },
      { id: "3", materialId: "pearl", xMm: 20, yMm: 0, rotationDeg: 0 },
    ];

    expect(countPlacementsByMaterial(placements)).toEqual({ seed: 2, pearl: 1 });
  });
});

