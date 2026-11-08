import { describe, expect, it } from "vitest";
import {
  formatMeasurement,
  fromMillimeters,
  toMillimeters,
  validateMotifDimensions,
} from "./motif";

describe("motif ölçüleri", () => {
  it("santimetreyi milimetreye dönüştürür", () => {
    expect(toMillimeters(20, "cm")).toBe(200);
    expect(toMillimeters(250, "mm")).toBe(250);
  });

  it("milimetreyi seçilen görüntüleme birimine dönüştürür", () => {
    expect(fromMillimeters(250, "cm")).toBe(25);
    expect(fromMillimeters(250, "mm")).toBe(250);
  });

  it("geçerli motif ölçülerini kabul eder", () => {
    expect(validateMotifDimensions(200, 250)).toEqual([]);
    expect(validateMotifDimensions(300, 400)).toEqual([]);
    expect(validateMotifDimensions(100, 150)).toEqual([]);
  });

  it("sonlu olmayan, sıfır ve üst sınırı aşan ölçüleri reddeder", () => {
    expect(validateMotifDimensions(Number.NaN, 250)).not.toHaveLength(0);
    expect(validateMotifDimensions(0, 250)).not.toHaveLength(0);
    expect(validateMotifDimensions(5001, 250)).not.toHaveLength(0);
  });

  it("ölçü metninde gereksiz ondalıkları kaldırır", () => {
    expect(formatMeasurement(20)).toBe("20");
    expect(formatMeasurement(2.555)).toBe("2.56");
  });
});

