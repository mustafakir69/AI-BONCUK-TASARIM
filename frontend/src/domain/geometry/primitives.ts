export const EPSILON_MM = 1e-7;

export interface GeometryPoint {
  x: number;
  y: number;
}

export interface Aabb {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CircleGeometry {
  kind: "circle";
  center: GeometryPoint;
  radius: number;
}

export interface PolygonGeometry {
  kind: "polygon";
  points: readonly GeometryPoint[];
}

export type PlacementGeometry = CircleGeometry | PolygonGeometry;

export function geometryAabb(geometry: PlacementGeometry): Aabb {
  if (geometry.kind === "circle") {
    return {
      minX: geometry.center.x - geometry.radius,
      maxX: geometry.center.x + geometry.radius,
      minY: geometry.center.y - geometry.radius,
      maxY: geometry.center.y + geometry.radius,
    };
  }

  return geometry.points.reduce<Aabb>(
    (aabb, point) => ({
      minX: Math.min(aabb.minX, point.x),
      maxX: Math.max(aabb.maxX, point.x),
      minY: Math.min(aabb.minY, point.y),
      maxY: Math.max(aabb.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

export function aabbDistance(a: Aabb, b: Aabb): number {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.hypot(dx, dy);
}

