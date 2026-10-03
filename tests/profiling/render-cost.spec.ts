import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
declare global {
  interface Window {
    drawProbe?: { draws: number; frame: (ms: number) => void };
  }
}
test('measure canonical frame render cost', async ({ page }, info) => {
  await page.addInitScript(() => {
    const probe = { draws: 0, frame: () => {} };
    window.drawProbe = probe;
    for (const prototype of [
      WebGLRenderingContext.prototype,
      WebGL2RenderingContext.prototype,
    ]) {
      // The wrapper explicitly reapplies the intercepted native GL context.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const original = prototype.drawElements;
      prototype.drawElements = function (...args) {
        probe.draws++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const data = await page.evaluate(() => {
    const intervals: number[] = [];
    window.drawProbe!.draws = 0;
    const gl = document.querySelector('canvas')!.getContext('webgl2')!;
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      window.pirateBattle!.advance(17);
      gl.finish();
      intervals.push(performance.now() - start);
    }
    const debug = gl.getExtension('WEBGL_debug_renderer_info')!;
    return {
      intervals,
      draws: window.drawProbe!.draws,
      renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string,
      state: window.pirateBattle!.observe(),
    };
  });
  const sorted = [...data.intervals].sort((a, b) => a - b);
  const result = {
    label: process.env.PROFILE_LABEL ?? 'terrain',
    renderer: data.renderer,
    meanRenderMilliseconds: data.intervals.reduce((a, b) => a + b, 0) / 100,
    p95Milliseconds: sorted[94],
    drawsPerFrame: data.draws / 100,
    resources: data.state.resources,
    intervals: data.intervals,
  };
  await mkdir('artifacts/profiling', { recursive: true });
  await writeFile(
    'artifacts/profiling/render-' +
      (process.env.PROFILE_LABEL ?? 'terrain') +
      '.json',
    JSON.stringify(result, null, 2) + '\n',
  );
  await info.attach('render-cost', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
});
