import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('sample runs through repair and export without serious accessibility issues', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Find caption lines/i);
  const emptyResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(emptyResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('garden-workshop');
  await expect(page.getByText(/to review/).first()).toBeVisible();
  await page.getByRole('button', { name: /Repair text/ }).click();
  const editor = page.getByLabel('Caption text', { exact: true });
  await editor.fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  await expect(page.getByText(/Repair saved/)).toBeVisible();
  const workResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(workResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Use dark theme' }).click();
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

test('Studio offers the configured hosted checkout route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Studio', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Buy Studio — $19' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/caption-fix-queue/checkout');
  await expect(page.getByRole('button', { name: 'Restore purchase' })).toBeVisible();
});

test('an unverified restored token remains locked while verification is offline', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Studio', exact: true }).click();
  await page.getByLabel('Have a license? Paste it here').fill('not-a-real-license');
  await page.route('https://api.sociobot.in/api/v1/products/caption-fix-queue/verify?license=not-a-real-license', async (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not reach the license service');
  await expect(page.getByRole('button', { name: 'Studio active' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Buy Studio — $19' })).toBeVisible();
  await expect(page.evaluate(() => localStorage.getItem('sb_license_verdict:caption-fix-queue'))).resolves.toBeNull();
});

test('repair Undo restores the original caption in the exported SRT', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await page.getByRole('button', { name: /Repair text/ }).click();
  await page.getByLabel('Caption text', { exact: true }).fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Repair undone.')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  expect(await (await download).createReadStream().then(async (stream) => {
    let value = '';
    for await (const chunk of stream ?? []) value += chunk.toString();
    return value;
  })).toContain('Welcome to our our garden workshop.');
});

test('suggested WebVTT repair keeps voice markup, cue identifier, and settings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Paste captions' }).click();
  await page.getByLabel('File name').fill('voice.vtt');
  await page.getByLabel('SRT or WebVTT captions').fill('WEBVTT\n\nintro\n00:00.000 --> 00:02.000 line:90%\n<v MARA>Hello hello</v>');
  await page.getByRole('button', { name: 'Check pasted captions' }).click();
  await page.getByRole('button', { name: /Suggested fix/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export unchanged VTT/ }).click();
  expect(await (await download).createReadStream().then(async (stream) => {
    let value = '';
    for await (const chunk of stream ?? []) value += chunk.toString();
    return value;
  })).toContain('intro\n00:00:00.000 --> 00:00:02.000 line:90%\n<v MARA>Hello</v>');
});

test('mobile navigation targets meet the 44px contract and Undo toast stays opaque', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, 'This regression is specific to the 390px layout.');
  await page.goto('/');
  for (const locator of [page.getByRole('link', { name: /Caption Fix Queue home/ }), page.getByRole('button', { name: 'Use dark theme' }), page.getByRole('link', { name: 'Privacy' }), page.getByRole('link', { name: 'Terms' }), page.locator('#studio-section-button'), page.locator('#footer-studio')]) {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  const toast = page.locator('.toast');
  await expect(toast).toBeVisible();
  expect(await toast.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
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

test('direct demo and unknown routes have distinct metadata and recovery UI', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Caption Fix Queue');
  await expect(page.getByText('Demo — sample data, nothing is saved to your workspace')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://caption-fix-queue.sociobot.in/demo');

  await page.goto('/a-specimen-that-does-not-exist');
  await expect(page).toHaveTitle('Page not found — Caption Fix Queue');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not in the field guide');
  await expect(page.getByRole('link', { name: 'Open the checker' })).toHaveAttribute('href', '/');
});

test('legal routes focus their h1 and expose 44px links on mobile', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, 'This regression is specific to the 390px layout.');
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toBeFocused();
  for (const locator of [page.getByRole('link', { name: 'privacy@sociobot.in' }), page.getByRole('link', { name: 'Demo' }).first()]) {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/terms/');
  await expect(page.locator('h1')).toBeFocused();
  const support = await page.getByRole('link', { name: 'support@sociobot.in' }).boundingBox();
  expect(support?.height).toBeGreaterThanOrEqual(44);
});
