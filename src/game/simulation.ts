import type { MatchConfig, PlayerIdentity, WeaponConfig } from './config';
import {
  angleDifference,
  canOccupy,
  castHull,
  castIsland,
  distance,
  hullsTouch,
  segmentRect,
  type Point,
} from './geometry';
import { directPath, findPath } from './navigation';
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
  maxHealth: number;
  previous: Point;
  previousHeading: number;
  kind: 'player' | 'chaser' | 'shooter';
  readyAt: number;
  activeAt: number;
  path: Point[];
  navigateAt: number;
};
export type Projectile = Point & {
  id: number;
  previous: Point;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy';
  damage: number;
  radius: number;
  expiresAt: number;
};
export type CombatEvent = Point & {
  kind:
    | 'front'
    | 'broadside'
    | 'enemy-fire'
    | 'hit'
    | 'damage'
    | 'explosion'
    | 'water'
    | 'score'
    | 'low-health'
    | 'time-warning';
  heading?: number;
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
  readonly session: MatchSession;
  readonly enemies = new Map<number, Ship>();
  readonly projectiles = new Map<number, Projectile>();
  readonly events: CombatEvent[] = [];
  readonly shots = { front: 0, left: 0, right: 0, enemy: 0 };
  ticks = 0;
  score = 0;
  endReason: 'time' | 'death' | null = null;
  readonly cooldowns = { front: 0, left: 0, right: 0 };
  nextSpawn = 0;
  spawnIndex = 0;
  private nextId = 1;
  private rng: number;
  constructor(session: MatchSession) {
    this.session = session;
    this.rng = session.seed >>> 0;
    this.nextSpawn = session.config.spawnInterval;
    this.player = this.createShip(
      0,
      'player',
      480,
      520,
      0,
      session.config.player.health,
      0,
    );
  }
  get elapsed() {
    return this.ticks * STEP;
  }
  private random() {
    this.rng = (this.rng + 0x6d2b79f5) >>> 0;
    let value = this.rng;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  private createShip(
    id: number,
    kind: Ship['kind'],
    x: number,
    y: number,
    heading: number,
    health: number,
    activeAt: number,
  ): Ship {
    return {
      id,
      kind,
      x,
      y,
      heading,
      health,
      maxHealth: health,
      previous: { x, y },
      previousHeading: heading,
      readyAt: activeAt,
      activeAt,
      path: [],
      navigateAt: 0,
    };
  }
  step(input: InputSnapshot) {
    if (this.endReason) return;
    this.ticks++;
    if (this.elapsed >= this.session.config.duration) {
      this.endReason = 'time';
      return;
    }
    const config = this.session.config;
    this.move(
      this.player,
      input.turn,
      input.forward ? config.player.speed : 0,
      config.player.turnSpeed,
    );
    for (const weapon of ['front', 'left', 'right'] as const)
      if (input[weapon] && this.elapsed >= this.cooldowns[weapon]) {
        this.fire(this.player, weapon, config.weapons[weapon]);
        this.cooldowns[weapon] = this.elapsed + config.weapons[weapon].cooldown;
      }
    if (this.elapsed >= this.nextSpawn) this.spawn();
    for (const enemy of this.enemies.values()) {
      if (enemy.activeAt > this.elapsed || enemy.health <= 0) continue;
      const balance =
        config.enemies[enemy.kind === 'chaser' ? 'chaser' : 'shooter'];
      let target: Point = this.player;
      if (!directPath(enemy, this.player, config)) {
        if (this.elapsed >= enemy.navigateAt) {
          enemy.path = findPath(enemy, this.player, config);
          enemy.navigateAt = this.elapsed + 0.5 + (enemy.id % 5) * 0.05;
        }
        while (
          enemy.path.length > 0 &&
          enemy.path[0] &&
          distance(enemy, enemy.path[0]) < 28
        )
          enemy.path.shift();
        target = enemy.path[0] ?? enemy;
      } else enemy.path.length = 0;
      const desired = Math.atan2(target.x - enemy.x, -(target.y - enemy.y));
      const turn = Math.max(
        -1,
        Math.min(
          1,
          angleDifference(desired, enemy.heading) / (balance.turnSpeed * STEP),
        ),
      );
      const range = distance(enemy, this.player);
      this.move(
        enemy,
        turn,
        enemy.kind === 'shooter' &&
          range < balance.range * 0.72 &&
          directPath(enemy, this.player, config)
          ? 0
          : balance.speed,
        balance.turnSpeed,
      );
      if (
        enemy.kind === 'chaser' &&
        hullsTouch(
          enemy,
          this.player,
          config.hull.radius,
          config.hull.halfLength,
        )
      ) {
        this.damagePlayer(config.chaserImpact);
        this.destroy(enemy, false);
        if (this.endReason) return;
      } else if (
        enemy.kind === 'shooter' &&
        range <= balance.range &&
        this.elapsed >= enemy.readyAt &&
        Math.abs(
          angleDifference(
            Math.atan2(this.player.x - enemy.x, -(this.player.y - enemy.y)),
            enemy.heading,
          ),
        ) < 0.15 &&
        config.level.islands.every(
          (island) =>
            castIsland(
              enemy,
              this.player,
              island,
              config.weapons.enemy.radius,
            ) === null,
        )
      ) {
        this.fire(enemy, 'front', config.weapons.enemy);
        enemy.readyAt = this.elapsed + config.weapons.enemy.cooldown;
      }
    }
    this.advanceProjectiles();
    if (
      !this.endReason &&
      this.session.config.duration - this.elapsed <= 10 &&
      this.session.config.duration - this.elapsed + STEP > 10
    )
      this.events.push({ ...this.player, kind: 'time-warning' });
  }
  move(ship: Ship, turn: number, speed: number, turnSpeed: number) {
    ship.previous.x = ship.x;
    ship.previous.y = ship.y;
    ship.previousHeading = ship.heading;
    const heading = ship.heading + turn * turnSpeed * STEP;
    if (canOccupy(ship, heading, this.session.config)) ship.heading = heading;
    const x = ship.x + Math.sin(ship.heading) * speed * STEP,
      y = ship.y - Math.cos(ship.heading) * speed * STEP;
    if (canOccupy({ x, y }, ship.heading, this.session.config)) {
      ship.x = x;
      ship.y = y;
    }
  }
  private spawn() {
    const config = this.session.config,
      kind =
        config.spawn.distribution[
          this.spawnIndex % config.spawn.distribution.length
        ] ?? 'chaser';
    for (let attempt = 0; attempt < 32; attempt++) {
      const x = 100 + this.random() * (config.level.width - 200),
        y = 100 + this.random() * (config.level.height - 200);
      const heading = Math.atan2(this.player.x - x, -(this.player.y - y));
      if (
        distance({ x, y }, this.player) < config.spawn.minimumDistance ||
        !canOccupy({ x, y }, heading, config) ||
        [...this.enemies.values()].some(
          (enemy) => distance({ x, y }, enemy) < 110,
        )
      )
        continue;
      const enemy = this.createShip(
        this.nextId++,
        kind,
        x,
        y,
        heading,
        config.enemies[kind].health,
        this.elapsed + config.spawn.warningTime,
      );
      this.enemies.set(enemy.id, enemy);
      this.spawnIndex++;
      this.nextSpawn = this.elapsed + config.spawnInterval;
      return;
    }
    this.nextSpawn = this.elapsed + config.spawn.retryTime;
  }
  private fire(
    ship: Ship,
    side: 'front' | 'left' | 'right',
    weapon: WeaponConfig,
  ) {
    this.shots[ship.kind === 'player' ? side : 'enemy']++;
    const lateral = side !== 'front',
      angle =
        ship.heading +
        (side === 'left' ? -Math.PI / 2 : side === 'right' ? Math.PI / 2 : 0);
    const dx = Math.sin(angle),
      dy = -Math.cos(angle),
      fx = Math.sin(ship.heading),
      fy = -Math.cos(ship.heading);
    for (const offset of lateral ? [-24, 0, 24] : [0]) {
      const x = ship.x + dx * (lateral ? 36 : 60) + fx * offset,
        y = ship.y + dy * (lateral ? 36 : 60) + fy * offset;
      const projectile: Projectile = {
        id: this.nextId++,
        x,
        y,
        previous: { x, y },
        vx: dx * weapon.speed,
        vy: dy * weapon.speed,
        owner: ship.kind === 'player' ? 'player' : 'enemy',
        damage: weapon.damage,
        radius: weapon.radius,
        expiresAt: this.elapsed + weapon.lifetime,
      };
      // A muzzle crossing a coast cannot fire through the obstacle.
      if (
        this.session.config.level.islands.some(
          (island) =>
            castIsland(ship, { x, y }, island, weapon.radius) !== null,
        )
      ) {
        this.events.push({ kind: 'water', x, y });
        continue;
      }
      this.projectiles.set(projectile.id, projectile);
    }
    this.events.push({
      kind:
        ship.kind !== 'player' ? 'enemy-fire' : lateral ? 'broadside' : 'front',
      x: ship.x + dx * 55,
      y: ship.y + dy * 55,
      heading: angle,
    });
  }
  private advanceProjectiles() {
    const config = this.session.config;
    for (const projectile of this.projectiles.values()) {
      if (this.endReason) return;
      const end = {
        x: projectile.x + projectile.vx * STEP,
        y: projectile.y + projectile.vy * STEP,
      };
      let first: number | null = null,
        target: Ship | null = null;
      for (const island of config.level.islands) {
        const hit = castIsland(projectile, end, island, projectile.radius);
        if (hit !== null && (first === null || hit < first)) {
          first = hit;
          target = null;
        }
      }
      const targets =
        projectile.owner === 'player' ? this.enemies.values() : [this.player];
      for (const ship of targets) {
        if (ship.health <= 0 || ship.activeAt > this.elapsed) continue;
        const hit = castHull(
          projectile,
          end,
          ship,
          config.hull.radius + projectile.radius,
          config.hull.halfLength,
        );
        if (hit !== null && (first === null || hit < first)) {
          first = hit;
          target = ship;
        }
      }
      if (first !== null) {
        const point = {
          x: projectile.x + (end.x - projectile.x) * first,
          y: projectile.y + (end.y - projectile.y) * first,
        };
        this.projectiles.delete(projectile.id);
        if (target) {
          this.events.push({ ...point, kind: 'hit' });
          if (target === this.player) this.damagePlayer(projectile.damage);
          else {
            target.health = Math.max(0, target.health - projectile.damage);
            if (target.health === 0) this.destroy(target, true);
          }
        } else this.events.push({ ...point, kind: 'water' });
        continue;
      }
      projectile.previous.x = projectile.x;
      projectile.previous.y = projectile.y;
      projectile.x = end.x;
      projectile.y = end.y;
      if (
        this.elapsed >= projectile.expiresAt ||
        segmentRect(end, end, {
          x: 0,
          y: 0,
          width: config.level.width,
          height: config.level.height,
        }) === null
      )
        this.projectiles.delete(projectile.id);
    }
  }
  private damagePlayer(damage: number) {
    if (this.endReason) return;
    const previous = this.player.health;
    this.player.health = Math.max(0, previous - damage);
    this.events.push({ ...this.player, kind: 'damage' });
    if (previous > 25 && this.player.health <= 25)
      this.events.push({ ...this.player, kind: 'low-health' });
    if (this.player.health === 0) {
      this.events.push({ ...this.player, kind: 'explosion' });
      this.endReason = 'death';
    }
  }
  private destroy(enemy: Ship, playerKill: boolean) {
    if (!this.enemies.has(enemy.id)) return;
    enemy.health = 0;
    this.enemies.delete(enemy.id);
    this.events.push({ kind: 'explosion', x: enemy.x, y: enemy.y });
    if (playerKill) {
      this.score++;
      this.events.push({ kind: 'score', x: enemy.x, y: enemy.y });
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
      enemies: [...this.enemies.values()].map((e) => ({
        id: e.id,
        kind: e.kind,
        x: e.x,
        y: e.y,
        heading: e.heading,
        health: e.health,
        activeAt: e.activeAt,
      })),
      projectiles: [...this.projectiles.values()].map((p) => ({
        ...p,
        previous: { ...p.previous },
      })),
      cooldowns: { ...this.cooldowns },
      shots: { ...this.shots },
      nextSpawn: this.nextSpawn,
      spawnIndex: this.spawnIndex,
    };
  }
}
