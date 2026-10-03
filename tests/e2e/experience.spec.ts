import { test, expect, type Page } from '@playwright/test';
import { probeRenderedArena } from '../support/canvas-pixels';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import type { GameRuntime } from '../../src/game/runtime';
import { pilotInput } from '../support/pilot';
import { KeyboardPilot } from '../support/browser-pilot';
async function start(page: Page, controlled = false) {
  if (controlled) {
    await page.clock.install({ time: new Date('2026-10-03T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-03T12:00:00.100Z'));
  }
  await page.goto('/?seed=42&clock=manual');
  await page.getByLabel('Display name').fill('Coral Captain');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(async () => {
      if (controlled) await page.clock.runFor(100);
      return page.evaluate(() => window.pirateBattle?.observe().hud.state);
    })
    .toBe('running');
}
test('complete viewport menu, Options tabs and help stay within their frame', async ({
  page,
}, info) => {
  for (const [width, height] of [
    [1800, 1000],
    [1366, 625],
    [1280, 720],
    [390, 844],
    [320, 568],
    [568, 320],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.goto('/');
    await expect(page.getByLabel('Display name')).toBeVisible();
    const bounds = await page.evaluate(() => {
      const frame = document
          .querySelector('.menu-panel')!
          .getBoundingClientRect(),
        name = document.querySelector('.identity-row')!.getBoundingClientRect();
      return {
        overflow:
          document.documentElement.scrollHeight > innerHeight ||
          document.documentElement.scrollWidth > innerWidth,
        contained:
          name.left >= frame.left &&
          name.right <= frame.right &&
          name.top >= frame.top &&
          name.bottom <= frame.bottom,
      };
    });
    expect(bounds, `${width}×${height}`).toEqual({
      overflow: false,
      contained: true,
    });
    await expect(
      page.getByRole('button', { name: 'Play', exact: true }),
    ).toBeInViewport();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    const tabs = await page.getByRole('tab').evaluateAll((buttons) =>
      buttons.map((button) => {
        const range = document.createRange();
        range.selectNodeContents(button);
        const label = range.getBoundingClientRect(),
          bounds = button.getBoundingClientRect();
        return {
          name: button.textContent,
          fits:
            label.left >= bounds.left &&
            label.right <= bounds.right &&
            label.top >= bounds.top &&
            label.bottom <= bounds.bottom,
        };
      }),
    );
    expect(
      tabs.every((tab) => tab.fits),
      `${width}×${height}: ${JSON.stringify(tabs)}`,
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`options-${width}.png`) });
    for (const name of [
      'Game',
      'Controls',
      'Audio',
      'Accessibility',
      'Demo Network',
    ]) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Save', exact: true }),
      ).toBeInViewport();
      await expect(
        page.getByRole('button', { name: 'Cancel', exact: true }),
      ).toBeInViewport();
    }
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page
      .getByRole('button', { name: 'How to play', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'How to play', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Main Menu', exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`help-${width}.png`) });
  }
});
test('Firefox and Chromium draw the complete terrain after load, resize and reload', async ({
  page,
}, info) => {
  await start(page);
  for (const [width, height] of [
    [1280, 720],
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const state = window.pirateBattle?.observe();
          const host = document
            .querySelector('.arena-viewport')!
            .getBoundingClientRect();
          return (
            state?.hud.state === 'running' &&
            host.width === innerWidth &&
            host.height === innerHeight &&
            state.view?.width === host.width &&
            state.view.height === host.height
          );
        }),
      )
      .toBe(true);
    const state = await page.evaluate(probeRenderedArena, 'terrain' as const);
    if (state.kind !== 'terrain') throw new Error('Unexpected canvas probe.');
    expect(state.host.x).toBe(0);
    expect(state.host.y).toBe(0);
    expect(state.host.width).toBe(state.width);
    expect(state.host.height).toBe(state.height);
    expect(state.rgba[3]).toBe(255);
    expect(state.rgba.slice(0, 3)).not.toEqual([20, 43, 53]);
    for (const color of state.land) {
      expect(color[3]).toBe(255);
      expect(color[1]! - color[2]!).toBeGreaterThan(25);
    }
    expect(state.scene.terrainObjects).toBeGreaterThan(20);
    await page.screenshot({ path: info.outputPath(`terrain-${width}.png`) });
  }
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await page.screenshot({ path: info.outputPath('terrain-warm.png') });
});
test('repeated native Escape keeps dialog and actual pause/resume in sync', async ({
  page,
}) => {
  await start(page);
  for (let cycle = 0; cycle < 4; cycle++) {
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'Paused', exact: true }),
    ).toBeVisible();
    const before = await page.evaluate(
      () => window.pirateBattle?.observe().elapsed,
    );
    await page.evaluate(() => window.pirateBattle?.advance(1000));
    expect(
      await page.evaluate(() => window.pirateBattle?.observe().elapsed),
    ).toBe(before);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog', { name: 'Paused', exact: true }),
    ).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
      .toBe('running');
    await page.evaluate(() => window.pirateBattle?.advance(100));
    expect(
      await page.evaluate(() => window.pirateBattle?.observe().elapsed),
    ).toBeGreaterThan(before!);
  }
});

