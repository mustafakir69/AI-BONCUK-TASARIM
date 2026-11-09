import { describe, expect, it } from "vitest";
import { validateAllPlacements } from "./geometry/validation";
import { cloneInitialMaterials, type Material } from "./material";
import {
  applyMotifSymmetry,
  estimateMotifGeneration,
  generateMotif,
  MOTIF_PATTERN_TYPES,
  type MotifGenerationRequest,
} from "./motifGeneration";
import { createProjectDocument, parseProjectJson, serializeProject } from "./project";

const catalog = cloneInitialMaterials();

function request(overrides: Partial<MotifGenerationRequest> = {}): MotifGenerationRequest {
  return {
    pattern: "wave",
    widthMm: 90,
    heightMm: 70,
    centerXmm: 0,
    centerYmm: 0,
    materials: [{ materialId: "mat-seed-bead", weight: 1 }],
    targetGapMm: 1,
    minimumGapMm: 0.5,
    symmetry: "none",
    radialRepeats: 6,
    repeatCount: 3,
    densityPercent: 100,
    seed: "motif-testi",
    ...overrides,
  };
}

describe("deterministik motif üretimi", () => {
  it.each(MOTIF_PATTERN_TYPES)("%s motifini geçerli yerleşimler olarak üretir", (pattern) => {
    const result = generateMotif(request({ pattern }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements.length).toBeGreaterThan(0);
    expect(validateAllPlacements(result.placements, catalog, 0.5).valid).toBe(true);
  });

  it("aynı tohum ve parametrelerle aynı geometrik sonucu üretir", () => {
    const first = generateMotif(request({ densityPercent: 63 }), catalog);
    const second = generateMotif(request({ densityPercent: 63 }), catalog);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.placements).toEqual(second.placements);
  });

  it("farklı tohumla karışık malzeme dağılımını değiştirir", () => {
    const materials = [
      { materialId: "mat-seed-bead", weight: 1 },
      { materialId: "mat-pearl", weight: 1 },
    ];
    const first = generateMotif(request({ seed: "a", densityPercent: 55, materials }), catalog);
    const second = generateMotif(request({ seed: "b", densityPercent: 55, materials }), catalog);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.placements.map(({ materialId, xMm, yMm }) => [materialId, xMm, yMm]))
      .not.toEqual(second.placements.map(({ materialId, xMm, yMm }) => [materialId, xMm, yMm]));
  });

  it("yalnız seçilen katalog malzemelerini kullanır", () => {
    const result = generateMotif(request({
      materials: [
        { materialId: "mat-seed-bead", weight: 2 },
        { materialId: "mat-pearl", weight: 1 },
      ],
    }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.placements.map((item) => item.materialId)))
      .toEqual(new Set(["mat-seed-bead", "mat-pearl"]));
    expect(result.placements.some((item) => item.materialId === "mat-sequin")).toBe(false);
  });

  it("malzeme ölçülerini placement içine kopyalamaz veya kataloğu değiştirmez", () => {
    const before = structuredClone(catalog);
    const result = generateMotif(request(), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(catalog).toEqual(before);
    expect(Object.keys(result.placements[0] ?? {}).sort())
      .toEqual(["id", "materialId", "rotationDeg", "xMm", "yMm"].sort());
  });

  it("minimum aralığı mevcut geometri çekirdeğiyle doğrular", () => {
    const result = generateMotif(request({ minimumGapMm: 3 }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validateAllPlacements(result.placements, catalog, 3).valid).toBe(true);
  });

  it("hedef aralığı güvenlik aralığından ayrı uygular", () => {
    const compact = generateMotif(request({ pattern: "ring", repeatCount: 1, targetGapMm: 0.5 }), catalog);
    const spaced = generateMotif(request({ pattern: "ring", repeatCount: 1, targetGapMm: 4 }), catalog);
    expect(compact.ok && spaced.ok).toBe(true);
    if (!compact.ok || !spaced.ok) return;
    expect(spaced.placements.length).toBeLessThan(compact.placements.length);
    expect(spaced.report.targetGapMm).toBe(4);
    expect(spaced.report.minimumGapMm).toBe(0.5);
    expect(validateAllPlacements(spaced.placements, catalog, 0.5).valid).toBe(true);
  });

  it("kapalı halkadaki artan yay uzunluklarını kapanış boşluğu dahil dengeler", () => {
    const result = generateMotif(request({
      pattern: "ring",
      repeatCount: 1,
      widthMm: 120,
      heightMm: 120,
      targetGapMm: 1,
      materials: [{ materialId: "mat-pearl", weight: 1 }],
    }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const distances = result.placements.map((placement, index, placements) => {
      const next = placements[(index + 1) % placements.length]!;
      return Math.hypot(next.xMm - placement.xMm, next.yMm - placement.yMm);
    });
    expect(Math.max(...distances) / Math.min(...distances)).toBeLessThan(1.02);
  });

  it("karışık ve döndürülmüş malzemelerde gerçek katalog ölçüleriyle güvenli sonuç üretir", () => {
    const result = generateMotif(request({
      pattern: "flower",
      widthMm: 140,
      heightMm: 120,
      targetGapMm: 1.5,
      minimumGapMm: 1,
      materials: [
        { materialId: "mat-bugle-bead", weight: 2 },
        { materialId: "mat-pearl", weight: 1 },
        { materialId: "mat-sequin", weight: 1 },
      ],
    }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.placements.map((placement) => placement.materialId)).size).toBeGreaterThan(1);
    expect(validateAllPlacements(result.placements, catalog, 1).valid).toBe(true);
  });

  it("yatay ayna simetrisinde koordinatı ve açıyı dönüştürür", () => {
    expect(applyMotifSymmetry({ x: 8, y: 5, rotationDeg: 30 }, "horizontal", 6))
      .toEqual([{ x: 8, y: 5, rotationDeg: 30 }, { x: 8, y: -5, rotationDeg: 330 }]);
  });

  it("dikey ayna simetrisinde koordinatı ve açıyı dönüştürür", () => {
    expect(applyMotifSymmetry({ x: 8, y: 5, rotationDeg: 30 }, "vertical", 6))
      .toEqual([{ x: 8, y: 5, rotationDeg: 30 }, { x: -8, y: 5, rotationDeg: 150 }]);
  });

  it("dört yönlü simetride dört dönüşüm üretir", () => {
    expect(applyMotifSymmetry({ x: 8, y: 5, rotationDeg: 30 }, "four-way", 6)).toHaveLength(4);
  });

  it("radyal simetride koordinat ve açıyı birlikte döndürür", () => {
    const variants = applyMotifSymmetry({ x: 10, y: 0, rotationDeg: 20 }, "radial", 4);
    expect(variants).toHaveLength(4);
    expect(variants[1]?.x).toBeCloseTo(0, 8);
    expect(variants[1]?.y).toBeCloseTo(10, 8);
    expect(variants[1]?.rotationDeg).toBe(110);
  });

  it("simetriyle aynı konuma düşen adayları çoğaltmaz", () => {
    const result = generateMotif(request({ pattern: "spiral", symmetry: "radial", radialRepeats: 12 }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const positions = result.placements.map((item) => `${item.xMm.toFixed(6)}:${item.yMm.toFixed(6)}`);
    expect(new Set(positions).size).toBe(positions.length);
    expect(result.report.rejectedCandidates).toBeGreaterThan(0);
  });

  it("döndürülmüş malzemeleri motif sınırları içinde tutar", () => {
    const result = generateMotif(request({
      pattern: "flower",
      materials: [{ materialId: "mat-bugle-bead", weight: 1 }],
      widthMm: 65,
      heightMm: 55,
    }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.actualWidthMm).toBeLessThanOrEqual(65 + 1e-7);
    expect(result.report.actualHeightMm).toBeLessThanOrEqual(55 + 1e-7);
  });

  it("negatif motif merkezini korur", () => {
    const result = generateMotif(request({ centerXmm: -120, centerYmm: -80 }), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements.every((item) => item.xMm < 0 && item.yMm < 0)).toBe(true);
  });

  it("malzeme oranlarını çoklu seçimde yaklaşık uygular", () => {
    const sameSizeCatalog: Material[] = [
      { ...catalog[0]!, id: "a", name: "A" },
      { ...catalog[0]!, id: "b", name: "B" },
    ];
    const result = generateMotif(request({
      pattern: "geometric",
      widthMm: 180,
      heightMm: 180,
      densityPercent: 100,
      materials: [{ materialId: "a", weight: 3 }, { materialId: "b", weight: 1 }],
    }), sameSizeCatalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ratio = (result.report.countsByMaterial.a ?? 0) / result.placements.length;
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.85);
  });

  it("raporu gerçek yerleşimlerden ve geometriden türetir", () => {
    const result = generateMotif(request(), catalog);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.totalCount).toBe(result.placements.length);
    expect(Object.values(result.report.countsByMaterial).reduce((sum, count) => sum + count, 0))
      .toBe(result.placements.length);
    expect(result.report.actualWidthMm).toBeGreaterThan(0);
    expect(result.report.actualHeightMm).toBeGreaterThan(0);
  });

  it("tahmini sayının kesin sonuç olmadığını ve uygunluk uyarılarını hesaplar", () => {
    const estimate = estimateMotifGeneration(request({ widthMm: 2, heightMm: 2 }), catalog);
    expect(estimate.estimatedCount).toBeGreaterThan(0);
    expect(estimate.suitable).toBe(false);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it.each([
    { widthMm: 0 },
    { heightMm: Number.NaN },
    { targetGapMm: -1 },
    { minimumGapMm: -1 },
    { densityPercent: 101 },
    { repeatCount: 0 },
    { seed: "" },
    { materials: [] },
    { symmetry: "radial" as const, radialRepeats: 7 },
  ])("geçersiz parametreyi reddeder: %o", (override) => {
    const result = generateMotif(request(override), catalog);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_REQUEST");
  });

  it("devre dışı malzemeyi reddeder", () => {
    const inactive = catalog.map((item) => item.id === "mat-seed-bead" ? { ...item, active: false } : item);
    expect(generateMotif(request(), inactive).ok).toBe(false);
  });

  it("aday sayısı sınırını aşan işlemi kısmi sonuç vermeden durdurur", () => {
    const result = generateMotif(request({ pattern: "geometric" }), catalog, {
      maxPlacements: 100,
      maxCandidates: 5,
      maxDurationMs: 1_000,
    });
    expect(result).toMatchObject({ ok: false, code: "CANDIDATE_LIMIT" });
  });

  it("çalışma süresi sınırını aşan işlemi kısmi sonuç vermeden durdurur", () => {
    const result = generateMotif(request({ pattern: "geometric", widthMm: 300, heightMm: 300 }), catalog, {
      maxPlacements: 5_000,
      maxCandidates: 20_000,
      maxDurationMs: 0.000001,
    });
    expect(result).toMatchObject({ ok: false, code: "TIME_LIMIT" });
  });

  it("binlerce adaylı motifte güvenlik sınırlarını korur", () => {
    const startedAt = performance.now();
    const result = generateMotif(request({
      pattern: "geometric",
      widthMm: 200,
      heightMm: 200,
      minimumGapMm: 0,
      densityPercent: 100,
    }), catalog, { maxPlacements: 5_000, maxCandidates: 40_000, maxDurationMs: 5_000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements.length).toBeLessThanOrEqual(5_000);
    expect(performance.now() - startedAt).toBeLessThan(5_000);
  });

  it("üretilen placement nesnelerini mevcut JSON şemasında kaydedip açar", () => {
    const generated = generateMotif(request(), catalog);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const project = createProjectDocument({
      id: "project-generated",
      name: "Üretilen motif",
      createdAt: "2026-11-09T00:00:00.000Z",
      updatedAt: "2026-11-09T00:00:00.000Z",
    }, {
      motif: { widthMm: 90, heightMm: 70 },
      minimumGapMm: 0.5,
      keyboardStepMm: 0.5,
      keyboardShiftStepMm: 5,
      materials: catalog,
      placements: generated.placements,
      groups: [],
    });
    const parsed = parseProjectJson(serializeProject(project));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.project.placements).toEqual(generated.placements);
  });
});
