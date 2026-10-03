import { expect, test, type Page } from '@playwright/test';
import { decodeRecord } from '../../src/data/contracts';
import { selectNetwork as condition, openDemoNetwork } from '../support/menu';
// Keep DOM/API/network failure evidence without recording every accelerated
// combat frame; those captures compete with software rendering in CI.
test.beforeEach(() => {
  test.setTimeout(process.env.CI ? 240000 : 60000);
});
test.use({ trace: { mode: 'retain-on-failure', screenshots: false } });
async function completed(page: Page) {
  await page.getByLabel('Display name').fill('Coral Captain');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const id = await page.evaluate(() => window.pirateBattle?.observe().matchId);
  await page.evaluate(() => window.pirateBattle?.advance(120000));
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  return id;
}
async function database(page: Page, name: string) {
  return page.evaluate(async (store) => {
    const request = indexedDB.open('pirate-battle:v1', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Read failed'));
    });
    const read = db.transaction(store).objectStore(store).getAll();
    const values = await new Promise<unknown[]>((resolve, reject) => {
      read.onsuccess = () => resolve(read.result as unknown[]);
      read.onerror = () => reject(new Error('Read failed'));
    });
    db.close();
    return values;
  }, name);
}
test('G10 ranking pagination, empty/failure/background states and keyboard tabs', async ({
  page,
}) => {
  await page.goto('/?clock=manual&seed=42');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Captain Flint');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Page 2 of 3');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Match History', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('tab', { name: 'Ranking', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tabpanel')).toContainText('Play a match');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await condition(page, 'empty');
  await expect(page.getByRole('tabpanel')).toContainText(
    'No battles with these rules',
  );
  await condition(page, 'http-400');
  await expect(page.getByRole('tabpanel').getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeEnabled();
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await condition(page, 'slow');
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText(
    /Updating|Loading/,
  );
  await expect(page.getByRole('tabpanel')).toContainText('Captain Flint', {
    timeout: 10000,
  });
});
test('G11 real completed match registers one record in both projections after refresh', async ({
  page,
}) => {
  await page.goto('/?clock=manual&seed=42');
  const id = await completed(page);
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  const records = (await database(page, 'records')).map(decodeRecord);
  expect(records.filter((record) => record.matchId === id)).toHaveLength(1);
  expect(await database(page, 'outbox')).toHaveLength(0);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Coral Captain');
  await expect(page.getByRole('tabpanel')).toContainText('Defeated');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Coral Captain');
});
test('G11 unavailable registration survives refresh and permits another match before recovery', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 240000 : 45000);
  await page.goto('/?clock=manual&seed=42');
  await condition(page, 'end-unavailable');
  const id = await completed(page);
  await expect.poll(async () => await database(page, 'outbox')).toHaveLength(1);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  expect(
    await page.evaluate(() => window.pirateBattle?.observe().matchId),
  ).not.toBe(id);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Leave match', exact: true }).click();
  await condition(page, 'success');
  await expect
    .poll(async () => await database(page, 'outbox'), { timeout: 15000 })
    .toHaveLength(0);
  expect(
    (await database(page, 'records'))
      .map(decodeRecord)
      .filter((record) => record.matchId === id),
  ).toHaveLength(1);
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Coral Captain');
});
test('G12 commit then timeout, refresh and repeated retry recover the original ID', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 240000 : 45000);
  await page.goto('/?clock=manual&seed=42');
  await condition(page, 'commit-timeout');
  const id = await completed(page);
  await expect
    .poll(async () => await database(page, 'records'))
    .toHaveLength(1);
  await expect.poll(async () => await database(page, 'outbox')).toHaveLength(1);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Match saved.', {
    timeout: 15000,
  });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await condition(page, 'out-of-order');
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Coral Captain');
  expect(
    (await database(page, 'records'))
      .map(decodeRecord)
      .filter((record) => record.matchId === id),
  ).toHaveLength(1);
  expect(await database(page, 'outbox')).toHaveLength(0);
});
test('G10 separate tab failures and reproducible multi-page history reset', async ({
  page,
}) => {
  await page.goto('/?clock=manual&seed=42');
  await completed(page);
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await condition(page, 'multiple-pages');
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Page 1 of 4');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Page 2 of 4');
  await condition(page, 'ranking-failure');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('tabpanel').getByRole('alert')).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Coral Captain');
  await openDemoNetwork(page);
  await page
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Reset matches', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText(
    'No completed battles',
  );
  expect(await database(page, 'records')).toHaveLength(0);
  await expect(
    page.getByRole('button', { name: 'Last result', exact: true }),
  ).toHaveCount(0);
  expect(await database(page, 'outbox')).toHaveLength(0);
});
test('G12 acknowledged browser queries cannot regress to a late pre-write read', async ({
  page,
}) => {
  // The CI trace measured 21.1s + 27.5s for the two real-rule battles.
  // Preserve the full post-write assertions and their normal wait budget.
  test.setTimeout(process.env.CI ? 300000 : 90000);
  await page.goto('/?clock=manual&seed=42');
  await completed(page);
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  let reads = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/ranking')) reads++;
  });
  await condition(page, 'out-of-order');
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await expect.poll(() => reads).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  const second = await completed(page);
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.locator('.records .your-record')).toHaveCount(2);
  await expect(page.getByRole('tabpanel')).toHaveAttribute(
    'data-revision',
    '2',
  );
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.locator('.records .your-record')).toHaveCount(2);
  expect(
    (await database(page, 'records'))
      .map(decodeRecord)
      .filter((record) => record.matchId === second),
  ).toHaveLength(1);
});

test('G10 scoped reset removes pending data before automatic Success recovery', async ({
  page,
}) => {
  await page.goto('/?clock=manual&seed=42');
  await condition(page, 'end-unavailable');
  await completed(page);
  await expect
    .poll(async () => (await database(page, 'outbox')).length)
    .toBe(1);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await openDemoNetwork(page);
  await page
    .getByRole('button', { name: 'Reset demo data', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Reset matches', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('radio', { name: 'Success', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Last result', exact: true }),
  ).toHaveCount(0);
  expect(await database(page, 'outbox')).toHaveLength(0);
  expect(await database(page, 'records')).toHaveLength(0);
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText(
    'No completed battles',
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible();
  expect(await database(page, 'outbox')).toHaveLength(0);
  expect(await database(page, 'records')).toHaveLength(0);
});