test('ships spawn healthy and keep the correct damage family under real attacks', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await start(page);
  const config = createConfig(DEFAULT_SETTINGS),
    pilot = new KeyboardPilot(page);
  const families = {
    player: ['ship_2.png', 'ship_8.png', 'ship_14.png'],
    chaser: ['ship_4.png', 'ship_10.png', 'ship_16.png'],
    shooter: ['ship_5.png', 'ship_11.png', 'ship_17.png'],
  };
  const seen = new Map<number, number>();
  const roles = new Set<string>(),
    damaged = new Set<string>();
  for (let tick = 0; tick < 600; tick++) {
    const state = await page.evaluate(() => window.pirateBattle?.observe());
    if (!state || state.endReason) break;
    for (const ship of [
      { ...state.player, id: 0, kind: 'player' as const },
      ...state.enemies,
    ]) {
      const maximum =
        ship.kind === 'player'
          ? config.player.health
          : config.enemies[ship.kind].health;
      const ratio = ship.health / maximum,
        index = ratio > 0.66 ? 0 : ratio > 0.33 ? 1 : 2;
      expect(state.resources.scene.shipTextures[ship.id]).toBe(
        families[ship.kind][index],
      );
      if (!seen.has(ship.id)) {
        expect(ship.health).toBe(maximum);
        roles.add(ship.kind);
      }
      expect(ship.health).toBeLessThanOrEqual(seen.get(ship.id) ?? maximum);
      if (ship.health < maximum) {
        if (!damaged.has(ship.kind))
          await page.screenshot({
            path: info.outputPath('damage-' + ship.kind + '.png'),
          });
        damaged.add(ship.kind);
      }
      seen.set(ship.id, ship.health);
    }
    if (damaged.has('chaser') && damaged.has('shooter')) break;
    await pilot.apply(pilotInput(state, config));
    await page.evaluate(() => window.pirateBattle?.advance(50));
  }
  await pilot.release();
  expect([...roles].sort()).toEqual(['chaser', 'player', 'shooter']);
  expect(damaged.has('chaser')).toBe(true);
  expect(damaged.has('shooter')).toBe(true);
});

