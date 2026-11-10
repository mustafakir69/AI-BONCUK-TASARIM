import { describe, expect, it } from "vitest";
import fixture from "../../../contracts/ai-design-plan-v1.0.example.json";
import { parseAiDesignPlan, type AiDesignRequest } from "./aiDesign";
import { cloneInitialMaterials } from "./material";

describe("frontend/backend AI plan sözleşmesi", () => {
  it("ortak 1.0 örneğini frontend doğrulayıcıyla kabul eder", () => {
    const request: AiDesignRequest = {
      schemaVersion: "1.0", prompt: "Dal", target: { widthMm: 200, heightMm: 250 },
      materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-seed-bead"] },
      constraints: {
        minimumGapMm: 0.5, targetGapMm: 1, densityPercent: 70,
        symmetry: "none", maxPlacements: 100,
      },
    };
    expect(parseAiDesignPlan(fixture as unknown, request, cloneInitialMaterials()).ok).toBe(true);
  });
});
