import type { MatchConfig } from './config';
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number; radius?: number };
export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const fraction = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(p.x - a.x - dx * fraction, p.y - a.y - dy * fraction);
}
export function segmentRect(a: Point, b: Point, rect: Rect): number | null {
  let first = 0,
    last = 1;
  for (const [start, change, low, high] of [
    [a.x, b.x - a.x, rect.x, rect.x + rect.width],
    [a.y, b.y - a.y, rect.y, rect.y + rect.height],
  ]) {
    if (
      start === undefined ||
      change === undefined ||
      low === undefined ||
      high === undefined
    )
      continue;
    if (Math.abs(change) < 1e-9) {
      if (start < low || start > high) return null;
    } else {
      const t1 = (low - start) / change,
        t2 = (high - start) / change;
      first = Math.max(first, Math.min(t1, t2));
      last = Math.min(last, Math.max(t1, t2));
      if (first > last) return null;
    }
  }
  return first;
}
export function segmentCircle(
  a: Point,
  b: Point,
  center: Point,
  radius: number,
): number | null {
  const x = a.x - center.x,
    y = a.y - center.y,
    dx = b.x - a.x,
    dy = b.y - a.y;
  const c = x * x + y * y - radius * radius;
  if (c <= 0) return 0;
  const length = dx * dx + dy * dy,
    dot = x * dx + y * dy,
    discriminant = dot * dot - length * c;
  if (length === 0 || discriminant < 0) return null;
  const t = (-dot - Math.sqrt(discriminant)) / length;
  return t >= 0 && t <= 1 ? t : null;
}
function segmentRectDistance(a: Point, b: Point, rect: Rect) {
  if (segmentRect(a, b, rect) !== null) return 0;
  let result = Infinity;
  for (const p of [a, b]) {
    const x = Math.max(rect.x, Math.min(rect.x + rect.width, p.x));
    const y = Math.max(rect.y, Math.min(rect.y + rect.height, p.y));
    result = Math.min(result, distance(p, { x, y }));
  }
  for (const x of [rect.x, rect.x + rect.width])
    for (const y of [rect.y, rect.y + rect.height])
      result = Math.min(result, pointSegmentDistance({ x, y }, a, b));
  return result;
}
export function hullEnds(
  position: Point,
  heading: number,
  halfLength: number,
): [Point, Point] {
  const x = Math.sin(heading) * halfLength,
    y = -Math.cos(heading) * halfLength;
  return [
    { x: position.x - x, y: position.y - y },
    { x: position.x + x, y: position.y + y },
  ];
}
export function canOccupy(
  position: Point,
  heading: number,
  config: MatchConfig,
) {
  const [a, b] = hullEnds(position, heading, config.hull.halfLength);
  const radius = config.hull.radius,
    margin = radius + config.hull.boundaryMargin;
  for (const p of [a, b])
    if (
      p.x < margin ||
      p.y < margin ||
      p.x > config.level.width - margin ||
      p.y > config.level.height - margin
    )
      return false;
  for (const island of config.level.islands) {
    const r = island.radius;
    if (
      segmentRectDistance(a, b, {
        x: island.x + r,
        y: island.y,
        width: island.width - 2 * r,
        height: island.height,
      }) < radius ||
      segmentRectDistance(a, b, {
        x: island.x,
        y: island.y + r,
        width: island.width,
        height: island.height - 2 * r,
      }) < radius
    )
      return false;
    for (const x of [island.x + r, island.x + island.width - r])
      for (const y of [island.y + r, island.y + island.height - r])
        if (pointSegmentDistance({ x, y }, a, b) < radius + r) return false;
  }
  return true;
}