declare global {
  interface Window {
    endingRead?: () => ReturnType<GameRuntime['observe']>;
    terminalCue?: { starts: number; stops: number };
  }
}
async function observeTerminalCue(page: Page, blurOnStart = false) {
  await page.addInitScript((blurOnStart) => {
    window.terminalCue = { starts: 0, stops: 0 };
    // Observe real Web Audio calls without changing their clock or buffers.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const start = AudioBufferSourceNode.prototype.start;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      const terminal = Math.abs((this.buffer?.duration ?? 0) - 1.6) < 0.001;
      start.apply(this, args);
      if (terminal) {
        window.terminalCue!.starts++;
        // The real context clock continues while visual test time is paused.
        // Trigger the owner event while the actual cue is still active.
        if (blurOnStart)
          queueMicrotask(() => window.dispatchEvent(new Event('blur')));
      }
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      if (Math.abs((this.buffer?.duration ?? 0) - 1.6) < 0.001)
        window.terminalCue!.stops++;
      return stop.apply(this, args);
    };
  }, blurOnStart);
}
test('death retains an animated ending, terminal sound and immediate single result', async ({
  page,
}, info) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await observeTerminalCue(page);
  await start(page, true);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pirateBattle?.observe().resources.audio.buffers,
      ),
    )
    .toBe(14);
  const ended = await page.evaluate(() => {
    window.endingRead = window.pirateBattle!.observe;
    const damage: { health: number; texture: string | undefined }[] = [];
    let previous = 101;
    for (
      let tick = 0;
      tick < 1200 && !window.pirateBattle!.observe().endReason;
      tick++
    ) {
      window.pirateBattle!.advance(100);
      const state = window.pirateBattle!.observe();
      if (state.player.health !== previous) {
        damage.push({
          health: state.player.health,
          texture: state.resources.scene.shipTextures[0],
        });
        previous = state.player.health;
      }
    }
    return { ...window.pirateBattle!.observe(), damage };
  });
  for (const hit of ended.damage)
    expect(hit.texture).toBe(
      hit.health > 66
        ? 'ship_2.png'
        : hit.health > 33
          ? 'ship_8.png'
          : 'ship_14.png',
    );
  expect(ended.damage.some((hit) => hit.texture === 'ship_8.png')).toBe(true);
  expect(
    ended.damage.some((hit) => hit.health > 0 && hit.texture === 'ship_14.png'),
  ).toBe(true);
  expect(ended.hud.state).toBe('ending');
  expect(ended.endReason).toBe('death');
  expect(ended.player.health).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.terminalCue?.starts))
    .toBe(1);
  expect(await page.evaluate(() => window.terminalCue?.stops)).toBe(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Play Again', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('ending-start.png') });
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve) => {
          const request = indexedDB.open('pirate-battle:v1', 1);
          request.onsuccess = () => resolve(request.result);
        });
        const latest = await new Promise<unknown>((resolve) => {
          const request = db
            .transaction('meta')
            .objectStore('meta')
            .get('latest');
          request.onsuccess = () => resolve(request.result as unknown);
        });
        db.close();
        return latest;
      }),
    )
    .toMatchObject({
      matchId: ended.matchId,
      endReason: 'death',
      duration: ended.elapsed,
    });
  await page.clock.runFor(200);
  const during = await page.evaluate(() => window.pirateBattle!.observe());
  expect(during.hud.state).toBe('ending');
  for (const key of [
    'elapsed',
    'score',
    'player',
    'enemies',
    'projectiles',
    'cooldowns',
    'shots',
    'spawnIndex',
  ] as const)
    expect(during[key]).toEqual(ended[key]);
  expect(during.resources.audio.loops).toBe(0);
  expect(await page.evaluate(() => window.terminalCue)).toEqual({
    starts: 1,
    stops: 0,
  });
  await page.screenshot({ path: info.outputPath('ending-200ms.png') });
  await page.clock.runFor(300);
  await page.screenshot({ path: info.outputPath('ending-500ms.png') });
  await page.clock.runFor(600);
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  // It may end naturally during slow screenshot/IDB operations; disposal must not stop it.
  expect(await page.evaluate(() => window.terminalCue)).toEqual({
    starts: 1,
    stops: 0,
  });
  expect(
    await page.evaluate(() => window.endingRead?.().resources.audio.loops),
  ).toBe(0);
  await expect
    .poll(async () => {
      await page.clock.runFor(200);
      return page.getByRole('status').innerText();
    })
    .toBe('Match saved.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  expect(
    await page.evaluate(() => window.endingRead?.().resources.audio.voices),
  ).toBe(0);
  await page.evaluate(() => {
    delete window.endingRead;
    delete window.terminalCue;
  });
});

