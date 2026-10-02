import { expect, test, type Page } from '@playwright/test';
import { castHull, castIsland, angleDifference } from '../../src/game/geometry';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { Simulation, EMPTY_INPUT, STEP } from '../../src/game/simulation';
async function world(page: Page) {
  return page.evaluate(() => {
    const observed = window.pirateBattle?.observe();
    if (!observed) throw new Error('No active combat');
    return observed;
  });
}
async function start(page: Page, manual = false) {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-02T12:00:00.100Z'));
  await page.goto('/?seed=42' + (manual ? '&clock=manual' : ''));
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return page
        .getByRole('button', { name: 'Pause', exact: true })
        .isVisible();
    })
    .toBe(true);
  await page.clock.runFor(500);
}
test('G04 swept geometry selects first coastal and capsule impact', () => {
  const hit = castIsland(
    { x: 0, y: 160 },
    { x: 900, y: 160 },
    { x: 192, y: 128, width: 160, height: 160, radius: 28 },
    5,
  );
  expect(hit).not.toBeNull();
  expect(hit).toBeLessThan(0.25);
  expect(
    castHull(
      { x: 0, y: 300 },
      { x: 900, y: 300 },
      { x: 450, y: 300, heading: 0 },
      29,
      28,
    ),
  ).toBeCloseTo(421 / 900);
  expect(
    castHull(
      { x: 0, y: 0 },
      { x: 900, y: 0 },
      { x: 450, y: 300, heading: 0 },
      29,
      28,
    ),
  ).toBeNull();
});
test('G05 real seeded rules pursue, fire and finish without Chaser impact points', () => {
  const simulation = new Simulation({
    id: 'test-match',
    player: { id: 'test-player', name: 'Test Captain' },
    seed: 42,
    config: createConfig(DEFAULT_SETTINGS),
  });
  const types = new Set<string>();
  let sawShot = false,
    previousHealth = 100;
  for (let tick = 0; tick < 7200 && !simulation.endReason; tick++) {
    simulation.step(EMPTY_INPUT);
    for (const ship of simulation.enemies.values()) types.add(ship.kind);
    if (simulation.shots.enemy > 0) sawShot = true;
    expect(simulation.player.health).toBeLessThanOrEqual(previousHealth);
    previousHealth = simulation.player.health;
  }
  expect([...types].sort()).toEqual(['chaser', 'shooter']);
  expect(sawShot).toBe(true);
  expect(simulation.endReason).toBe('death');
  expect(simulation.score).toBe(0);
  const ticks = simulation.ticks;
  simulation.step({ ...EMPTY_INPUT, front: true });
  expect(simulation.ticks).toBe(ticks);
});
test('G04 three actual weapons produce parallel broadsides and independent cooldowns', async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down(' ');
  await page.keyboard.down('q');
  await page.keyboard.down('e');
  await page.clock.runFor(50);
  const fired = await world(page);
  expect(fired.shots).toMatchObject({ front: 1, left: 1, right: 1 });
  const left = fired.projectiles.filter((p) => p.vx < -400),
    right = fired.projectiles.filter((p) => p.vx > 400);
  expect(left).toHaveLength(3);
  expect(right).toHaveLength(3);
  expect(new Set(left.map((p) => p.vy.toFixed(4))).size).toBe(1);
  expect(new Set(left.map((p) => p.y.toFixed(1))).size).toBe(3);
  expect(fired.projectiles.some((p) => p.vy === -400 && p.vx === 0)).toBe(true);
  await page.clock.runFor(500);
  const cooling = await world(page);
  expect(cooling.shots.front).toBe(2);
  expect(cooling.shots.left).toBe(1);
  expect(cooling.shots.right).toBe(1);
  await page.keyboard.up(' ');
  await page.keyboard.up('q');
  await page.keyboard.up('e');
});
test('G04 player controls kill through real projectile collision and score once', async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page);
  await page.keyboard.down(' ');
  let kills = 0;
  for (let step = 0; step < 100 && kills === 0; step++) {
    const observed = await world(page);
    const enemy = observed.enemies[0];
    if (enemy) {
      const desired = Math.atan2(
        enemy.x - observed.player.x,
        -(enemy.y - observed.player.y),
      );
      const difference = angleDifference(desired, observed.player.heading);
      await page.keyboard.up('a');
      await page.keyboard.up('d');
      if (Math.abs(difference) > 0.05)
        await page.keyboard.down(difference < 0 ? 'a' : 'd');
    }
    await page.clock.runFor(150);
    kills = (await world(page)).score;
  }
  expect(kills).toBeGreaterThan(0);
  await page.keyboard.up(' ');
  await page.keyboard.up('a');
  await page.keyboard.up('d');
  const kill = await world(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.runFor(2000);
  expect((await world(page)).score).toBe(kill.score);
  expect(
    kill.projectiles.every((p) => p.owner === 'player' || p.owner === 'enemy'),
  ).toBe(true);
});
test('G05 standard match spawns both roles at the configured interval', async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page);
  await page.clock.runFor(3100);
  const first = await world(page);
  expect(first.spawnIndex).toBe(1);
  expect(first.enemies[0]?.kind).toBe('chaser');
  const remaining = first.nextSpawn - first.elapsed;
  await page.clock.runFor(Math.max(0, remaining * 1000 + 100));
  const second = await world(page);
  expect(second.enemies.some((e) => e.kind === 'shooter')).toBe(true);
  expect(second.spawnIndex).toBe(2);
});
test('G06 completed simulation is immutable and restart begins cleanly', () => {
  const config = createConfig({
    ...DEFAULT_SETTINGS,
    duration: 60,
    spawnInterval: 10,
  });
  const simulation = new Simulation({
    id: 'first',
    player: { id: 'player', name: 'Test' },
    seed: 1,
    config,
  });
  // Inputs follow a rotating route and firing, preserving actual movement, AI and collisions.
  for (let tick = 0; tick < 3600 && !simulation.endReason; tick++)
    simulation.step({
      ...EMPTY_INPUT,
      front: true,
      left: true,
      right: true,
      forward: true,
      turn: tick % 360 < 180 ? 0.4 : -0.4,
    });
  const ended = simulation.observe();
  for (let i = 0; i < 120; i++)
    simulation.step({ ...EMPTY_INPUT, front: true });
  expect(simulation.observe()).toEqual(ended);
  const next = new Simulation({
    id: 'second',
    player: { id: 'player', name: 'Test' },
    seed: 1,
    config,
  });
  expect(next.elapsed).toBe(0);
  expect(next.player.health).toBe(100);
  expect(next.score).toBe(0);
  expect(next.enemies.size).toBe(0);
  expect(STEP).toBe(1 / 60);
});

