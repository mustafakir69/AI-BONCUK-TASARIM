import { describe, expect, it } from "vitest";
import { INITIAL_MATERIALS, type Material } from "../material";
import type { Placement } from "../placement";
import { validateAllPlacements, validatePlacement } from "./validation";

function placement(
  id: string,
  materialId: string,
  xMm: number,
  yMm: number,
  rotationDeg = 0,
): Placement {
  return { id, materialId, xMm, yMm, rotationDeg };
}

const rectangle: Material = {
  id: "mat-rect-test",
  name: "Test dikdörtgeni",
  shape: "rectangle",
  widthMm: 4,
  heightMm: 2,
  color: "#123456",
  active: true,
  createdAt: "2026-11-08T00:00:00.000Z",
  updatedAt: "2026-11-08T00:00:00.000Z",
};

describe("deterministik yerleşim geometrisi", () => {
  it("döndürülmüş dikdörtgenlerin gerçek kesişimini SAT ile reddeder", () => {
    const first = placement("a", rectangle.id, 0, 0, 45);
    const overlapping = placement("b", rectangle.id, 1.5, 0, -45);
    const result = validatePlacement(overlapping, [first], [rectangle], 0);

    expect(result).toMatchObject({ valid: false, issues: [{ code: "OVERLAP" }] });
  });

  it("AABB alanları yakın olsa da ayrık döndürülmüş dikdörtgenleri kabul eder", () => {
    const first = placement("a", rectangle.id, 0, 0, 45);
    const separate = placement("b", rectangle.id, -1.56, 1.56, 45);

    expect(validatePlacement(separate, [first], [rectangle], 0)).toEqual({ valid: true });
  });

  it("daire ile dikdörtgen örtüşmesini ve teğetliği ayırır", () => {
    const circleMaterial = INITIAL_MATERIALS.find((item) => item.id === "mat-pearl")!;
    const rectanglePlacement = placement("rect", rectangle.id, 0, 0, 0);

    expect(
      validatePlacement(placement("circle-overlap", circleMaterial.id, 2.5, 0), [rectanglePlacement], [rectangle, circleMaterial], 0),
    ).toMatchObject({ valid: false, issues: [{ code: "OVERLAP" }] });
    expect(
      validatePlacement(placement("circle-touch", circleMaterial.id, 4, 0), [rectanglePlacement], [rectangle, circleMaterial], 0),
    ).toEqual({ valid: true });
  });

  it("minimum aralığı kesin dış sınır uzaklığından hesaplar", () => {
    const pearl = INITIAL_MATERIALS.find((item) => item.id === "mat-pearl")!;
    const first = placement("a", pearl.id, 0, 0);

    expect(validatePlacement(placement("b", pearl.id, 4.4, 0), [first], [pearl], 0.5)).toMatchObject({
      valid: false,
      issues: [{ code: "MIN_GAP_VIOLATION" }],
    });
    expect(validatePlacement(placement("c", pearl.id, 4.5, 0), [first], [pearl], 0.5)).toEqual({ valid: true });
  });

  it("pulu deliğine rağmen çarpışmada korumacı dış disk olarak kullanır", () => {
    const sequin = INITIAL_MATERIALS.find((item) => item.id === "mat-sequin")!;
    const seed = INITIAL_MATERIALS.find((item) => item.id === "mat-seed-bead")!;

    expect(
      validatePlacement(placement("seed", seed.id, 0, 0), [placement("sequin", sequin.id, 0, 0)], [seed, sequin], 0),
    ).toMatchObject({ valid: false, issues: [{ code: "OVERLAP" }] });
  });

  it("negatif dünya koordinatlarında geçerli yerleşimi kabul eder", () => {
    const seed = INITIAL_MATERIALS.find((item) => item.id === "mat-seed-bead")!;
    expect(validatePlacement(placement("negative", seed.id, -125.5, -80.25), [], [seed], 0)).toEqual({ valid: true });
  });

  it("malzeme ölçüsü değişince oluşan yeni çakışmayı proje düzeyinde bulur", () => {
    const pearl = INITIAL_MATERIALS.find((item) => item.id === "mat-pearl")!;
    const placements = [placement("a", pearl.id, 0, 0), placement("b", pearl.id, 5, 0)];
    const enlarged = { ...pearl, widthMm: 6, heightMm: 6 };

    expect(validateAllPlacements(placements, [pearl], 0)).toEqual({ valid: true });
    expect(validateAllPlacements(placements, [enlarged], 0)).toMatchObject({
      valid: false,
      issues: [{ code: "OVERLAP" }],
    });
  });

  it("binlerce uzak nesnede AABB ön elemesiyle adayı doğrular", () => {
    const seed = INITIAL_MATERIALS.find((item) => item.id === "mat-seed-bead")!;
    const many = Array.from({ length: 5000 }, (_, index) => placement(`p-${index}`, seed.id, index * 10, 100));

    expect(validatePlacement(placement("candidate", seed.id, 0, 0), many, [seed], 0)).toEqual({ valid: true });
  });

  it("5.000 nesneli bütün projeyi sıralı AABB taramasıyla doğrular", () => {
    const placements = Array.from({ length: 5000 }, (_, index) => ({
      id: `p-${index}`,
      materialId: "mat-seed-bead",
      xMm: index * 5,
      yMm: (index % 2) * 10,
      rotationDeg: 0,
    }));
    expect(validateAllPlacements(placements, INITIAL_MATERIALS, 0)).toEqual({ valid: true });
  });
});

