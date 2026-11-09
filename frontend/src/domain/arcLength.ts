import { normalizeRotation } from "./placement";

export interface ArcPoint {
  x: number;
  y: number;
}

export interface ArcLengthTable {
  points: readonly ArcPoint[];
  cumulativeLengths: readonly number[];
  totalLength: number;
  closed: boolean;
}

export interface ArcLengthSample extends ArcPoint {
  rotationDeg: number;
}

const POINT_EPSILON = 1e-9;

function samePoint(first: ArcPoint, second: ArcPoint): boolean {
  return Math.abs(first.x - second.x) <= POINT_EPSILON &&
    Math.abs(first.y - second.y) <= POINT_EPSILON;
}

export function createArcLengthTable(
  sourcePoints: readonly ArcPoint[],
  closed = false,
): ArcLengthTable {
  if (sourcePoints.length < 2) {
    throw new Error("Yay uzunluğu tablosu için en az iki nokta gerekir.");
  }

  const points = sourcePoints.map((point) => ({ ...point }));
  if (closed && !samePoint(points[0]!, points.at(-1)!)) points.push({ ...points[0]! });

  const cumulativeLengths = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const segmentLength = Math.hypot(current.x - previous.x, current.y - previous.y);
    cumulativeLengths.push(cumulativeLengths[index - 1]! + segmentLength);
  }

  return {
    points,
    cumulativeLengths,
    totalLength: cumulativeLengths.at(-1) ?? 0,
    closed,
  };
}

function normalizedDistance(table: ArcLengthTable, distance: number): number {
  if (!Number.isFinite(distance) || table.totalLength <= POINT_EPSILON) return 0;
  if (!table.closed) return Math.min(table.totalLength, Math.max(0, distance));
  return ((distance % table.totalLength) + table.totalLength) % table.totalLength;
}

export function sampleArcLength(table: ArcLengthTable, distance: number): ArcLengthSample {
  const target = normalizedDistance(table, distance);
  let low = 1;
  let high = table.cumulativeLengths.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (table.cumulativeLengths[middle]! < target) low = middle + 1;
    else high = middle;
  }

  let endIndex = Math.max(1, low);
  while (
    endIndex < table.cumulativeLengths.length - 1 &&
    table.cumulativeLengths[endIndex]! - table.cumulativeLengths[endIndex - 1]! <= POINT_EPSILON
  ) endIndex += 1;

  const start = table.points[endIndex - 1]!;
  const end = table.points[endIndex]!;
  const segmentStart = table.cumulativeLengths[endIndex - 1]!;
  const segmentLength = Math.max(POINT_EPSILON, table.cumulativeLengths[endIndex]! - segmentStart);
  const ratio = Math.min(1, Math.max(0, (target - segmentStart) / segmentLength));

  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
    rotationDeg: normalizeRotation(Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI),
  };
}
