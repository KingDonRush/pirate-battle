import { test, expect } from '@playwright/test';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { canOccupy } from '../../src/game/geometry';
import { fitWorld } from '../../src/game/reflow';
import { directPath, findPath } from '../../src/game/navigation';
import { Simulation, EMPTY_INPUT } from '../../src/game/simulation';
import { angleDifference } from '../../src/game/geometry';

test('G05 an unreachable route retries while aiming at the player instead of inventing a southward target', () => {
  const normal = createConfig(DEFAULT_SETTINGS);
  const config = {
    ...normal,
    level: {
      ...normal.level,
      navigationPadding: 0,
      islands: [{ x: 500, y: 0, width: 150, height: 640, radius: 0 }],
    },
    player: { ...normal.player, start: { x: 200, y: 320, heading: 0 } },
  };
  const game = new Simulation({
    id: 'unreachable-route',
    player: { id: 'route-player', name: 'Route Captain' },
    config,
    seed: 42,
  });
  const isolated = new Map<number, { x: number; y: number; heading: number }>();
  for (let step = 0; step < 1200 && !game.endReason; step++) {
    for (const enemy of game.enemies.values()) {
      if (enemy.x <= 650 || enemy.activeAt > game.elapsed) continue;
      if (!isolated.has(enemy.id))
        isolated.set(enemy.id, {
          x: enemy.x,
          y: enemy.y,
          heading: enemy.heading,
        });
      if (game.elapsed - enemy.activeAt > 2) {
        const first = isolated.get(enemy.id)!;
        expect(Math.hypot(enemy.x - first.x, enemy.y - first.y)).toBeLessThan(
          3,
        );
        const desired = Math.atan2(
          game.player.x - enemy.x,
          -(game.player.y - enemy.y),
        );
        expect(Math.abs(angleDifference(desired, enemy.heading))).toBeLessThan(
          0.1,
        );
      }
    }
    game.step(EMPTY_INPUT);
  }
  expect(isolated.size).toBeGreaterThan(0);
});

test('G03 every coast has a fixed outer water corridor with full capsule turning clearance', () => {
  const config = createConfig(DEFAULT_SETTINGS);
  for (const [width, height, angle] of [
    [1440, 900, 0],
    [320, 568, Math.PI / 2],
    [844, 390, 0],
    [768, 1024, -Math.PI / 2],
  ] as const) {
    const view = fitWorld(width, height, angle);
    for (const island of config.level.islands) {
      expect(island.x - view.bounds.x).toBeGreaterThanOrEqual(160);
      expect(island.y - view.bounds.y).toBeGreaterThanOrEqual(160);
      expect(
        view.bounds.x + view.bounds.width - island.x - island.width,
      ).toBeGreaterThanOrEqual(160);
      expect(
        view.bounds.y + view.bounds.height - island.y - island.height,
      ).toBeGreaterThanOrEqual(160);
      const offset = 100;
      for (const point of [
        { x: island.x - offset, y: island.y + island.height / 2 },
        {
          x: island.x + island.width + offset,
          y: island.y + island.height / 2,
        },
        { x: island.x + island.width / 2, y: island.y - offset },
        {
          x: island.x + island.width / 2,
          y: island.y + island.height + offset,
        },
      ]) {
        for (let turn = 0; turn < 24; turn++)
          expect(
            canOccupy(point, (turn * Math.PI) / 12, config, view.bounds),
          ).toBe(true);
      }
    }
  }
});

test('G05 navigation reaches the reported east coast through either end of the island', () => {
  const config = createConfig(DEFAULT_SETTINGS);
  const bounds = fitWorld(1440, 900, 0).bounds;
  const goal = { x: 1200, y: 132 };
  for (const start of [
    { x: 790, y: 132 },
    { x: 968, y: 340 },
    { x: 650, y: -50 },
  ]) {
    const path = findPath(start, goal, config, bounds);
    expect(path.length).toBeGreaterThan(0);
    for (let index = 1; index < path.length; index++)
      expect(directPath(path[index - 1]!, path[index]!, config)).toBe(true);
    expect(
      Math.hypot(path.at(-1)!.x - goal.x, path.at(-1)!.y - goal.y),
    ).toBeLessThan(50);
  }
});

test('G03 real keys can turn out of the reported northeast coast and circle the island', async ({
  page,
}, info) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await page.setViewportSize(
    info.project.name === 'chromium-mobile'
      ? { width: 844, height: 390 }
      : { width: 1440, height: 900 },
  );
  await page.goto('/?seed=42&clock=manual');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Enemy spawn time', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const initial = await page.evaluate(() => window.pirateBattle!.observe());
  const hold = async (key: string, ms: number) => {
    await page.keyboard.down(key);
    await page.evaluate(
      (duration) => window.pirateBattle!.advance(duration),
      ms,
    );
    await page.keyboard.up(key);
  };
  for (const [key, ms] of [
    ['w', 200],
    ['d', 500],
    ['w', 3974],
    ['a', 500],
    ['w', 1387],
  ] as const)
    await hold(key, ms);
  const beside = await page.evaluate(() => window.pirateBattle!.observe());
  expect(beside.player.x).toBeGreaterThan(1130);
  expect(beside.player.x).toBeLessThan(1150);
  expect(beside.player.y).toBeCloseTo(132, -1);
  // Turn toward open water on both sides from the exact coast shown in the report.
  await hold('d', 500);
  const right = await page.evaluate(() => window.pirateBattle!.observe());
  expect(right.player.heading).toBeCloseTo(Math.PI / 2, 1);
  await hold('a', 1000);
  const left = await page.evaluate(() => window.pirateBattle!.observe());
  expect(left.player.heading).toBeCloseTo(-Math.PI / 2, 1);
  await hold('d', 500);
  await hold('d', 500);
  await hold('w', 500);
  await hold('a', 500);
  const cleared = await page.evaluate(() => window.pirateBattle!.observe());
  const coastX = cleared.player.x;
  for (const [key, ms] of [
    ['w', 1520],
    ['a', 500],
    ['w', Math.round(((coastX - 790) / 150) * 1000)],
    ['a', 500],
    ['w', 2907],
    ['a', 500],
    ['w', Math.round(((coastX - 790) / 150) * 1000)],
  ] as const)
    await hold(key, ms);
  const circled = await page.evaluate(() => window.pirateBattle!.observe());
  expect(circled.endReason).toBeNull();
  expect(
    Math.hypot(circled.player.x - coastX, circled.player.y - 340),
  ).toBeLessThan(15);
  expect(circled.view).toEqual(initial.view);
  expect(circled.arenaBounds).toEqual(initial.arenaBounds);
  await info.attach('real-coast-circumnavigation', {
    body: JSON.stringify({ initial, beside, right, left, circled }),
    contentType: 'application/json',
  });
  await page.screenshot({ path: info.outputPath('coast-passage.png') });
});
