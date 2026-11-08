import { describe, expect, it } from "vitest";
import {
  formatMeasurement,
  fromMillimeters,
  toMillimeters,
  validateWorkspaceDimensions,
} from "./workspace";

describe("çalışma alanı birimleri", () => {
  it("santimetreyi milimetreye dönüştürür", () => {
    expect(toMillimeters(20, "cm")).toBe(200);
    expect(toMillimeters(250, "mm")).toBe(250);
  });

  it("milimetreyi seçilen görüntüleme birimine dönüştürür", () => {
    expect(fromMillimeters(250, "cm")).toBe(25);
    expect(fromMillimeters(250, "mm")).toBe(250);
  });

  it("geçerli üretim alanlarını kabul eder", () => {
    expect(validateWorkspaceDimensions(200, 250)).toEqual([]);
    expect(validateWorkspaceDimensions(300, 400)).toEqual([]);
    expect(validateWorkspaceDimensions(100, 150)).toEqual([]);
  });

  it("sonlu olmayan, sıfır ve üst sınırı aşan ölçüleri reddeder", () => {
    expect(validateWorkspaceDimensions(Number.NaN, 250)).not.toHaveLength(0);
    expect(validateWorkspaceDimensions(0, 250)).not.toHaveLength(0);
    expect(validateWorkspaceDimensions(5001, 250)).not.toHaveLength(0);
  });

  it("ölçü metninde gereksiz ondalıkları kaldırır", () => {
    expect(formatMeasurement(20)).toBe("20");
    expect(formatMeasurement(2.555)).toBe("2.56");
  });
});

