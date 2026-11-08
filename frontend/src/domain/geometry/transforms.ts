import type { Material } from "../material";
import type { Placement } from "../placement";
import type { GeometryPoint, PlacementGeometry } from "./primitives";

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function rotatePoint(point: GeometryPoint, radians: number): GeometryPoint {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function createPlacementGeometry(
  placement: Placement,
  material: Material,
): PlacementGeometry {
  if (material.shape === "circle" || material.shape === "ring") {
    return {
      kind: "circle",
      center: { x: placement.xMm, y: placement.yMm },
      radius: material.widthMm / 2,
    };
  }

  const halfWidth = material.widthMm / 2;
  const halfHeight = material.heightMm / 2;
  const radians = degreesToRadians(placement.rotationDeg);
  const localPoints: GeometryPoint[] = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  return {
    kind: "polygon",
    points: localPoints.map((point) => {
      const rotated = rotatePoint(point, radians);
      return { x: placement.xMm + rotated.x, y: placement.yMm + rotated.y };
    }),
  };
}

