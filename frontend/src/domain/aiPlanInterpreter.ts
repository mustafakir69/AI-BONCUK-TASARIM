import { createArcLengthTable, sampleArcLength, type ArcPoint } from "./arcLength";
import type { AiDesignPlan, AiDesignPlanComponent, AiDesignRequest, AiPlanPoint } from "./aiDesign";
import { validateAiPlacementProposal } from "./aiPlacementValidation";
import { generateMotif, type MotifGenerationRequest } from "./motifGeneration";
import type { Material } from "./material";
import { normalizeRotation, type Placement } from "./placement";

export interface AiPlanInterpretation {
  placements: Placement[];
  unsupportedComponents: string[];
  approximations: string[];
  warnings: string[];
  rejectedCandidates: number;
}

function degrees(dx: number, dy: number): number {
  return normalizeRotation(Math.atan2(dy, dx) * 180 / Math.PI);
}

function rotateAround(point: ArcPoint, centerX: number, centerY: number, rotationDeg: number): ArcPoint {
  const radians = rotationDeg * Math.PI / 180;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return {
    x: centerX + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: centerY + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

function cubic(points: readonly AiPlanPoint[]): ArcPoint[] {
  if (points.length !== 4) return [];
  const p0 = points[0]!;
  const p1 = points[1]!;
  const p2 = points[2]!;
  const p3 = points[3]!;
  return Array.from({ length: 81 }, (_, index) => {
    const t = index / 80;
    const u = 1 - t;
    return {
      x: u ** 3 * p0.xMm + 3 * u ** 2 * t * p1.xMm + 3 * u * t ** 2 * p2.xMm + t ** 3 * p3.xMm,
      y: u ** 3 * p0.yMm + 3 * u ** 2 * t * p1.yMm + 3 * u * t ** 2 * p2.yMm + t ** 3 * p3.yMm,
    };
  });
}

function componentPath(component: AiDesignPlanComponent): ArcPoint[] {
  const geometry = component.geometry;
  if (!geometry) {
    return [
      { x: component.centerXmm - component.widthMm / 2, y: component.centerYmm },
      { x: component.centerXmm + component.widthMm / 2, y: component.centerYmm },
    ].map((point) => rotateAround(point, component.centerXmm, component.centerYmm, component.rotationDeg));
  }
  if (geometry.type === "bezier") return cubic(geometry.points);
  if (geometry.type === "line" || geometry.type === "polyline") {
    return geometry.points.map((point) => ({ x: point.xMm, y: point.yMm }));
  }
  if (geometry.type === "rectangle" && component.placement.strategy === "edge") {
    const halfWidth = component.widthMm / 2;
    const halfHeight = component.heightMm / 2;
    return [
      { x: component.centerXmm - halfWidth, y: component.centerYmm - halfHeight },
      { x: component.centerXmm + halfWidth, y: component.centerYmm - halfHeight },
      { x: component.centerXmm + halfWidth, y: component.centerYmm + halfHeight },
      { x: component.centerXmm - halfWidth, y: component.centerYmm + halfHeight },
      { x: component.centerXmm - halfWidth, y: component.centerYmm - halfHeight },
    ].map((point) => rotateAround(point, component.centerXmm, component.centerYmm, component.rotationDeg));
  }
  return [];
}

function pathPlacements(
  component: AiDesignPlanComponent,
  materials: readonly Material[],
): Placement[] {
  const points = componentPath(component);
  if (points.length < 2 || materials.length === 0) return [];
  const table = createArcLengthTable(points);
  const maximumSize = Math.max(...materials.map((material) => Math.hypot(material.widthMm, material.heightMm)));
  const spacing = Math.max(0.1, maximumSize + component.placement.targetGapMm) *
    (100 / component.placement.densityPercent);
  const count = Math.min(component.placement.maxPlacements, Math.max(1, Math.floor(table.totalLength / spacing) + 1));
  return Array.from({ length: count }, (_, index) => {
    const distance = count === 1 ? table.totalLength / 2 : table.totalLength * index / (count - 1);
    const point = sampleArcLength(table, distance);
    const before = sampleArcLength(table, Math.max(0, distance - 0.05));
    const after = sampleArcLength(table, Math.min(table.totalLength, distance + 0.05));
    return {
      id: `ai-${component.id}-${index}`,
      materialId: materials[index % materials.length]!.id,
      xMm: point.x,
      yMm: point.y,
      rotationDeg: degrees(after.x - before.x, after.y - before.y),
    };
  });
}

function motifRequest(
  component: AiDesignPlanComponent,
  request: AiDesignRequest,
  pattern: "ring" | "geometric",
): MotifGenerationRequest {
  return {
    pattern,
    widthMm: component.widthMm,
    heightMm: component.heightMm,
    centerXmm: component.centerXmm,
    centerYmm: component.centerYmm,
    materials: component.placement.materialIds.map((materialId) => ({ materialId, weight: 1 })),
    targetGapMm: component.placement.targetGapMm,
    minimumGapMm: request.constraints.minimumGapMm,
    symmetry: "none",
    radialRepeats: 4,
    repeatCount: 1,
    densityPercent: component.placement.densityPercent,
    seed: `ai-plan-${component.id}`,
  };
}

function componentCandidates(
  component: AiDesignPlanComponent,
  request: AiDesignRequest,
  catalog: readonly Material[],
): { placements: Placement[]; approximation?: string; unsupported?: string; warnings: string[] } {
  const geometryType = component.geometry?.type;
  if (geometryType === "unsupported") {
    return { placements: [], unsupported: `${component.label}: ${component.geometry?.interpretationNote ?? "Desteklenmeyen özgün biçim"}`, warnings: [] };
  }
  const materials = component.placement.materialIds
    .map((id) => catalog.find((material) => material.id === id))
    .filter((material): material is Material => Boolean(material));
  if (geometryType === "line" || geometryType === "polyline" || geometryType === "bezier" ||
    geometryType === "rectangle" && component.placement.strategy === "edge" ||
    !geometryType && component.kind === "path") {
    return { placements: pathPlacements(component, materials), warnings: [] };
  }
  if (geometryType === "point-cluster") {
    const points = component.geometry?.points ?? [];
    return {
      placements: points.slice(0, component.placement.maxPlacements).map((point, index) => ({
        id: `ai-${component.id}-${index}`,
        materialId: materials[index % materials.length]?.id ?? "",
        xMm: point.xMm,
        yMm: point.yMm,
        rotationDeg: component.rotationDeg,
      })),
      warnings: [],
    };
  }
  const pattern = geometryType === "ellipse" && component.placement.strategy !== "fill-region" ? "ring" : "geometric";
  const generated = generateMotif(motifRequest(component, request, pattern), catalog, {
    maxPlacements: Math.min(component.placement.maxPlacements, request.constraints.maxPlacements),
    maxCandidates: Math.min(40_000, component.placement.maxPlacements * 30),
    maxDurationMs: 750,
  });
  if (!generated.ok) return { placements: [], warnings: [generated.message] };
  return {
    placements: generated.placements.map((placement) => {
      const point = rotateAround(
        { x: placement.xMm, y: placement.yMm },
        component.centerXmm,
        component.centerYmm,
        component.rotationDeg,
      );
      return {
        ...placement,
        xMm: point.x,
        yMm: point.y,
        rotationDeg: normalizeRotation(placement.rotationDeg + component.rotationDeg),
      };
    }),
    approximation: geometryType === "ellipse" || geometryType === "rectangle" ? undefined :
      `${component.label}, bileşen sınır kutusu içinde geometrik dolgu olarak yaklaştırıldı.`,
    warnings: generated.report.warnings,
  };
}

export function interpretAiDesignPlan(
  plan: AiDesignPlan,
  request: AiDesignRequest,
  catalog: readonly Material[],
): AiPlanInterpretation {
  const accepted: Placement[] = [];
  const unsupportedComponents: string[] = [];
  const approximations: string[] = [];
  const warnings = [...plan.warnings, ...plan.uncertainties];
  let rejectedCandidates = 0;
  const incrementalRequest: AiDesignRequest = {
    ...request,
    materialSelection: { mode: "ai-selects", selectedMaterialIds: [] },
  };

  for (const component of [...plan.components].sort((left, right) => right.priority - left.priority || left.layer - right.layer)) {
    const result = componentCandidates(component, request, catalog);
    if (result.unsupported) unsupportedComponents.push(result.unsupported);
    if (result.approximation) approximations.push(result.approximation);
    warnings.push(...result.warnings);
    for (const candidate of result.placements) {
      if (accepted.length >= request.constraints.maxPlacements) break;
      const validation = validateAiPlacementProposal([...accepted, candidate], plan, incrementalRequest, catalog);
      if (validation.ok) accepted.push(candidate);
      else rejectedCandidates += 1;
    }
  }

  const finalValidation = validateAiPlacementProposal(accepted, plan, request, catalog);
  if (!finalValidation.ok) warnings.push(...finalValidation.issues.map((issue) => issue.message));
  if (rejectedCandidates > 0) warnings.push(`${rejectedCandidates} aday sınır, çakışma veya minimum aralık nedeniyle reddedildi.`);
  return {
    placements: finalValidation.ok ? finalValidation.value : [],
    unsupportedComponents,
    approximations,
    warnings: [...new Set(warnings)],
    rejectedCandidates,
  };
}