test('floating stick modes, mirrored cannons and resize release native touches', async ({
  page,
  context,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium',
    'Native simultaneous contacts use Chromium CDP; Firefox covers keyboard and rendering.',
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5,
  });
  try {
    await page.goto('/?seed=42&clock=manual');
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page.getByRole('tab', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Mirror touch controls').check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page.getByRole('tab', { name: 'Controls', exact: true }).click();
    await expect(page.getByLabel('Mirror touch controls')).toBeChecked();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
      .toBe('running');
    const viewport = page.viewportSize()!,
      origin = { x: viewport.width * 0.4, y: viewport.height * 0.6 };
    const fire = await page
      .getByRole('button', { name: 'Fire forward', exact: true })
      .boundingBox();
    if (!fire) throw new Error('Missing cannon');
    expect(fire.x).toBeGreaterThan(viewport.width / 2);
    const contact = {
      id: 2,
      x: fire.x + fire.width / 2,
      y: fire.y + fire.height / 2,
    };
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, ...origin }, contact],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x: origin.x + 48, y: origin.y }, contact],
    });
    const before = await page.evaluate(() => window.pirateBattle!.observe());
    expect(before.input.forward).toBe(true);
    expect(before.input.front).toBe(true);
    expect(before.input.heading).toBeCloseTo(Math.PI / 2 - before.view!.angle);
    await page.evaluate(() => window.pirateBattle?.advance(400));
    const moved = await page.evaluate(() => window.pirateBattle!.observe());
    expect(
      Math.hypot(
        moved.player.x - before.player.x,
        moved.player.y - before.player.y,
      ),
    ).toBeGreaterThan(5);
    await page.screenshot({ path: info.outputPath('direction-stick.png') });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    expect(
      (await page.evaluate(() => window.pirateBattle!.observe())).input.forward,
    ).toBe(false);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page.getByRole('tab', { name: 'Controls', exact: true }).click();
    await page.getByRole('radio', { name: /^Throttle & Rudder/ }).check();
    await page.getByLabel('Mirror touch controls').uncheck();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 3, ...origin }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 3, x: origin.x + 32, y: origin.y - 32 }],
    });
    const rudder = await page.evaluate(() => window.pirateBattle!.observe());
    expect(rudder.input.turn).toBeCloseTo(2 / 3);
    expect(rudder.input.throttle).toBeCloseTo(2 / 3);
    expect(rudder.input.heading).toBeUndefined();
    await page.evaluate(() => window.pirateBattle?.advance(200));
    const forward = await page.evaluate(() => window.pirateBattle!.observe());
    expect(forward.player.heading).toBeGreaterThan(rudder.player.heading);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 3, x: origin.x + 32, y: origin.y + 32 }],
    });
    await expect
      .poll(() =>
        page.evaluate(() => window.pirateBattle!.observe().input.throttle),
      )
      .toBe(0);
    const noReverse = await page.evaluate(() => window.pirateBattle!.observe());
    expect(noReverse.input.forward).toBe(false);
    await page.evaluate(() => window.pirateBattle?.advance(200));
    expect(
      (await page.evaluate(() => window.pirateBattle!.observe())).player.x,
    ).toBe(noReverse.player.x);
    expect(
      (await page.evaluate(() => window.pirateBattle!.observe())).player.y,
    ).toBe(noReverse.player.y);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const state = window.pirateBattle?.observe();
          return (
            state?.hud.state === 'running' &&
            state.view?.width === 390 &&
            state.view.height === 844
          );
        }),
      )
      .toBe(true);
    expect(
      (await page.evaluate(() => window.pirateBattle!.observe())).input.forward,
    ).toBe(false);
    expect(
      (await page.evaluate(() => window.pirateBattle!.observe())).input.turn,
    ).toBe(0);
    await expect(page.locator('.virtual-stick')).toHaveCount(0);
    const left = await page
      .getByRole('button', { name: 'Fire forward', exact: true })
      .boundingBox();
    expect(left!.x).toBeLessThan(80);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    await cdp.detach();
  }
});

