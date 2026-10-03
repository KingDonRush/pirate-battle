import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { pilotInput } from '../support/pilot';
import { KeyboardPilot } from '../support/browser-pilot';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';

test('digital mix levels under real simultaneous combat input', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    // Reapply the captured native method to each real context with call(this).
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = AudioContext.prototype.createGain;
    let attached = false;
    AudioContext.prototype.createGain = function () {
      const gain = original.call(this);
      if (!attached) {
        attached = true;
        const analyser = this.createAnalyser();
        analyser.fftSize = 2048;
        gain.connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        Object.assign(window, {
          readMix: () => {
            analyser.getFloatTimeDomainData(samples);
            return {
              peak: samples.reduce(
                (peak, value) => Math.max(peak, Math.abs(value)),
                0,
              ),
              rms: Math.sqrt(
                samples.reduce((sum, value) => sum + value * value, 0) /
                  samples.length,
              ),
              contextState: this.state,
            };
          },
        });
      }
      return gain;
    };
  });
  const identity = (await (
    await page.request.get('/build-info.json')
  ).json()) as unknown;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const focus = await page.context().newCDPSession(page);
  await focus.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const pilot = new KeyboardPilot(page),
    levels: { peak: number; rms: number; contextState: string }[] = [];
  const config = createConfig(DEFAULT_SETTINGS);
  while (
    (await page.evaluate(() => window.pirateBattle?.observe().elapsed ?? 30)) <
    30
  ) {
    const state = await page.evaluate(() => window.pirateBattle?.observe());
    if (!state) break;
    await pilot.apply(pilotInput(state, config));
    levels.push(
      await page.evaluate(() =>
        (
          window as unknown as {
            readMix: () => { peak: number; rms: number; contextState: string };
          }
        ).readMix(),
      ),
    );
    await page.waitForTimeout(25);
  }
  await pilot.release();
  const result = {
    identity,
    settings: DEFAULT_SETTINGS,
    samples: levels.length,
    peak: Math.max(...levels.map((level) => level.peak)),
    maxRms: Math.max(...levels.map((level) => level.rms)),
    clippedWindows: levels.filter((level) => level.peak > 1).length,
    errors,
    method:
      'Read-only analyser attached to the first (master) gain; genuine 30-active-second simultaneous front/left/right input. Browser output muted. Digital levels do not establish subjective audibility, latency or physical-device listening.',
  };
  await mkdir('artifacts/profiling', { recursive: true });
  await writeFile(
    'artifacts/profiling/audio-levels.json',
    JSON.stringify(result, null, 2) + '\n',
  );
  await info.attach('audio-levels', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
  expect(result.samples).toBeGreaterThan(100);
  expect(result.peak).toBeGreaterThan(0);
});
