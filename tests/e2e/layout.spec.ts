import { test, expect } from '@playwright/test';
const sizes = [
  [1280, 720],
  [1440, 900],
  [1366, 625],
  [768, 1024],
  [1024, 768],
  [320, 568],
  [360, 640],
  [390, 844],
  [412, 839],
  [568, 320],
  [667, 375],
  [844, 390],
] as const;
for (const dpr of [1, 1.25, 1.5, 2, 3]) {
  test(
    'G09 complete arena, long name and controls at DPR ' + dpr,
    async ({ browser }, info) => {
      test.setTimeout(180000);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: dpr,
        hasTouch: true,
      });
      try {
        const page = await context.newPage();
        await page.goto('/?clock=manual&seed=42');
        await page.getByLabel('Display name').fill('Captain Coral-Wind 12345');
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await expect
          .poll(() =>
            page.evaluate(() => window.pirateBattle?.observe().hud.state),
          )
          .toBe('running');
        await page.evaluate(() => document.fonts.ready);
        for (const [width, height] of sizes) {
          await page.setViewportSize({ width, height });
          await expect
            .poll(() =>
              page.evaluate(() => {
                const state = window.pirateBattle?.observe();
                const host = document.querySelector(
                  '.arena-viewport',
                ) as HTMLElement;
                return (
                  state?.hud.state === 'running' &&
                  state.view?.width === host.clientWidth &&
                  state.view.height === host.clientHeight
                );
              }),
            )
            .toBe(true);
          const state = await page.evaluate(() => {
            const arena = document
              .querySelector('.arena-viewport')!
              .getBoundingClientRect();
            const targets = [
              ...document.querySelectorAll(
                '.controls button,.battle-hud,.captain,.hud-health,.hud-counter,.game-pause',
              ),
            ]
              .map((element) => element.getBoundingClientRect())
              .filter((rect) => rect.width > 0);
            const canvas = document.querySelector('canvas')!;
            // Measure future counter capacity without assigning a game score.
            const probe = new OffscreenCanvas(1, 1).getContext('2d')!;
            const compactHud =
              innerWidth <= 700 ||
              (innerHeight <= 480 && innerWidth > innerHeight);
            const countersFit =
              !compactHud ||
              [...document.querySelectorAll('.hud-counter')].every(
                (counter) => {
                  const value = counter.querySelector('strong')!;
                  const style = getComputedStyle(value);
                  const panelStyle = getComputedStyle(counter);
                  const panel = counter.getBoundingClientRect();
                  const slot = value.getBoundingClientRect();
                  const range = document.createRange();
                  range.selectNodeContents(value);
                  const text = range.getBoundingClientRect();
                  probe.font =
                    style.fontWeight +
                    ' ' +
                    style.fontSize +
                    ' ' +
                    style.fontFamily;
                  const futureWidth = probe.measureText(
                    counter.classList.contains('hud-score') ? '999' : '02:59',
                  ).width;
                  return (
                    slot.width + 0.5 >= futureWidth &&
                    text.left >=
                      panel.left + parseFloat(panelStyle.borderLeftWidth) + 4 &&
                    text.right <=
                      panel.right - parseFloat(panelStyle.borderRightWidth) - 4
                  );
                },
              );
            const view = window.pirateBattle!.observe().view!;
            const corners = [
              [0, 0],
              [1152, 0],
              [0, 640],
              [1152, 640],
            ].map(([x = 0, y = 0]) => ({
              x:
                view.x +
                ((x - 576) * Math.cos(view.angle) -
                  (y - 320) * Math.sin(view.angle)) *
                  view.scale,
              y:
                view.y +
                ((x - 576) * Math.sin(view.angle) +
                  (y - 320) * Math.cos(view.angle)) *
                  view.scale,
            }));
            return {
              overflow:
                document.documentElement.scrollWidth > innerWidth ||
                document.documentElement.scrollHeight > innerHeight,
              visible: targets.every(
                (r) =>
                  r.left >= 0 &&
                  r.top >= 0 &&
                  r.right <= innerWidth + 0.5 &&
                  r.bottom <= innerHeight + 0.5,
              ),
              touch: [...document.querySelectorAll('.weapons button')].every(
                (element) => {
                  const r = element.getBoundingClientRect();
                  return r.width >= 56 && r.height >= 56;
                },
              ),
              fitted: corners.every(
                (c) =>
                  c.x >= -0.1 &&
                  c.y >= -0.1 &&
                  c.x <= arena.width + 0.1 &&
                  c.y <= arena.height + 0.1,
              ),
              resolution:
                Math.abs(canvas.width / arena.width - devicePixelRatio) < 0.01,
              hudAtTop:
                document.querySelector('.battle-hud')!.getBoundingClientRect()
                  .bottom < 120,
              countersFit,
            };
          });
          expect(state, {
            message: width + '×' + height + ' at DPR ' + dpr,
          }).toEqual({
            overflow: false,
            visible: true,
            touch: true,
            fitted: true,
            resolution: true,
            hudAtTop: true,
            countersFit: true,
          });
          if (width === 412 && dpr === 3) {
            await page.locator('.battle-hud').screenshot({
              path: info.outputPath('mobile-hud.png'),
            });
          }
        }
        await page.screenshot({
          path: info.outputPath('layout-dpr-' + dpr + '.png'),
        });
      } finally {
        await context.close();
      }
    },
  );
}
