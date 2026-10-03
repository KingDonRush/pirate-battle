import { LEVEL, type LevelDefinition } from './config';
import type { Rect, Point } from './geometry';
export type ViewTransform = Readonly<{
  x: number;
  y: number;
  scale: number;
  angle: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  bounds: Readonly<Rect>;
}>;
export function fitWorld(
  width: number,
  height: number,
  angle: number,
  level: LevelDefinition = LEVEL,
  coverage: readonly Point[] = [],
): ViewTransform {
  const originX = level.width / 2,
    originY = level.height / 2;
  const extentX = Math.max(
    originX + (level.navigationPadding ?? 0),
    ...coverage.map((point) => Math.abs(point.x - originX) + 72),
  );
  const extentY = Math.max(
    originY + (level.navigationPadding ?? 0),
    ...coverage.map((point) => Math.abs(point.y - originY) + 72),
  );
  const c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  const scale = Math.min(
    width / (2 * extentX * c + 2 * extentY * s),
    height / (2 * extentY * c + 2 * extentX * s),
  );
  const worldWidth = (width * c + height * s) / scale,
    worldHeight = (height * c + width * s) / scale;
  return Object.freeze({
    x: width / 2,
    y: height / 2,
    scale,
    angle,
    width,
    height,
    originX,
    originY,
    bounds: Object.freeze({
      x: originX - worldWidth / 2,
      y: originY - worldHeight / 2,
      width: worldWidth,
      height: worldHeight,
    }),
  });
}
export function worldToView(x: number, y: number, view: ViewTransform) {
  const dx = x - view.originX,
    dy = y - view.originY,
    c = Math.cos(view.angle),
    s = Math.sin(view.angle);
  return {
    x: view.x + (dx * c - dy * s) * view.scale,
    y: view.y + (dx * s + dy * c) * view.scale,
  };
}
export function viewToWorld(x: number, y: number, view: ViewTransform) {
  const dx = (x - view.x) / view.scale,
    dy = (y - view.y) / view.scale,
    c = Math.cos(view.angle),
    s = Math.sin(view.angle);
  return {
    x: view.originX + dx * c + dy * s,
    y: view.originY - dx * s + dy * c,
  };
}
export class ReflowCoordinator {
  revision = 0;
  active = true;
  private measuredAt = 0;
  private stableFrames = 0;
  private startAngle = 0;
  private targetAngle = 0;
  private width = 1;
  private height = 1;
  private coverage: readonly Point[] = [];
  private view: ViewTransform = fitWorld(1, 1, 0);
  private reducedMotion: boolean;
  private freeze: () => void;
  private ready: () => void;
  private level: LevelDefinition;
  constructor(
    reducedMotion: boolean,
    freeze: () => void,
    ready: () => void,
    level: LevelDefinition = LEVEL,
  ) {
    this.reducedMotion = reducedMotion;
    this.freeze = freeze;
    this.ready = ready;
    this.level = level;
  }
  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
  }
  request(
    width: number,
    height: number,
    angle: number,
    now: number,
    coverage: readonly Point[] = [],
  ) {
    if (
      ![width, height, angle].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0
    ) {
      this.active = true;
      this.freeze();
      return;
    }
    if (
      Math.abs(width - this.width) < 0.5 &&
      Math.abs(height - this.height) < 0.5 &&
      Math.abs(
        Math.atan2(
          Math.sin(angle - this.targetAngle),
          Math.cos(angle - this.targetAngle),
        ),
      ) < 1e-8 &&
      this.revision > 0
    )
      return;
    this.revision++;
    this.width = width;
    this.height = height;
    this.startAngle = this.view.angle;
    let delta = angle - this.startAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.targetAngle = this.startAngle + delta;
    this.measuredAt = now;
    this.stableFrames = 0;
    // A layout generation owns frozen measurements, never live entity references.
    this.coverage = coverage.map(({ x, y }) => ({ x, y }));
    this.active = true;
    this.freeze();
  }
  update(now: number): ViewTransform {
    const duration = this.reducedMotion ? 0 : 220;
    const fraction =
      duration === 0
        ? 1
        : Math.min(1, Math.max(0, (now - this.measuredAt) / duration));
    this.view = fitWorld(
      this.width,
      this.height,
      this.startAngle +
        (this.targetAngle - this.startAngle) * (1 - (1 - fraction) ** 3),
      this.level,
      this.coverage,
    );
    return this.view;
  }
  afterRender(now: number, width: number, height: number) {
    if (!this.active || this.revision === 0) return;
    const valid =
      Number.isFinite(this.view.scale) &&
      this.view.scale > 0 &&
      Math.abs(width - this.width) < 0.5 &&
      Math.abs(height - this.height) < 0.5 &&
      Math.abs(this.view.angle - this.targetAngle) < 0.0001;
    this.stableFrames = valid ? this.stableFrames + 1 : 0;
    if (this.stableFrames >= 2 && now - this.measuredAt >= 100) {
      this.active = false;
      this.ready();
    }
  }
}
