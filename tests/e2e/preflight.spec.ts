import { expect, test } from '@playwright/test';

test('the browser build boots with its mock worker and supplied asset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible();
  await expect(page.getByAltText('Jungle Gaming')).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByAltText('Jungle Gaming')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL),
    )
    .toContain('/mockServiceWorker.js');

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(horizontalOverflow).toBe(false);
  expect(errors).toEqual([]);
});