test('supplied green and blue sail families lose fabric without changing faction colour', async ({
  page,
}) => {
  await start(page);
  const counts = await page.evaluate(
    async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 66;
      canvas.height = 113;
      const context = canvas.getContext('2d')!;
      const samples = [
        ['green', 68, 192],
        ['green', 340, 345],
        ['green', 272, 115],
        ['blue', 68, 77],
        ['blue', 340, 230],
        ['blue', 272, 0],
      ] as const;
      return samples.map(([faction, x, y]) => {
        context.clearRect(0, 0, 66, 113);
        context.drawImage(image, x, y, 66, 113, 0, 0, 66, 113);
        const pixels = context.getImageData(10, 25, 46, 45).data;
        let coloured = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const [r = 0, g = 0, b = 0, a = 0] = pixels.slice(i, i + 4);
          if (
            a > 200 &&
            (faction === 'blue'
              ? b > r + 30 && g > r + 15
              : g > r + 15 && g > b + 25)
          )
            coloured++;
        }
        return coloured;
      });
    },
    await page.evaluate(
      () => window.pirateBattle!.observe().resources.scene.shipAtlasUrl,
    ),
  );
  for (const offset of [0, 3]) {
    expect(counts[offset]).toBeGreaterThan(1000);
    expect(counts[offset]).toBeGreaterThan(counts[offset + 1]!);
    expect(counts[offset + 1]).toBeGreaterThan(counts[offset + 2]!);
    expect(counts[offset + 2]).toBeGreaterThan(1000);
  }
});

test('front cannon leaves a visible white tapered trail through normal rendering', async ({
  page,
}, info) => {
  await start(page);
  await page.keyboard.down(' ');
  // Let this real shot clear the player's upright health bar before sampling it.
  await page.evaluate(() => window.pirateBattle?.advance(250));
  await page.keyboard.up(' ');
  const pixels = await page.evaluate(probeRenderedArena, 'trail' as const);
  if (pixels.kind !== 'trail') throw new Error('Unexpected canvas probe.');
  expect(pixels.trail[0]!).toBeGreaterThan(pixels.water[0]! + 35);
  expect(pixels.trail[3]).toBe(255);
  await page.screenshot({ path: info.outputPath('white-trail.png') });
});

test('native clockwise, counterclockwise and inverted orientation rotate one frozen world', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Device orientation uses Chromium CDP; Firefox covers actual viewport resizing.',
  );
  await start(page, true);
  await page.keyboard.down(' ');
  await page.evaluate(() => window.pirateBattle?.advance(100));
  const cdp = await context.newCDPSession(page);
  const initial = await page.evaluate(() => window.pirateBattle!.observe());
  try {
    for (const [width, height, type, angle, expected] of [
      [390, 844, 'portraitPrimary', 0, Math.PI / 2],
      [844, 390, 'landscapePrimary', 90, 0],
      [390, 844, 'portraitSecondary', 180, -Math.PI / 2],
      [844, 390, 'landscapeSecondary', 270, -Math.PI],
      [390, 844, 'portraitPrimary', 0, Math.PI / 2],
    ] as const) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        mobile: true,
        deviceScaleFactor: 1,
        screenOrientation: { type, angle },
      });
      await expect
        .poll(async () => {
          await page.clock.runFor(10);
          return page.evaluate(() => window.pirateBattle?.observe().hud.state);
        })
        .toBe('reflowing');
      const before = await page.evaluate(() => window.pirateBattle!.observe());
      expect(before.hud.state).toBe('reflowing');
      await page.evaluate(() => window.pirateBattle?.advance(1000));
      expect(
        (await page.evaluate(() => window.pirateBattle!.observe())).elapsed,
      ).toBe(initial.elapsed);
      await page.clock.runFor(600);
      const after = await page.evaluate(() => window.pirateBattle!.observe());
      expect(after.hud.state).toBe('running');
      const delta = after.view!.angle - expected;
      expect(Math.atan2(Math.sin(delta), Math.cos(delta))).toBeCloseTo(0);
      expect(after.player).toEqual(initial.player);
      expect(after.projectiles).toEqual(initial.projectiles);
      expect(after.input.front).toBe(false);
    }
  } finally {
    await page.keyboard.up(' ');
    await cdp.detach();
  }
});

