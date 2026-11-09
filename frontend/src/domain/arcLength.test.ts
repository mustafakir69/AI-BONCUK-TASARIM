import { describe, expect, it } from "vitest";
import { createArcLengthTable, sampleArcLength } from "./arcLength";

describe("yay uzunluğu örnekleme", () => {
  it("eşit mesafeleri farklı uzunluktaki doğru parçaları boyunca doğru örnekler", () => {
    const table = createArcLengthTable([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 9 }]);

    expect(table.totalLength).toBe(12);
    expect(sampleArcLength(table, 2)).toMatchObject({ x: 2, y: 0, rotationDeg: 0 });
    expect(sampleArcLength(table, 6)).toMatchObject({ x: 3, y: 3, rotationDeg: 90 });
  });

  it("kapalı eğride mesafeyi çevrim uzunluğuna göre sarar", () => {
    const table = createArcLengthTable([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ], true);

    expect(table.totalLength).toBe(40);
    expect(sampleArcLength(table, 45)).toMatchObject({ x: 5, y: 0 });
    expect(sampleArcLength(table, -5)).toMatchObject({ x: 0, y: 5 });
  });

  it("açık eğride sınır dışı mesafeleri uçlara sıkıştırır", () => {
    const table = createArcLengthTable([{ x: -5, y: 2 }, { x: 5, y: 2 }]);
    expect(sampleArcLength(table, -10)).toMatchObject({ x: -5, y: 2 });
    expect(sampleArcLength(table, 50)).toMatchObject({ x: 5, y: 2 });
  });
});