test('G08 death result persists with its original ID and clean replay', async ({
  page,
}) => {
  test.setTimeout(180000);
  await start(page, true);
  await page.clock.resume();
  const id = (await world(page)).matchId;
  for (let part = 0; part < 20; part++) {
    await page.evaluate(() => window.pirateBattle?.advance(2000));
    if (
      await page
        .getByRole('heading', { name: 'Defeated', exact: true })
        .isVisible()
    )
      break;
  }
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Match saved.');
  const record = await page.evaluate(async () => {
    const opening = indexedDB.open('pirate-battle:v1', 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      opening.onsuccess = () => resolve(opening.result);
    });
    const request = db.transaction('records').objectStore('records').getAll();
    const rows = await new Promise<unknown[]>((resolve) => {
      request.onsuccess = () => resolve(request.result as unknown[]);
    });
    db.close();
    return rows;
  });
  expect(record).toHaveLength(1);
  expect(record[0]).toMatchObject({
    matchId: id,
    endReason: 'death',
    score: 0,
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible();
  await page.clock.runFor(500);
  const next = await world(page);
  expect(next.matchId).not.toBe(id);
  expect(next.player.health).toBe(100);
  expect(next.score).toBe(0);
  expect(next.enemies).toHaveLength(0);
});
test('G01 paused Options changes the next match without replacing active world', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await world(page);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Game session time', { exact: true }).fill('180');
  await page.getByLabel('Reduce motion').check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const unchanged = await world(page);
  expect(unchanged.matchId).toBe(paused.matchId);
  expect(unchanged.elapsed).toBe(paused.elapsed);
  expect(unchanged.hud.remaining).toBe(paused.hud.remaining);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(100);
  expect((await world(page)).matchId).toBe(paused.matchId);
});
