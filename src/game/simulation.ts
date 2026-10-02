import type { MatchConfig, PlayerIdentity } from './config';
import { canOccupy, type Point } from './geometry';
export type InputSnapshot = Readonly<{
  forward: boolean;
  turn: number;
  front: boolean;
  left: boolean;
  right: boolean;
}>;
export const EMPTY_INPUT: InputSnapshot = Object.freeze({
  forward: false,
  turn: 0,
  front: false,
  left: false,
  right: false,
});
export type Ship = Point & {
  id: number;
  heading: number;
  health: number;
  previous: Point;
  previousHeading: number;
};
export type MatchSession = Readonly<{
  id: string;
  player: PlayerIdentity;
  config: MatchConfig;
  seed: number;
}>;
export const STEP = 1 / 60;
export class Simulation {
  readonly player: Ship;
  ticks = 0;
  score = 0;
  endReason: 'time' | 'death' | null = null;
  readonly session: MatchSession;
  constructor(session: MatchSession) {
    this.session = session;
    this.player = {
      id: 0,
      x: 480,
      y: 520,
      heading: 0,
      health: session.config.player.health,
      previous: { x: 480, y: 520 },
      previousHeading: 0,
    };
  }
  get elapsed() {
    return this.ticks * STEP;
  }
  step(input: InputSnapshot) {
    if (this.endReason) return;
    this.ticks++;
    if (this.elapsed >= this.session.config.duration) {
      this.endReason = 'time';
      return;
    }
    this.move(
      this.player,
      input.turn,
      input.forward ? this.session.config.player.speed : 0,
      this.session.config.player.turnSpeed,
    );
  }
  move(ship: Ship, turn: number, speed: number, turnSpeed: number) {
    ship.previous.x = ship.x;
    ship.previous.y = ship.y;
    ship.previousHeading = ship.heading;
    const heading = ship.heading + turn * turnSpeed * STEP;
    if (canOccupy(ship, heading, this.session.config)) ship.heading = heading;
    const x = ship.x + Math.sin(ship.heading) * speed * STEP;
    const y = ship.y - Math.cos(ship.heading) * speed * STEP;
    if (canOccupy({ x, y }, ship.heading, this.session.config)) {
      ship.x = x;
      ship.y = y;
    }
  }
  observe() {
    return {
      matchId: this.session.id,
      elapsed: this.elapsed,
      score: this.score,
      endReason: this.endReason,
      player: {
        x: this.player.x,
        y: this.player.y,
        heading: this.player.heading,
        health: this.player.health,
      },
    };
  }
}
