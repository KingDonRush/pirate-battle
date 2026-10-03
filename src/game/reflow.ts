import { LEVEL } from './config';
export type ViewTransform = Readonly<{
  x: number;
  y: number;
  scale: number;
  angle: number;
  width: number;
  height: number;
}>;
export function fitWorld(
  width: number,
  height: number,
  angle: number,
): ViewTransform {
  const c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  const worldWidth = c * LEVEL.width + s * LEVEL.height,
    worldHeight = s * LEVEL.width + c * LEVEL.height;
  return Object.freeze({
    x: width / 2,
    y: height / 2,
    scale: Math.min(width / worldWidth, height / worldHeight),
    angle,
    width,
    height,
  });
}
export function worldToView(x: number, y: number, view: ViewTransform) {
  const dx = x - LEVEL.width / 2,
    dy = y - LEVEL.height / 2,
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
    x: LEVEL.width / 2 + dx * c + dy * s,
    y: LEVEL.height / 2 - dx * s + dy * c,
  };
}
export class ReflowCoordinator {
  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
  }
  revision = 0;
  active = true;
  private measuredAt = 0;
  private stableFrames = 0;
  private startAngle = 0;
  private targetAngle = 0;
  private width = 1;
  private height = 1;
  private view: ViewTransform = fitWorld(1, 1, 0);
  private reducedMotion: boolean;
  private freeze: () => void;
  private ready: () => void;
  constructor(reducedMotion: boolean, freeze: () => void, ready: () => void) {
    this.reducedMotion = reducedMotion;
    this.freeze = freeze;
    this.ready = ready;
  }
  request(width: number, height: number, portrait: boolean, now: number) {
    if (width <= 0 || height <= 0) {
      this.active = true;
      this.freeze();
      return;
    }
    const angle = portrait ? Math.PI / 2 : 0;
    if (
      Math.abs(width - this.width) < 0.5 &&
      Math.abs(height - this.height) < 0.5 &&
      angle === this.targetAngle &&
      this.revision > 0
    )
      return;
    this.revision++;
    this.width = width;
    this.height = height;
    this.startAngle = this.view.angle;
    this.targetAngle = angle;
    this.measuredAt = now;
    this.stableFrames = 0;
    this.active = true;
    this.freeze();
  }
  update(now: number): ViewTransform {
    const duration = this.reducedMotion ? 0 : 220;
    const fraction =
      duration === 0
        ? 1
        : Math.min(1, Math.max(0, (now - this.measuredAt) / duration));
    const eased = 1 - Math.pow(1 - fraction, 3);
    this.view = fitWorld(
      this.width,
      this.height,
      this.startAngle + (this.targetAngle - this.startAngle) * eased,
    );
    return this.view;
  }
  afterRender(now: number, latestWidth: number, latestHeight: number) {
    if (!this.active || this.revision === 0) return;
    const valid =
      Number.isFinite(this.view.scale) &&
      this.view.scale > 0 &&
      Math.abs(latestWidth - this.width) < 0.5 &&
      Math.abs(latestHeight - this.height) < 0.5 &&
      Math.abs(this.view.angle - this.targetAngle) < 0.0001;
    this.stableFrames = valid ? this.stableFrames + 1 : 0;
    if (this.stableFrames >= 2 && now - this.measuredAt >= 100) {
      this.active = false;
      this.ready();
    }
  }
}
