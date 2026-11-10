import { describe, expect, it } from "vitest";
import { cloneInitialMaterials } from "./material";
import {
  AI_DESIGN_PLAN_SCHEMA_VERSION,
  AI_DESIGN_REQUEST_SCHEMA_VERSION,
  allowedMaterialIdsForRequest,
  parseAiDesignPlan,
  requiredMaterialIdsForRequest,
  validateAiDesignRequest,
  type AiDesignPlan,
  type AiDesignRequest,
} from "./aiDesign";

const catalog = cloneInitialMaterials();

function request(overrides: Partial<AiDesignRequest> = {}): AiDesignRequest {
  return {
    schemaVersion: AI_DESIGN_REQUEST_SCHEMA_VERSION,
    prompt: "Yaprak kenarlarında boru boncuk, merkezlerde inci kullanılan zarif bir desen.",
    target: { widthMm: 400, heightMm: 600 },
    materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-bugle-bead", "mat-pearl"] },
    constraints: {
      minimumGapMm: 0.5,
      targetGapMm: 1,
      densityPercent: 70,
      symmetry: "optional",
      maxPlacements: 1_200,
    },
    ...overrides,
  };
}

function plan(overrides: Partial<AiDesignPlan> = {}): AiDesignPlan {
  return {
    schemaVersion: AI_DESIGN_PLAN_SCHEMA_VERSION,
    description: "Çiçek ve yapraklardan oluşan katmanlı nakış planı.",
    target: { widthMm: 400, heightMm: 600 },
    materialIds: ["mat-bugle-bead", "mat-pearl"],
    components: [{
      id: "leaf-border",
      kind: "path",
      label: "Yaprak kenarı",
      centerXmm: 0,
      centerYmm: -80,
      widthMm: 180,
      heightMm: 240,
      rotationDeg: 15,
      layer: 1,
      priority: 10,
      placement: {
        strategy: "follow-path",
        materialIds: ["mat-bugle-bead"],
        targetGapMm: 1,
        densityPercent: 75,
        maxPlacements: 700,
      },
    }],
    densityRegions: [{ id: "lower", centerXmm: 0, centerYmm: 180, widthMm: 300, heightMm: 160, densityPercent: 35, layer: 0 }],
    symmetry: { type: "optional" },
    placementInstructions: ["Kenarları önce üret."],
    warnings: ["Referans ölçeği kullanıcı ölçüsünden alınmıştır."],
    uncertainties: ["Alt bölüm yoğunluğu yaklaşık yorumlanmıştır."],
    ...overrides,
  };
}

describe("AI tasarım isteği", () => {
  it("serbest metni, mm ölçülerini ve kullanıcı malzeme seçimini doğrular", () => {
    const result = validateAiDesignRequest(request(), catalog);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.prompt).toMatch(/Yaprak/);
  });

  it("yalnız görselle verilen isteği de kabul eder", () => {
    const result = validateAiDesignRequest(request({
      prompt: "",
      referenceImage: { name: "ornek.png", mimeType: "image/png", sizeBytes: 128, widthPx: 10, heightPx: 10 },
    }), catalog);
    expect(result.ok).toBe(true);
  });

  it.each(["user-only", "ai-selects", "collaborative"] as const)("%s malzeme modunun yetki kümesini doğru kurar", (mode) => {
    const selectedMaterialIds = mode === "ai-selects" ? [] : ["mat-pearl"];
    const value = request({ materialSelection: { mode, selectedMaterialIds } });
    expect(validateAiDesignRequest(value, catalog).ok).toBe(true);
    const allowed = allowedMaterialIdsForRequest(value, catalog);
    expect(allowed.has("mat-pearl")).toBe(true);
    expect(allowed.has("mat-sequin")).toBe(mode !== "user-only");
    expect(requiredMaterialIdsForRequest(value).has("mat-pearl")).toBe(mode === "collaborative");
  });

  it("boş istek, bilinmeyen katalog kimliği ve geçersiz ölçü/aralıkları reddeder", () => {
    const result = validateAiDesignRequest(request({
      prompt: "",
      target: { widthMm: 0, heightMm: 6_000 },
      materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-unknown"] },
      constraints: { minimumGapMm: -1, targetGapMm: 101, densityPercent: 0, symmetry: "optional", maxPlacements: 5_001 },
    }), catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(["prompt", "target", "materialSelection.selectedMaterialIds", "constraints.minimumGapMm", "constraints.targetGapMm"]));
  });

  it("güvenlik sınırını aşan referans üst verisini reddeder", () => {
    const result = validateAiDesignRequest(request({
      referenceImage: { name: "buyuk.png", mimeType: "image/png", sizeBytes: 9 * 1024 * 1024, widthPx: 9000, heightPx: 9000 },
    }), catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((issue) => issue.path === "referenceImage")).toBe(true);
  });
});

describe("yapılandırılmış AI tasarım planı", () => {
  it("sürümlü ve izinli planı kabul eder", () => {
    const result = parseAiDesignPlan(plan(), request(), catalog);
    expect(result.ok).toBe(true);
  });

  it("katalog dışı veya kullanıcıca izin verilmeyen malzemeyi reddeder", () => {
    const result = parseAiDesignPlan(plan({ materialIds: ["mat-sequin"] }), request(), catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((issue) => issue.path === "materialIds")).toBe(true);
  });

  it("geçersiz koordinat, açı ve kontrolsüz boncuk sınırını reddeder", () => {
    const invalid = plan();
    invalid.components[0] = {
      ...invalid.components[0]!,
      centerXmm: 999,
      rotationDeg: 360,
      placement: { ...invalid.components[0]!.placement, maxPlacements: 2_000 },
    };
    const result = parseAiDesignPlan(invalid, request({ constraints: { ...request().constraints, maxPlacements: 1_000 } }), catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(["components[0]", "components[0].rotationDeg", "components"]));
  });

  it("bozuk veya bilinmeyen sürümlü AI çıktısını güvenle reddeder", () => {
    expect(parseAiDesignPlan("geçersiz", request(), catalog).ok).toBe(false);
    expect(parseAiDesignPlan({ ...plan(), schemaVersion: "9.0" }, request(), catalog).ok).toBe(false);
  });
});
