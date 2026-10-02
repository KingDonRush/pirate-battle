import { test, expect } from '@playwright/test';
import { Simulation, EMPTY_INPUT, STEP } from '../../src/game/simulation';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { castIsland, distance, canOccupy } from '../../src/game/geometry';
test('G05 real enemy routes clear obstructing shores while respecting hull geometry', () => {
  const config = createConfig(DEFAULT_SETTINGS);
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
    for (let n = 0; n < 1200 && !game.endReason; n++) {
      game.step(EMPTY_INPUT);
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
    expect(blocked.size).toBeGreaterThan(0);
    expect(cleared).toBe(true);
  }
});

test('G05 real keyboard positioning makes enemies bypass the peninsula', async ({
  page,
}, info) => {
  test.setTimeout(60000);
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
  let cleared = false;
  for (let tick = 0; tick < 100 && !cleared; tick++) {
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
    if (!cleared) await page.evaluate(() => window.pirateBattle?.advance(200));
  }
  expect(blocked.size).toBeGreaterThan(0);
  expect(cleared).toBe(true);
  await page.screenshot({ path: info.outputPath('route-cleared.png') });
});
