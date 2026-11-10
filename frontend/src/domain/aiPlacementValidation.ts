import type { AiDesignPlan, AiDesignRequest, AiValidationResult } from "./aiDesign";
import { allowedMaterialIdsForRequest } from "./aiDesign";
import { requiredMaterialIdsForRequest } from "./aiDesign";
import { geometryAabb, EPSILON_MM } from "./geometry/primitives";
import { createPlacementGeometry } from "./geometry/transforms";
import { validateAllPlacements } from "./geometry/validation";
import type { Material } from "./material";
import type { Placement } from "./placement";

export function validateAiPlacementProposal(
  placements: readonly Placement[],
  plan: AiDesignPlan,
  request: AiDesignRequest,
  catalog: readonly Material[],
): AiValidationResult<Placement[]> {
  const issues: Array<{ path: string; message: string }> = [];
  if (!Array.isArray(placements) || placements.length > request.constraints.maxPlacements) {
    return { ok: false, issues: [{ path: "placements", message: "AI yerleşim önerisi kullanıcı boncuk sınırını aşıyor." }] };
  }

  const ids = new Set<string>();
  const allowedIds = allowedMaterialIdsForRequest(request, catalog);
  const planIds = new Set(plan.materialIds);
  const materialsById = new Map(catalog.map((material) => [material.id, material]));
  const placedMaterialIds = new Set<string>();
  const halfWidth = request.target.widthMm / 2;
  const halfHeight = request.target.heightMm / 2;

  placements.forEach((placement, index) => {
    const path = `placements[${index}]`;
    if (!placement || typeof placement !== "object") {
      issues.push({ path, message: "Yerleşim nesnesi geçersiz." });
      return;
    }
    if (typeof placement.id !== "string" || placement.id.trim().length === 0 || ids.has(placement.id)) {
      issues.push({ path: `${path}.id`, message: "Yerleşim kimliği boş veya yinelenmiş." });
    } else ids.add(placement.id);
    if (!allowedIds.has(placement.materialId) || !planIds.has(placement.materialId)) {
      issues.push({ path: `${path}.materialId`, message: "Yerleşim katalog dışı veya planda izin verilmeyen malzeme kullanıyor." });
      return;
    }
    placedMaterialIds.add(placement.materialId);
    if (!Number.isFinite(placement.xMm) || !Number.isFinite(placement.yMm) || !Number.isFinite(placement.rotationDeg) || placement.rotationDeg < 0 || placement.rotationDeg >= 360) {
      issues.push({ path, message: "Yerleşim koordinatı veya açısı geçersiz." });
      return;
    }
    const material = materialsById.get(placement.materialId);
    if (!material?.active) {
      issues.push({ path: `${path}.materialId`, message: "Yerleşimin malzemesi etkin değil." });
      return;
    }
    const aabb = geometryAabb(createPlacementGeometry(placement, material));
    if (
      aabb.minX < -halfWidth - EPSILON_MM || aabb.maxX > halfWidth + EPSILON_MM ||
      aabb.minY < -halfHeight - EPSILON_MM || aabb.maxY > halfHeight + EPSILON_MM
    ) issues.push({ path, message: "Yerleşim hedef motif sınırının dışına taşıyor." });
  });

  for (const requiredId of requiredMaterialIdsForRequest(request)) {
    if (!placedMaterialIds.has(requiredId)) issues.push({ path: "placements", message: `Birlikte seçimde zorunlu malzeme yerleşimlerde eksik: ${requiredId}.` });
  }

  if (issues.length === 0) {
    const geometry = validateAllPlacements(placements, catalog, request.constraints.minimumGapMm);
    if (!geometry.valid) issues.push({ path: "placements", message: "AI yerleşim önerisi çakışma veya minimum güvenlik aralığı kuralını geçemedi." });
  }

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: placements.map((placement) => ({ ...placement })) };
}
