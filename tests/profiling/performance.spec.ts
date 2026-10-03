import { test, expect, type Page } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { pilotInput } from '../support/pilot';
import { KeyboardPilot } from '../support/browser-pilot';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { rulesetId } from '../../src/data/contracts';
import type { GameRuntime } from '../../src/game/runtime';
import { summarizeHeap } from '../support/heap-summary';
declare global {
  interface Window {
    profileRead?: (
      includeFrames?: boolean,
    ) => ReturnType<GameRuntime['observe']>;
  }
}
async function play(page: Page, duration = 180) {
  await page.goto('/?seed=42');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page
    .getByLabel('Game session time', { exact: true })
    .fill(String(duration));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByLabel('Display name').fill('Profiling Captain');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await page.evaluate(() => {
    if (!window.pirateBattle) throw new Error('No active runtime');
    window.profileRead = window.pirateBattle.observe;
  });
}
async function report(name: string, value: unknown) {
  await mkdir('artifacts/profiling', { recursive: true });
  await writeFile(
    'artifacts/profiling/' + name + '.json',
    JSON.stringify(value, null, 2) + '\n',
  );
}
async function graphicsInfo(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext;
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: debug
        ? (gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string)
        : 'Unavailable',
      vendor: debug
        ? (gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) as string)
        : 'Unavailable',
      version: gl.getParameter(gl.VERSION) as string,
      viewport: { width: innerWidth, height: innerHeight },
      dpr: devicePixelRatio,
    };
  });
}
test('P01 real 180-active-second optimized combat profile', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const identity = (await (
    await page.request.get('/build-info.json')
  ).json()) as unknown;
  await play(page);
  const focus = await page.context().newCDPSession(page);
  await focus.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const hardware = await graphicsInfo(page);
  const protocol = await browser.newBrowserCDPSession();
  const system = await protocol.send('SystemInfo.getInfo');
  const config = createConfig({ ...DEFAULT_SETTINGS, duration: 180 });
  const pilot = new KeyboardPilot(page);
  let pauses = 0,
    reflows = 0,
    maxAudioVoices = 0;
  const roles = new Set<string>();
  const started = Date.now();
  while (Date.now() - started < 250000) {
    const state = await page.evaluate(() => window.pirateBattle?.observe());
    if (!state || state.hud.state === 'finished') break;
    if (state.hud.state === 'paused') {
      pauses++;
      await pilot.release();
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
    } else if (state.hud.state === 'reflowing') reflows++;
    else await pilot.apply(pilotInput(state, config));
    for (const ship of state.enemies) roles.add(ship.kind);
    maxAudioVoices = Math.max(maxAudioVoices, state.resources.audio.voices);
    await page.waitForTimeout(25);
  }
  await pilot.release();
  const final = await page.evaluate(() => {
    const state = window.profileRead?.(true);
    delete window.profileRead;
    return state;
  });
  if (!final) throw new Error('No complete frame history');
  const intervals = final.frames.filter((ms) => ms > 0),
    sorted = [...intervals].sort((a, b) => a - b);
  const wall = intervals.reduce((sum, ms) => sum + ms, 0) / 1000;
  const result = {
    identity,
    browser: browser.version(),
    os: {
      platform: os.platform(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
    },
    hardware,
    gpu: {
      devices: system.gpu.devices,
      featureStatus: system.gpu.featureStatus,
    },
    config,
    rulesetId: await rulesetId(config),
    seed: 42,
    protocol:
      'Stationary lead-aim pilot; genuine keyboard front/left/right and turns; poll every 25 ms plus IPC. Diagnostic focus emulation keeps the hardware sample active; native focus behavior is verified separately. A pause releases/represses keys; no outcome assignment. Test-browser audio output is muted; real Web Audio nodes/mixing still run.',
    elapsed: final.elapsed,
    endReason: final.endReason,
    score: final.score,
    health: final.player.health,
    spawnIndex: final.spawnIndex,
    roles: [...roles],
    measuredFrames: intervals.length,
    rawIntervalSeconds: wall,
    fps: intervals.length / wall,
    p95Milliseconds: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maximumIntervalMilliseconds: sorted.at(-1),
    peaks: final.peaks,
    maxAudioVoices,
    pauses,
    reflows,
    errors,
    intervalsMilliseconds: intervals,
  };
  await report('combat', result);
  await info.attach('combat-profile', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(final.endReason).toBe('time');
  expect(final.elapsed).toBe(180);
  expect([...roles].sort()).toEqual(['chaser', 'shooter']);
  expect(errors).toEqual([]);
  await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible();
  // Vulkan without a native display surface supports measurement but not screenshots.
  // Normal E2E/reference runs retain the rendered comparison evidence.
  if (process.env.PROFILE_VULKAN !== '1')
    await page.screenshot({
      path: info.outputPath('completed-profile.png'),
      timeout: 10000,
    });
});
test('P02 five comparable play/exit resource and reachable-heap cycles', async ({
  page,
  context,
  browser,
}, info) => {
  const protocol = await context.newCDPSession(page);
  await protocol.send('HeapProfiler.enable');
  const identity = (await (
    await page.request.get('/build-info.json')
  ).json()) as unknown;
  let hardware: Awaited<ReturnType<typeof graphicsInfo>> | undefined;
  const samples: unknown[] = [];
  const portCounts: number[] = [];

  const cycleCount = process.env.PROFILE_WARMUP_AUDIT === '1' ? 10 : 5;
  for (let cycle = 0; cycle < cycleCount; cycle++) {
    // Keep the same document after warmup; a reload would hide retained owners.
    if (cycle === 0) {
      await play(page, 180);
      hardware = await graphicsInfo(page);
    } else {
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect
        .poll(() =>
          page.evaluate(() => window.pirateBattle?.observe().hud.state),
        )
        .toBe('running');
      await page.evaluate(() => {
        if (!window.pirateBattle) throw new Error('No active runtime');
        window.profileRead = window.pirateBattle.observe;
      });
    }
    await protocol.send('Emulation.setFocusEmulationEnabled', {
      enabled: true,
    });
    await page.keyboard.down('w');
    await page.keyboard.down(' ');
    await page.keyboard.down('q');
    const until = Date.now() + 30000;
    while (
      Date.now() < until &&
      (await page.evaluate(() => window.pirateBattle?.observe().elapsed ?? 8)) <
        8
    ) {
      const state = await page.evaluate(
        () => window.pirateBattle?.observe().hud.state,
      );
      if (state === 'paused') {
        await page.getByRole('button', { name: 'Resume', exact: true }).click();
        await page.keyboard.down('w');
        await page.keyboard.down(' ');
        await page.keyboard.down('q');
      }
      await page.waitForTimeout(100);
    }
    await page.keyboard.up('w');
    await page.keyboard.up(' ');
    await page.keyboard.up('q');
    const active = await page.evaluate(() => window.pirateBattle?.observe());
    const ownerNames = active?.resources.classNames ?? {};
    expect(active?.elapsed).toBeGreaterThanOrEqual(8);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await page
      .getByRole('button', { name: 'Leave match', exact: true })
      .click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => window.profileRead?.().resources.audio.state),
      )
      .toBe('suspended');
    const closed = await page.evaluate(() => {
      const state = window.profileRead?.();
      delete window.profileRead;
      return state;
    });
    expect(closed?.resources).toMatchObject({
      applications: 0,
      pendingApplications: 0,
      browserListeners: 0,
      observers: 0,
      ticker: 0,
      scene: { ships: 0, projectiles: 0, effects: 0 },
      listeners: 0,
      audio: { contexts: 1, voices: 0, loops: 0 },
    });
    await protocol.send('HeapProfiler.collectGarbage');
    const heap = await protocol.send('Runtime.getHeapUsage');
    const dom = await protocol.send('Memory.getDOMCounters');
    const listeners = await protocol.send('Runtime.evaluate', {
      expression:
        'Object.fromEntries(Object.entries(getEventListeners(window)).map(([type,items])=>[type,items.length]))',
      includeCommandLineAPI: true,
      returnByValue: true,
    });
    const reachable = await summarizeHeap(protocol, ownerNames);
    portCounts.push(reachable.nativeObjects.MessagePort ?? 0);
    samples.push({
      cycle: cycle + 1,
      active: active?.resources,
      closed: closed?.resources,
      heap,
      dom,
      windowListeners: listeners.result.value as unknown,
      reachable,
    });
    await report('resources-partial', { browser: browser.version(), samples });
  }
  const result = {
    identity,
    browser: browser.version(),
    hardware,
    os: {
      platform: os.platform(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
    },
    config: createConfig({ ...DEFAULT_SETTINGS, duration: 180 }),
    seed: 42,
    samples,
    portCounts,
    method:
      'Same document, same 8 s movement/firing and UI abandonment; cleanup observation then release diagnostic owner and force GC at each point. Each point includes a heap category/native-object summary and representative strong-root paths. Minified constructor-name collisions are explicitly ambiguous. Browser audio output is muted; Web Audio nodes remain real. Shared assets, one audio context/buffers and library pools are intentional. PROFILE_WARMUP_AUDIT=1 extends the five required cycles to ten to investigate growth.',
  };
  await report('resources', result);
  await info.attach('resource-cycles', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(
    new Set(portCounts).size,
    'MSW observation ports must not accumulate',
  ).toBe(1);
});
