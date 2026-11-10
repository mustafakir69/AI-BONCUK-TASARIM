import { describe, expect, it } from "vitest";
import { interpretAiDesignPlan } from "./aiPlanInterpreter";
import type { AiDesignPlan, AiDesignRequest } from "./aiDesign";
import { cloneInitialMaterials } from "./material";

const request: AiDesignRequest = {
  schemaVersion: "1.0",
  prompt: "Bir dal oluştur.",
  target: { widthMm: 200, heightMm: 250 },
  materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-seed-bead"] },
  constraints: {
    minimumGapMm: 0.5, targetGapMm: 1, densityPercent: 70,
    symmetry: "none", maxPlacements: 100,
  },
};

function linePlan(type: "line" | "unsupported" = "line"): AiDesignPlan {
  return {
    schemaVersion: "1.0",
    description: "Dal",
    target: request.target,
    materialIds: ["mat-seed-bead"],
    components: [{
      id: "dal", kind: "path", label: "Dal", centerXmm: 0, centerYmm: 0,
      widthMm: 100, heightMm: 20, rotationDeg: 0, layer: 0, priority: 1,
      geometry: {
        type,
        points: type === "line" ? [{ xMm: -50, yMm: 0 }, { xMm: 50, yMm: 0 }] : [],
        closed: false,
        interpretationNote: type === "line" ? "Düz çizgi" : "Özgün yaprak konturu desteklenmiyor.",
      },
      placement: {
        strategy: "follow-path", materialIds: ["mat-seed-bead"],
        targetGapMm: 1, densityPercent: 70, maxPlacements: 30,
      },
    }],
    densityRegions: [], symmetry: { type: "none" }, placementInstructions: [], warnings: [], uncertainties: [],
  };
}

describe("AI plan yorumlayıcı", () => {
  it("desteklenen çizgiyi bağımsız, mm koordinatlı placement nesnelerine dönüştürür", () => {
    const result = interpretAiDesignPlan(linePlan(), request, cloneInitialMaterials());
    expect(result.placements.length).toBeGreaterThan(1);
    expect(new Set(result.placements.map((item) => item.id)).size).toBe(result.placements.length);
    expect(result.placements.every((item) => item.materialId === "mat-seed-bead")).toBe(true);
    expect(result.unsupportedComponents).toEqual([]);
  });

  it("özgün desteklenmeyen biçimi sessizce başka motife dönüştürmez", () => {
    const result = interpretAiDesignPlan(linePlan("unsupported"), request, cloneInitialMaterials());
    expect(result.placements).toEqual([]);
    expect(result.unsupportedComponents[0]).toMatch(/Özgün yaprak/);
  });

  it("çakışan nokta kümesi adaylarını kesin geometri kapısında reddeder", () => {
    const plan = linePlan();
    plan.components[0]!.geometry = {
      type: "point-cluster",
      points: [{ xMm: 0, yMm: 0 }, { xMm: 0, yMm: 0 }, { xMm: 20, yMm: 0 }],
      closed: false,
      interpretationNote: "Üç vurgu noktası",
    };
    plan.components[0]!.placement.strategy = "cluster";
    const result = interpretAiDesignPlan(plan, request, cloneInitialMaterials());
    expect(result.placements).toHaveLength(2);
    expect(result.rejectedCandidates).toBe(1);
  });
});
