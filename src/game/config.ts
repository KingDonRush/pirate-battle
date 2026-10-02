export type Settings = Readonly<{
  duration: number;
  spawnInterval: number;
  volume: number;
  effectsVolume: number;
  ambienceVolume: number;
  muted: boolean;
  reducedMotion: boolean;
}>;

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  duration: 120,
  spawnInterval: 3,
  volume: 0.7,
  effectsVolume: 0.8,
  ambienceVolume: 0.35,
  muted: false,
  reducedMotion: false,
});

export const LEVEL = Object.freeze({
  width: 960,
  height: 640,
  version: 'islands-v1',
  islands: Object.freeze(
    [
      { x: 192, y: 128, width: 160, height: 160, radius: 28 },
      { x: 592, y: 352, width: 160, height: 160, radius: 28 },
    ].map((island) => Object.freeze(island)),
  ),
});

export type WeaponConfig = Readonly<{
  damage: number;
  speed: number;
  lifetime: number;
  cooldown: number;
  radius: number;
}>;
export type EnemyConfig = Readonly<{
  health: number;
  speed: number;
  turnSpeed: number;
  range: number;
}>;
export type MatchConfig = Readonly<{
  version: 1;
  level: typeof LEVEL;
  duration: number;
  spawnInterval: number;
  player: Readonly<{ health: number; speed: number; turnSpeed: number }>;
  weapons: Readonly<{
    front: WeaponConfig;
    left: WeaponConfig;
    right: WeaponConfig;
    enemy: WeaponConfig;
  }>;
  enemies: Readonly<{ chaser: EnemyConfig; shooter: EnemyConfig }>;
  spawn: Readonly<{
    minimumDistance: number;
    warningTime: number;
    retryTime: number;
    distribution: readonly ('chaser' | 'shooter')[];
  }>;
  chaserImpact: number;
  hull: Readonly<{
    radius: number;
    halfLength: number;
    boundaryMargin: number;
  }>;
}>;

export function createConfig(settings: Settings): MatchConfig {
  return Object.freeze({
    version: 1,
    level: LEVEL,
    duration: settings.duration,
    spawnInterval: settings.spawnInterval,
    player: Object.freeze({ health: 100, speed: 150, turnSpeed: Math.PI }),
    weapons: Object.freeze({
      front: Object.freeze({
        damage: 20,
        speed: 400,
        lifetime: 1.5,
        cooldown: 0.35,
        radius: 5,
      }),
      left: Object.freeze({
        damage: 20,
        speed: 420,
        lifetime: 1.4,
        cooldown: 1.2,
        radius: 5,
      }),
      right: Object.freeze({
        damage: 20,
        speed: 420,
        lifetime: 1.4,
        cooldown: 1.2,
        radius: 5,
      }),
      enemy: Object.freeze({
        damage: 15,
        speed: 260,
        lifetime: 2.4,
        cooldown: 1.5,
        radius: 5,
      }),
    }),
    enemies: Object.freeze({
      chaser: Object.freeze({
        health: 40,
        speed: 95,
        turnSpeed: (Math.PI * 2) / 3,
        range: 0,
      }),
      shooter: Object.freeze({
        health: 60,
        speed: 75,
        turnSpeed: Math.PI / 2,
        range: 300,
      }),
    }),
    spawn: Object.freeze({
      minimumDistance: 360,
      warningTime: 0.5,
      retryTime: 0.25,
      distribution: Object.freeze(['chaser', 'shooter'] as const),
    }),
    chaserImpact: 25,
    hull: Object.freeze({ radius: 24, halfLength: 28, boundaryMargin: 40 }),
  });
}

export function validateOptions(
  duration: number,
  spawnInterval: number,
): string | null {
  if (!Number.isInteger(duration) || duration < 60 || duration > 180)
    return 'Game session time must be a whole number from 60 to 180 seconds.';
  if (
    !Number.isFinite(spawnInterval) ||
    spawnInterval < 0.75 ||
    spawnInterval > 10 ||
    Math.abs(spawnInterval * 4 - Math.round(spawnInterval * 4)) > 0.0001
  )
    return 'Enemy spawn time must be 0.75–10 seconds, in steps of 0.25.';
  return null;
}

export function readSettings(): Settings {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('pirate-battle:settings:v1') ?? 'null',
    );
    if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
    const v = value as Record<string, unknown>;
    if (
      typeof v.duration !== 'number' ||
      typeof v.spawnInterval !== 'number' ||
      validateOptions(v.duration, v.spawnInterval)
    )
      return DEFAULT_SETTINGS;
    const volume = (key: string, fallback: number) =>
      typeof v[key] === 'number' &&
      Number.isFinite(v[key]) &&
      v[key] >= 0 &&
      v[key] <= 1
        ? v[key]
        : fallback;
    return {
      duration: v.duration,
      spawnInterval: v.spawnInterval,
      volume: volume('volume', 0.7),
      effectsVolume: volume('effectsVolume', 0.8),
      ambienceVolume: volume('ambienceVolume', 0.35),
      muted: v.muted === true,
      reducedMotion: v.reducedMotion === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  const error = validateOptions(settings.duration, settings.spawnInterval);
  if (error) throw new Error(error);
  localStorage.setItem('pirate-battle:settings:v1', JSON.stringify(settings));
}

export type PlayerIdentity = Readonly<{ id: string; name: string }>;
export function validateName(text: string): string | null {
  if (/[\p{Cc}\p{Cf}]/u.test(text))
    return 'Names cannot contain control characters.';
  const name = text.normalize('NFC').trim().replace(/\s+/gu, ' ');
  const length = [
    ...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(name),
  ].length;
  if (
    length < 2 ||
    length > 24 ||
    !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} '-]*$/u.test(name)
  )
    return 'Use 2–24 characters: letters, numbers, spaces, apostrophes or hyphens.';
  return null;
}
export function readPlayer(): PlayerIdentity | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('pirate-battle:player:v1') ?? 'null',
    );
    if (
      typeof value !== 'object' ||
      value === null ||
      !('id' in value) ||
      !('name' in value) ||
      typeof value.id !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(value.id) ||
      typeof value.name !== 'string' ||
      validateName(value.name)
    )
      return null;
    return { id: value.id, name: value.name };
  } catch {
    return null;
  }
}
export function choosePlayer(text: string, guest = false): PlayerIdentity {
  if (!guest && text.trim()) {
    const error = validateName(text);
    if (error) throw new Error(error);
  }
  let name = text.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (guest || !name) {
    const adjectives = [
      'Coral',
      'Amber',
      'Silver',
      'Azure',
      'Quiet',
      'Brave',
      'Sunny',
      'Swift',
    ];
    const birds = [
      'Gull',
      'Tern',
      'Heron',
      'Otter',
      'Puffin',
      'Pelican',
      'Seal',
      'Finch',
    ];
    const random = crypto.getRandomValues(new Uint32Array(3));
    name =
      (adjectives[(random[0] ?? 0) % adjectives.length] ?? 'Coral') +
      ' ' +
      (birds[(random[1] ?? 0) % birds.length] ?? 'Gull') +
      ' ' +
      (((random[2] ?? 0) % 90) + 10);
  }
  const error = validateName(name);
  if (error) throw new Error(error);
  const player = { id: readPlayer()?.id ?? crypto.randomUUID(), name };
  localStorage.setItem('pirate-battle:player:v1', JSON.stringify(player));
  return Object.freeze(player);
}
