import { describe, expect, it } from "vitest";
import { AI_DESIGN_PLAN_SCHEMA_VERSION, AI_DESIGN_REQUEST_SCHEMA_VERSION, type AiDesignPlan, type AiDesignRequest } from "./aiDesign";
import { validateAiPlacementProposal } from "./aiPlacementValidation";
import { cloneInitialMaterials } from "./material";
import type { Placement } from "./placement";

const catalog = cloneInitialMaterials();
const request: AiDesignRequest = {
  schemaVersion: AI_DESIGN_REQUEST_SCHEMA_VERSION,
  prompt: "İnci dizisi",
  target: { widthMm: 100, heightMm: 100 },
  materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-pearl"] },
  constraints: { minimumGapMm: 1, targetGapMm: 1, densityPercent: 70, symmetry: "none", maxPlacements: 10 },
};
const plan: AiDesignPlan = {
  schemaVersion: AI_DESIGN_PLAN_SCHEMA_VERSION,
  description: "İnci dizisi",
  target: { ...request.target },
  materialIds: ["mat-pearl"],
  components: [],
  densityRegions: [],
  symmetry: { type: "none" },
  placementInstructions: [],
  warnings: [],
  uncertainties: [],
};

function placement(id: string, xMm: number, yMm = 0): Placement {
  return { id, materialId: "mat-pearl", xMm, yMm, rotationDeg: 0 };
}

describe("AI placement önerisi güvenlik kapısı", () => {
  it("izinli, sınır içi ve aralığı sağlayan bağımsız nesneleri kabul eder", () => {
    const result = validateAiPlacementProposal([placement("a", -5), placement("b", 5)], plan, request, catalog);
    expect(result.ok).toBe(true);
  });

  it("çakışan veya minimum aralığı ihlal eden önerinin tamamını reddeder", () => {
    expect(validateAiPlacementProposal([placement("a", 0), placement("b", 4.5)], plan, request, catalog)).toMatchObject({ ok: false });
  });

  it("katalog/planda izin verilmeyen malzemeyi ve sınır dışı koordinatı reddeder", () => {
    const unknown = { ...placement("a", 0), materialId: "mat-sequin" };
    expect(validateAiPlacementProposal([unknown], plan, request, catalog)).toMatchObject({ ok: false });
    expect(validateAiPlacementProposal([placement("outside", 49)], plan, request, catalog)).toMatchObject({ ok: false });
  });

  it("yinelenen kimliği, geçersiz açıyı ve kullanıcı adet sınırını reddeder", () => {
    expect(validateAiPlacementProposal([placement("same", -10), placement("same", 10)], plan, request, catalog)).toMatchObject({ ok: false });
    expect(validateAiPlacementProposal([{ ...placement("angle", 0), rotationDeg: 360 }], plan, request, catalog)).toMatchObject({ ok: false });
    expect(validateAiPlacementProposal(Array.from({ length: 11 }, (_, index) => placement(`p${index}`, -45 + index * 9)), plan, request, catalog)).toMatchObject({ ok: false });
  });

  it("birlikte seçim modundaki zorunlu malzemenin nihai yerleşimde bulunmasını ister", () => {
    const collaborative: AiDesignRequest = {
      ...request,
      materialSelection: { mode: "collaborative", selectedMaterialIds: ["mat-pearl", "mat-bugle-bead"] },
    };
    const collaborativePlan: AiDesignPlan = { ...plan, materialIds: ["mat-pearl", "mat-bugle-bead"] };
    expect(validateAiPlacementProposal([placement("only-pearl", 0)], collaborativePlan, collaborative, catalog)).toMatchObject({ ok: false });
  });
});
