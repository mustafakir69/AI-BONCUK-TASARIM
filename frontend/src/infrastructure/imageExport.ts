import type { ExportFormat, ExportPlan } from "../domain/export";
import type { Material } from "../domain/material";
import type { Placement } from "../domain/placement";

export interface ImageExportOptions {
  format: ExportFormat;
  plan: ExportPlan;
  dpi: number;
  quality: number;
  transparent: boolean;
  backgroundColor: string;
  materials: readonly Material[];
  placements: readonly Placement[];
}

function drawPlacement(
  context: CanvasRenderingContext2D,
  placement: Placement,
  material: Material,
  pixelsPerMm: number,
  minX: number,
  minY: number,
): void {
  const x = (placement.xMm - minX) * pixelsPerMm;
  const y = (placement.yMm - minY) * pixelsPerMm;
  const width = material.widthMm * pixelsPerMm;
  const height = material.heightMm * pixelsPerMm;
  context.save();
  context.translate(x, y);
  context.rotate((placement.rotationDeg * Math.PI) / 180);
  context.fillStyle = placement.colorOverride ?? material.color;
  if (material.shape === "circle") {
    context.beginPath();
    context.arc(0, 0, width / 2, 0, Math.PI * 2);
    context.fill();
  } else if (material.shape === "ring") {
    context.beginPath();
    context.arc(0, 0, width / 2, 0, Math.PI * 2, false);
    context.arc(0, 0, (material.holeDiameterMm ?? 0) * pixelsPerMm / 2, 0, Math.PI * 2, true);
    context.fill("evenodd");
  } else {
    context.fillRect(-width / 2, -height / 2, width, height);
  }
  context.restore();
}

export async function renderProjectImage(options: ImageExportOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = options.plan.widthPx;
  canvas.height = options.plan.heightPx;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tarayıcı görsel tuvali oluşturamadı.");
  if (options.format === "jpeg" || !options.transparent) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const pixelsPerMm = options.dpi / 25.4;
  for (const placement of options.placements) {
    const material = options.materials.find((item) => item.id === placement.materialId);
    if (material) {
      drawPlacement(
        context, placement, material, pixelsPerMm,
        options.plan.bounds.minX, options.plan.bounds.minY,
      );
    }
  }
  const mimeType = options.format === "png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Görsel dosyası üretilemedi.")),
      mimeType,
      options.format === "jpeg" ? options.quality : undefined,
    );
  });
}
