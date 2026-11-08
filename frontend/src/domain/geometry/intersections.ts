import {
  EPSILON_MM,
  type CircleGeometry,
  type GeometryPoint,
  type PlacementGeometry,
  type PolygonGeometry,
} from "./primitives";

function subtract(a: GeometryPoint, b: GeometryPoint): GeometryPoint {
  return { x: a.x - b.x, y: a.y - b.y };
}

function dot(a: GeometryPoint, b: GeometryPoint): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: GeometryPoint, b: GeometryPoint, c: GeometryPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointToSegmentDistance(
  point: GeometryPoint,
  start: GeometryPoint,
  end: GeometryPoint,
): number {
  const segment = subtract(end, start);
  const lengthSquared = dot(segment, segment);
  if (lengthSquared <= EPSILON_MM * EPSILON_MM) return Math.hypot(point.x - start.x, point.y - start.y);
  const offset = subtract(point, start);
  const t = Math.max(0, Math.min(1, dot(offset, segment) / lengthSquared));
  const closest = { x: start.x + segment.x * t, y: start.y + segment.y * t };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function orientation(a: GeometryPoint, b: GeometryPoint, c: GeometryPoint): number {
  const value = cross(a, b, c);
  if (Math.abs(value) <= EPSILON_MM) return 0;
  return value > 0 ? 1 : -1;
}

function onSegment(a: GeometryPoint, b: GeometryPoint, point: GeometryPoint): boolean {
  return (
    point.x >= Math.min(a.x, b.x) - EPSILON_MM &&
    point.x <= Math.max(a.x, b.x) + EPSILON_MM &&
    point.y >= Math.min(a.y, b.y) - EPSILON_MM &&
    point.y <= Math.max(a.y, b.y) + EPSILON_MM
  );
}

function segmentsIntersect(
  aStart: GeometryPoint,
  aEnd: GeometryPoint,
  bStart: GeometryPoint,
  bEnd: GeometryPoint,
): boolean {
  const o1 = orientation(aStart, aEnd, bStart);
  const o2 = orientation(aStart, aEnd, bEnd);
  const o3 = orientation(bStart, bEnd, aStart);
  const o4 = orientation(bStart, bEnd, aEnd);
  if (o1 !== o2 && o3 !== o4) return true;
  return (
    (o1 === 0 && onSegment(aStart, aEnd, bStart)) ||
    (o2 === 0 && onSegment(aStart, aEnd, bEnd)) ||
    (o3 === 0 && onSegment(bStart, bEnd, aStart)) ||
    (o4 === 0 && onSegment(bStart, bEnd, aEnd))
  );
}

function segmentDistance(
  aStart: GeometryPoint,
  aEnd: GeometryPoint,
  bStart: GeometryPoint,
  bEnd: GeometryPoint,
): number {
  if (segmentsIntersect(aStart, aEnd, bStart, bEnd)) return 0;
  return Math.min(
    pointToSegmentDistance(aStart, bStart, bEnd),
    pointToSegmentDistance(aEnd, bStart, bEnd),
    pointToSegmentDistance(bStart, aStart, aEnd),
    pointToSegmentDistance(bEnd, aStart, aEnd),
  );
}

function polygonEdges(points: readonly GeometryPoint[]): Array<[GeometryPoint, GeometryPoint]> {
  return points.map((point, index) => [point, points[(index + 1) % points.length] ?? point]);
}

function pointInConvexPolygon(point: GeometryPoint, polygon: PolygonGeometry): boolean {
  let direction = 0;
  for (const [start, end] of polygonEdges(polygon.points)) {
    const value = cross(start, end, point);
    if (Math.abs(value) <= EPSILON_MM) continue;
    const current = value > 0 ? 1 : -1;
    if (direction !== 0 && current !== direction) return false;
    direction = current;
  }
  return true;
}

function distancePointToPolygonEdges(point: GeometryPoint, polygon: PolygonGeometry): number {
  return Math.min(
    ...polygonEdges(polygon.points).map(([start, end]) => pointToSegmentDistance(point, start, end)),
  );
}

function projectPolygon(points: readonly GeometryPoint[], axis: GeometryPoint): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    const projection = dot(point, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }
  return [min, max];
}

function polygonAxes(polygon: PolygonGeometry): GeometryPoint[] {
  return polygonEdges(polygon.points).map(([start, end]) => {
    const edge = subtract(end, start);
    const length = Math.hypot(edge.x, edge.y);
    return { x: -edge.y / length, y: edge.x / length };
  });
}

function polygonsOverlap(a: PolygonGeometry, b: PolygonGeometry): boolean {
  for (const axis of [...polygonAxes(a), ...polygonAxes(b)]) {
    const [aMin, aMax] = projectPolygon(a.points, axis);
    const [bMin, bMax] = projectPolygon(b.points, axis);
    const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
    if (overlap <= EPSILON_MM) return false;
  }
  return true;
}

function circlePolygonOverlap(circle: CircleGeometry, polygon: PolygonGeometry): boolean {
  if (pointInConvexPolygon(circle.center, polygon)) return true;
  return distancePointToPolygonEdges(circle.center, polygon) < circle.radius - EPSILON_MM;
}

export function geometriesOverlap(a: PlacementGeometry, b: PlacementGeometry): boolean {
  if (a.kind === "circle" && b.kind === "circle") {
    const distance = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
    return distance < a.radius + b.radius - EPSILON_MM;
  }
  if (a.kind === "polygon" && b.kind === "polygon") return polygonsOverlap(a, b);
  return a.kind === "circle" ? circlePolygonOverlap(a, b as PolygonGeometry) : circlePolygonOverlap(b as CircleGeometry, a);
}

function polygonDistance(a: PolygonGeometry, b: PolygonGeometry): number {
  if (polygonsOverlap(a, b)) return 0;
  let minimum = Infinity;
  for (const [aStart, aEnd] of polygonEdges(a.points)) {
    for (const [bStart, bEnd] of polygonEdges(b.points)) {
      minimum = Math.min(minimum, segmentDistance(aStart, aEnd, bStart, bEnd));
    }
  }
  return minimum;
}

function circlePolygonDistance(circle: CircleGeometry, polygon: PolygonGeometry): number {
  if (pointInConvexPolygon(circle.center, polygon)) return 0;
  return Math.max(0, distancePointToPolygonEdges(circle.center, polygon) - circle.radius);
}

export function distanceBetweenGeometries(a: PlacementGeometry, b: PlacementGeometry): number {
  if (a.kind === "circle" && b.kind === "circle") {
    return Math.max(0, Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) - a.radius - b.radius);
  }
  if (a.kind === "polygon" && b.kind === "polygon") return polygonDistance(a, b);
  return a.kind === "circle" ? circlePolygonDistance(a, b as PolygonGeometry) : circlePolygonDistance(b as CircleGeometry, a);
}

