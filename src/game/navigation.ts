import type { MatchConfig } from './config';
import { canOccupy, castIsland, distance, type Point } from './geometry';
export function directPath(a: Point, b: Point, config: MatchConfig) {
  return config.level.islands.every(
    (island) =>
      castIsland(a, b, island, config.hull.radius + config.hull.halfLength) ===
      null,
  );
}
// A* is used only when a direct route is blocked; final movement still checks actual hull geometry.
export function findPath(
  start: Point,
  goal: Point,
  config: MatchConfig,
): Point[] {
  const cell = 32,
    columns = Math.floor(config.level.width / cell),
    rows = Math.floor(config.level.height / cell);
  const point = (id: number) => ({
    x: ((id % columns) + 0.5) * cell,
    y: (Math.floor(id / columns) + 0.5) * cell,
  });
  const free = (id: number) => {
    const p = point(id),
      margin =
        config.hull.halfLength +
        config.hull.radius +
        config.hull.boundaryMargin;
    return (
      id >= 0 &&
      id < columns * rows &&
      p.x >= margin &&
      p.x <= config.level.width - margin &&
      p.y >= margin &&
      p.y <= config.level.height - margin &&
      canOccupy(p, 0, config) &&
      canOccupy(p, Math.PI / 2, config)
    );
  };
  const closest = (p: Point) => {
    let best = -1,
      cost = Infinity;
    for (let id = 0; id < columns * rows; id++)
      if (free(id)) {
        const candidate = distance(point(id), p);
        if (candidate < cost) {
          best = id;
          cost = candidate;
        }
      }
    return best;
  };
  const from = closest(start),
    to = closest(goal);
  if (from < 0 || to < 0) return [];
  const open = new Set([from]),
    cost = new Map([[from, 0]]),
    parents = new Map<number, number>();
  const closed = new Set<number>();
  while (open.size > 0 && closed.size < columns * rows) {
    let current = -1,
      best = Infinity;
    for (const id of open) {
      const score = (cost.get(id) ?? Infinity) + distance(point(id), point(to));
      if (score < best) {
        current = id;
        best = score;
      }
    }
    if (current === to) {
      const path: Point[] = [point(to)];
      let id = to;
      while (parents.has(id)) {
        id = parents.get(id) ?? from;
        path.unshift(point(id));
      }
      return path;
    }
    open.delete(current);
    closed.add(current);
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      if (dx === undefined || dy === undefined) continue;
      const x = (current % columns) + dx,
        y = Math.floor(current / columns) + dy,
        next = y * columns + x;
      if (
        x < 0 ||
        x >= columns ||
        y < 0 ||
        y >= rows ||
        !free(next) ||
        closed.has(next) ||
        !directPath(point(current), point(next), config)
      )
        continue;
      const nextCost =
        (cost.get(current) ?? Infinity) + Math.hypot(dx, dy) * cell;
      if (nextCost < (cost.get(next) ?? Infinity)) {
        cost.set(next, nextCost);
        parents.set(next, current);
        open.add(next);
      }
    }
  }
  return [];
}
