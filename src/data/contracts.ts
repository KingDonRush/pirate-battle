import {
  validateName,
  validateOptions,
  type EnemyConfig,
  type MatchConfig,
  type WeaponConfig,
} from '../game/config';
import type { CompletedLocalMatch } from '../game/runtime';
export type CompletedRecord = Readonly<{
  schemaVersion: 1;
  matchId: string;
  playerId: string;
  displayName: string;
  completedAt: string;
  score: number;
  duration: number;
  endReason: 'time' | 'death';
  seed: number;
  config: MatchConfig;
  rulesetId: string;
}>;
export type PageResult = Readonly<{
  items: readonly CompletedRecord[];
  page: number;
  pageSize: number;
  total: number;
  revision: number;
}>;
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Expected a record.');
  return value as Record<string, unknown>;
}
function number(value: unknown, min = 0, max = 100000): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error('Invalid numeric field.');
  return value;
}
function text(value: unknown, max = 128): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max)
    throw new Error('Invalid text field.');
  return value;
}
function integer(value: unknown, min = 0, max = 100000) {
  const result = number(value, min, max);
  if (!Number.isInteger(result)) throw new Error('Expected an integer.');
  return result;
}
function weapon(value: unknown): WeaponConfig {
  const v = object(value);
  return Object.freeze({
    damage: number(v.damage, 1),
    speed: number(v.speed, 1),
    lifetime: number(v.lifetime, 0.01, 30),
    cooldown: number(v.cooldown, 0.01, 30),
    radius: number(v.radius, 0.1, 100),
  });
}
function enemy(value: unknown): EnemyConfig {
  const v = object(value);
  return Object.freeze({
    health: number(v.health, 1),
    speed: number(v.speed, 1),
    turnSpeed: number(v.turnSpeed, 0.01, 100),
    range: number(v.range),
  });
}
export function decodeConfig(value: unknown): MatchConfig {
  const v = object(value),
    player = object(v.player),
    hull = object(v.hull),
    weapons = object(v.weapons),
    enemies = object(v.enemies),
    spawn = object(v.spawn),
    level = object(v.level);
  if (
    (v.version !== 1 && v.version !== 2) ||
    !Array.isArray(level.islands) ||
    level.islands.length < 1 ||
    level.islands.length > 32
  )
    throw new Error('Unsupported match configuration.');
  const duration = integer(v.duration, 60, 180),
    spawnInterval = number(v.spawnInterval, 0.75, 10);
  if (validateOptions(duration, spawnInterval))
    throw new Error('Invalid match timing.');
  if (
    !Array.isArray(spawn.distribution) ||
    spawn.distribution.length > 16 ||
    !spawn.distribution.includes('chaser') ||
    !spawn.distribution.includes('shooter')
  )
    throw new Error('Both enemy types are required.');
  const distribution = spawn.distribution.map((kind: unknown) => {
    if (kind !== 'chaser' && kind !== 'shooter')
      throw new Error('Unknown enemy type.');
    return kind;
  });
  const width = number(level.width, 100),
    height = number(level.height, 100);
  const islands = level.islands.map((raw: unknown) => {
    const i = object(raw);
    return Object.freeze({
      x: number(i.x, -width, width),
      y: number(i.y, -height, height),
      width: number(i.width, 1),
      height: number(i.height, 1),
      radius: number(i.radius),
    });
  });
  if (
    islands.some(
      (i) =>
        i.x >= width ||
        i.y >= height ||
        i.x + i.width <= 0 ||
        i.y + i.height <= 0 ||
        i.x + i.width > 2 * width ||
        i.y + i.height > 2 * height ||
        i.radius > Math.min(i.width, i.height) / 2,
    )
  )
    throw new Error('Invalid island geometry.');
  const version = text(level.version);
  return Object.freeze({
    version: v.version,
    duration,
    spawnInterval,
    level: Object.freeze({
      version,
      width,
      height,
      islands: Object.freeze(islands),
    }),
    player: Object.freeze({
      health: number(player.health, 1),
      speed: number(player.speed, 1),
      turnSpeed: number(player.turnSpeed, 0.01, 100),
      ...(player.start !== undefined
        ? {
            start: (() => {
              const start = object(player.start);
              return Object.freeze({
                x: number(start.x, 0, width),
                y: number(start.y, 0, height),
                heading: number(start.heading, -100, 100),
              });
            })(),
          }
        : {}),
    }),
    hull: Object.freeze({
      radius: number(hull.radius, 1),
      halfLength: number(hull.halfLength),
      boundaryMargin: number(hull.boundaryMargin),
    }),
    weapons: Object.freeze({
      front: weapon(weapons.front),
      left: weapon(weapons.left),
      right: weapon(weapons.right),
      enemy: weapon(weapons.enemy),
    }),
    enemies: Object.freeze({
      chaser: enemy(enemies.chaser),
      shooter: enemy(enemies.shooter),
    }),
    spawn: Object.freeze({
      minimumDistance: number(spawn.minimumDistance),
      warningTime: number(spawn.warningTime),
      retryTime: number(spawn.retryTime, 0.01),
      distribution: Object.freeze(distribution),
    }),
    chaserImpact: number(v.chaserImpact, 1),
  });
}
export function decodeRecord(value: unknown): CompletedRecord {
  const v = object(value);
  if (
    v.schemaVersion !== 1 ||
    (v.endReason !== 'time' && v.endReason !== 'death')
  )
    throw new Error('Unsupported completed match.');
  const displayName = text(v.displayName, 96);
  if (validateName(displayName)) throw new Error('Invalid player name.');
  const completedAt = text(v.completedAt);
  if (!Number.isFinite(Date.parse(completedAt)))
    throw new Error('Invalid completion date.');
  const config = decodeConfig(v.config),
    duration = number(v.duration, 0, 180);
  if (
    duration > config.duration + 1 / 60 ||
    (v.endReason === 'time' && Math.abs(duration - config.duration) > 1 / 60)
  )
    throw new Error('Invalid active duration.');
  const rulesetId = text(v.rulesetId, 80);
  if (!/^v1:[0-9a-f]{64}$/.test(rulesetId))
    throw new Error('Invalid ruleset identity.');
  return Object.freeze({
    schemaVersion: 1,
    matchId: text(v.matchId),
    playerId: text(v.playerId),
    displayName,
    completedAt,
    score: integer(v.score),
    duration,
    endReason: v.endReason,
    seed: integer(v.seed, 0, 4294967295),
    config,
    rulesetId,
  });
}
export function decodePage(value: unknown): PageResult {
  const v = object(value);
  if (!Array.isArray(v.items) || v.items.length > 100)
    throw new Error('Invalid page items.');
  const result = {
    items: v.items.map((item: unknown) => decodeRecord(item)),
    page: integer(v.page, 1),
    pageSize: integer(v.pageSize, 1, 100),
    total: integer(v.total),
    revision: integer(v.revision),
  };
  if (
    result.items.length > result.pageSize ||
    result.total < result.items.length
  )
    throw new Error('Inconsistent pagination.');
  return result;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value))
    return '[' + value.map((item: unknown) => canonical(item)).join(',') + ']';
  if (typeof value === 'object' && value !== null) {
    const v = object(value);
    return (
      '{' +
      Object.keys(v)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(v[key]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value) ?? 'null';
}
export async function rulesetId(config: MatchConfig): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical(config)),
  );
  return (
    'v1:' +
    Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
  );
}
export async function completedRecord(
  result: CompletedLocalMatch,
): Promise<CompletedRecord> {
  return decodeRecord({
    schemaVersion: 1,
    matchId: result.session.id,
    playerId: result.session.player.id,
    displayName: result.session.player.name,
    completedAt: result.date,
    score: result.score,
    duration: result.duration,
    endReason: result.reason,
    seed: result.session.seed,
    config: result.session.config,
    rulesetId: await rulesetId(result.session.config),
  });
}
export function localResult(record: CompletedRecord): CompletedLocalMatch {
  return Object.freeze({
    session: Object.freeze({
      id: record.matchId,
      player: Object.freeze({ id: record.playerId, name: record.displayName }),
      config: record.config,
      seed: record.seed,
    }),
    score: record.score,
    duration: record.duration,
    reason: record.endReason,
    date: record.completedAt,
  });
}
