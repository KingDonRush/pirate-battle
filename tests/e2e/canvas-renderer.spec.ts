import { expect, test } from '@playwright/test';
import { probeRenderedArena } from '../support/canvas-pixels';

test.use({
  launchOptions: async ({ browserName }, applyOptions) => {
    await applyOptions(
      browserName === 'firefox'
        ? {
            firefoxUserPrefs: {
              'webgl.disabled': true,
              'dom.webgpu.enabled': false,
              'media.volume_scale': '0.0',
            },
          }
        : { args: ['--mute-audio', '--disable-webgl', '--disable-gpu'] },
    );
  },
});

test('G02 Pixi Canvas renders the full arena and actual cannon trail when WebGL is unavailable', async ({
  page,
}, info) => {
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const terrain = await page.evaluate(probeRenderedArena, 'terrain' as const);
  if (terrain.kind !== 'terrain') throw new Error('Unexpected canvas probe.');
  expect(terrain.backend).toBe('canvas');
  expect(terrain.rgba[3]).toBe(255);
  expect(terrain.rgba.slice(0, 3)).not.toEqual([20, 43, 53]);
  for (const color of terrain.land) {
    expect(color[3]).toBe(255);
    expect(color[1]! - color[2]!).toBeGreaterThan(25);
  }
  await page.keyboard.down(' ');
  await page.evaluate(() => window.pirateBattle!.advance(250));
  await page.keyboard.up(' ');
  const shot = await page.evaluate(probeRenderedArena, 'trail' as const);
  if (shot.kind !== 'trail') throw new Error('Unexpected canvas probe.');
  expect(shot.backend).toBe('canvas');
  expect(shot.trail[0]!).toBeGreaterThan(shot.water[0]! + 35);
  expect(shot.trail[3]).toBe(255);
  await info.attach('actual-canvas-pixels', {
    body: JSON.stringify({ terrain, shot }),
    contentType: 'application/json',
  });
  await page.screenshot({
    path: info.outputPath('canvas-terrain-and-trail.png'),
  });
});
