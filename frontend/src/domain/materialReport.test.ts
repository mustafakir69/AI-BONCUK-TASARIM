import { describe, expect, it } from "vitest";
import { INITIAL_MATERIALS } from "./material";
import { createMaterialReportCsv } from "./materialReport";

describe("malzeme CSV raporu", () => {
  it("UTF-8 BOM ve gerçek yerleşim adetlerini üretir", () => {
    const csv = createMaterialReportCsv(INITIAL_MATERIALS, [
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain('"İnci";"mat-pearl";"Daire";"4";"4";"#F2EEE3";"2"');
    expect(csv).not.toContain("Kum boncuk");
  });
});
