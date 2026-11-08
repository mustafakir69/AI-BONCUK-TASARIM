import type { Material } from "./material";
import { countPlacementsByMaterial, type Placement } from "./placement";

const SHAPE_NAMES = {
  square: "Kare", rectangle: "Dikdörtgen", circle: "Daire", ring: "Ortası delikli daire",
} as const;

function cell(value: string | number): string {
  const text = typeof value === "number" ? String(value).replace(".", ",") : value;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createMaterialReportCsv(
  materials: readonly Material[],
  placements: readonly Placement[],
): string {
  const counts = countPlacementsByMaterial(placements);
  const rows = materials
    .filter((material) => (counts[material.id] ?? 0) > 0)
    .map((material) => [
      material.name, material.id, SHAPE_NAMES[material.shape], material.widthMm,
      material.heightMm, material.color, counts[material.id] ?? 0,
    ].map(cell).join(";"));
  return `\uFEFF${["Malzeme adı", "Malzeme ID", "Geometri", "Genişlik (mm)", "Yükseklik (mm)", "Renk", "Adet"].map(cell).join(";")}\r\n${rows.join("\r\n")}\r\n`;
}
