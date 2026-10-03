import { test, expect } from '@playwright/test';
import { Simulation, EMPTY_INPUT, STEP } from '../../src/game/simulation';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { castIsland, distance, canOccupy } from '../../src/game/geometry';
import { findPath, directPath } from '../../src/game/navigation';
import { pilotInput } from '../support/pilot';
import { KeyboardPilot } from '../support/browser-pilot';
test('G05 real enemy routes clear obstructing shores while respecting hull geometry', () => {
  const config = createConfig(DEFAULT_SETTINGS);
  let blockedTotal = 0,
    clearedTotal = 0;
  for (const seed of [42, 1, 2, 3]) {
    const game = new Simulation({
      id: 'route-' + seed,
      player: { id: 'route-player', name: 'Route Captain' },
      config,
      seed,
    });
    for (const [ms, forward, turn] of [
      [1000, true, 0],
      [500, false, 1],
      [1067, true, 0],
      [500, false, -1],
      [750, true, 0],
    ] as const) {
      for (let n = 0; n < Math.round(ms / 1000 / STEP); n++)
        game.step({ ...EMPTY_INPUT, forward, turn });
    }
    const blocked = new Map<number, number>();
    let cleared = false;
    for (let n = 0; n < 1800 && !game.endReason; n++) {
      game.step(pilotInput(game.observe(), config));
      for (const enemy of game.enemies.values()) {
        expect(canOccupy(enemy, enemy.heading, config)).toBe(true);
        const obstruction = config.level.islands.some(
          (island) => castIsland(enemy, game.player, island, 5) !== null,
        );
        if (obstruction && !blocked.has(enemy.id))
          blocked.set(enemy.id, distance(enemy, game.player));
        if (
          !obstruction &&
          blocked.has(enemy.id) &&
          distance(enemy, game.player) < (blocked.get(enemy.id) ?? 0) - 100
        )
          cleared = true;
      }
    }
    blockedTotal += blocked.size;
    clearedTotal += Number(cleared);
  }
  expect(blockedTotal).toBeGreaterThan(0);
  expect(clearedTotal).toBeGreaterThan(0);
});

test('G05 real keyboard navigation and defence makes enemies bypass an island', async ({
  page,
}, info) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  const config = createConfig(DEFAULT_SETTINGS);
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  for (const [key, ms] of [
    ['w', 1000],
    ['d', 500],
    ['w', 1067],
    ['a', 500],
    ['w', 750],
  ] as const) {
    await page.keyboard.down(key);
    await page.evaluate((value) => window.pirateBattle?.advance(value), ms);
    await page.keyboard.up(key);
  }
  const blocked = new Map<number, number>();
  const pilot = new KeyboardPilot(page);
  let cleared = false;
  for (let tick = 0; tick < 300 && !cleared; tick++) {
    const state = await page.evaluate(() => window.pirateBattle?.observe());
    if (!state) break;
    for (const enemy of state.enemies) {
      expect(canOccupy(enemy, enemy.heading, config)).toBe(true);
      const obstruction = config.level.islands.some(
        (island) => castIsland(enemy, state.player, island, 5) !== null,
      );
      if (obstruction && !blocked.has(enemy.id))
        blocked.set(enemy.id, distance(enemy, state.player));
      if (
        !obstruction &&
        blocked.has(enemy.id) &&
        distance(enemy, state.player) < (blocked.get(enemy.id) ?? 0) - 100
      )
        cleared = true;
    }
    if (!cleared) {
      await pilot.apply(pilotInput(state, config));
      await page.evaluate(() => window.pirateBattle?.advance(100));
    }
  }
  await pilot.release();
  expect(blocked.size).toBeGreaterThan(0);
  expect(cleared).toBe(true);
  await page.screenshot({ path: info.outputPath('route-cleared.png') });
});

test('G05 all four coastal passages have continuous hull-clear navigation and shooting segments', () => {
  const config = createConfig(DEFAULT_SETTINGS);
  for (const [start, goal] of [
    [
      { x: 100, y: 395 },
      { x: 465, y: 100 },
    ],
    [
      { x: 790, y: 110 },
      { x: 1020, y: 295 },
    ],
    [
      { x: 90, y: 530 },
      { x: 420, y: 530 },
    ],
    [
      { x: 730, y: 525 },
      { x: 1020, y: 335 },
    ],
  ]) {
    const route = findPath(start!, goal!, config);
    expect(route.length).toBeGreaterThan(2);
    for (let i = 0; i < route.length; i++) {
      const current = route[i]!;
      expect(canOccupy(current, 0, config)).toBe(true);
      expect(canOccupy(current, Math.PI / 2, config)).toBe(true);
      if (i > 0) {
        expect(directPath(route[i - 1]!, current, config)).toBe(true);
        for (const island of config.level.islands)
          expect(
            castIsland(
              route[i - 1]!,
              current,
              island,
              config.weapons.front.radius,
            ),
          ).toBeNull();
      }
    }
  }
});
