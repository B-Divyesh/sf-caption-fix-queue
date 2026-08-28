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

test('Studio offers the configured hosted checkout route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Studio' }).click();
  await expect(page.getByRole('link', { name: 'Buy Studio securely' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/caption-fix-queue/checkout');
  await expect(page.getByRole('button', { name: 'Restore purchase' })).toBeVisible();
});

test('an unverified restored token remains locked while verification is offline', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get Studio' }).click();
  await page.getByLabel('Have a license? Paste it here').fill('not-a-real-license');
  await page.route('https://api.sociobot.in/api/v1/products/caption-fix-queue/verify?license=not-a-real-license', async (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not reach the license service');
  await expect(page.getByRole('button', { name: 'Studio active' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Buy Studio securely' })).toBeVisible();
  await expect(page.evaluate(() => localStorage.getItem('sb_license_verdict:caption-fix-queue'))).resolves.toBeNull();
});

test('repair Undo restores the original caption in the exported SRT', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try a sample' }).click();
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
  for (const locator of [page.getByRole('link', { name: /Caption Fix Queue home/ }), page.getByRole('button', { name: 'Change color theme' }), page.getByRole('link', { name: 'Privacy' }), page.getByRole('link', { name: 'Terms' }), page.getByRole('button', { name: 'Studio', exact: true })]) {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'Try a sample' }).click();
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