test('Options keeps its cross-tab draft, validates Game and cancels without side effects', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByLabel('Display name').fill('<invalid>');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Display name')).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Play as guest', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Game session time', { exact: true }).fill('59');
  await page.getByRole('tab', { name: 'Controls', exact: true }).click();
  await page.getByRole('radio', { name: /^Throttle & Rudder/ }).check();
  await page.getByLabel('Mirror touch controls').check();
  await page.getByRole('tab', { name: 'Audio', exact: true }).click();
  await page.getByLabel('Mute sound').check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('tab', { name: 'Game', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toBeFocused();
  await page.getByLabel('Game session time', { exact: true }).fill('60');
  await page.getByRole('tab', { name: 'Controls', exact: true }).click();
  await expect(page.getByLabel('Mirror touch controls')).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Options', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('120');
  await page.getByRole('tab', { name: 'Controls', exact: true }).click();
  await expect(page.getByRole('radio', { name: /^Direction/ })).toBeChecked();
  await expect(page.getByLabel('Mirror touch controls')).not.toBeChecked();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});

test('Escape cancels paused Options and abandonment before resuming the same match', async ({
  page,
}) => {
  await start(page);
  const before = await page.evaluate(() => window.pirateBattle!.observe());
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Game session time', { exact: true }).fill('180');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Paused', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Leave this match?', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Paused', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => window.pirateBattle?.advance(100));
  const resumed = await page.evaluate(() => window.pirateBattle!.observe());
  expect(resumed.matchId).toBe(before.matchId);
  expect(resumed.hud.state).toBe('running');
  expect(resumed.hud.remaining).toBe(120);
  expect(resumed.elapsed).toBeGreaterThan(before.elapsed);
});

test('terminal cancellation on blur leaves no suspended combat or result voices', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await observeTerminalCue(page, true);
  await start(page, true);
  await expect
    .poll(() =>
      page.evaluate(
        () => window.pirateBattle!.observe().resources.audio.buffers,
      ),
    )
    .toBe(14);
  await page.evaluate(() => window.pirateBattle!.advance(120000));
  // Synthetic blur is dispatched immediately after the real cue starts.
  // The headed focus test separately uses a real tab switch.
  await expect
    .poll(() => page.evaluate(() => window.terminalCue))
    .toEqual({ starts: 1, stops: 1 });
  expect(
    await page.evaluate(
      () => window.pirateBattle!.observe().resources.audio.voices,
    ),
  ).toBe(0);
  await page.clock.runFor(1000);
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('existing settings retain balance and audio while new touch preferences migrate safely', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('pirate-battle:settings:v1'))
      localStorage.setItem(
        'pirate-battle:settings:v1',
        JSON.stringify({
          duration: 150,
          spawnInterval: 5,
          volume: 0.4,
          effectsVolume: 0.6,
          ambienceVolume: 0.2,
          muted: true,
          reducedMotion: true,
        }),
      );
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('150');
  await expect(
    page.getByLabel('Enemy spawn time', { exact: true }),
  ).toHaveValue('5');
  await page.getByRole('tab', { name: 'Controls', exact: true }).click();
  await expect(page.getByRole('radio', { name: /^Direction/ })).toBeChecked();
  await expect(page.getByLabel('Mirror touch controls')).not.toBeChecked();
  await page.getByRole('tab', { name: 'Audio', exact: true }).click();
  await expect(page.getByLabel('Mute sound')).toBeChecked();
  await expect(
    page.getByRole('slider', { name: 'Master volume · 40%', exact: true }),
  ).toHaveValue('0.4');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem('pirate-battle:settings:v1')!,
        ) as unknown,
    ),
  ).toMatchObject({
    duration: 150,
    spawnInterval: 5,
    volume: 0.4,
    muted: true,
    reducedMotion: true,
    controlMode: 'direction',
    mirrorControls: false,
  });
});
