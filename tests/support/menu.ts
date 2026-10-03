import { expect, type Page } from '@playwright/test';
import { SCENARIOS, type ScenarioId } from '../../src/mocks/scenarios';

export async function openDemoNetwork(page: Page) {
  const back = page.getByRole('button', { name: 'Main Menu', exact: true });
  if (await back.isVisible()) await back.click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('tab', { name: 'Demo Network', exact: true }).click();
}

export async function selectNetwork(page: Page, value: ScenarioId) {
  const log = page.locator('.captain-log.expanded');
  const selected = (await log.isVisible())
    ? (await log.getByRole('tab', { selected: true }).textContent())?.trim()
    : null;
  await openDemoNetwork(page);
  await page
    .getByRole('radio', { name: SCENARIOS[value], exact: true })
    .check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  if (selected)
    await page.getByRole('tab', { name: selected, exact: true }).click();
}
