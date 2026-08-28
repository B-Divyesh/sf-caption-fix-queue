import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('sample runs through repair and export without serious accessibility issues', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Find the few lines/i);
  const emptyResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(emptyResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('garden-workshop');
  await expect(page.getByText(/to review/).first()).toBeVisible();
  await page.getByRole('button', { name: /Repair text/ }).click();
  const editor = page.getByLabel('Caption text', { exact: true });
  await editor.fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  await expect(page.getByText(/Repair saved/)).toBeVisible();
  const workResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(workResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Change color theme' }).click();
  const darkResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(darkResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('garden-workshop');
  expect(errors).toEqual([]);
});

test('invalid paste explains how to recover', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Paste captions' }).click();
  await page.getByLabel('SRT or WebVTT captions').fill('This is not a caption file.');
  await page.getByRole('button', { name: 'Check pasted captions' }).click();
  await expect(page.getByRole('alert')).toContainText('without a timing line');
});

test('installed shell reloads offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const shell = keys.find((key) => key.includes('shell'));
    if (!shell) return false;
    const requests = await (await caches.open(shell)).keys();
    return requests.some((request) => request.url.includes('/assets/main-') && request.url.endsWith('.js'));
  }, undefined, { timeout: 15_000 });
  // Re-open once under the installed worker, matching a returning/offline session.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Offline');
});
