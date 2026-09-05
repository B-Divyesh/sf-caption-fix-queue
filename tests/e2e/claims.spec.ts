import { expect, test, type Download, type Page } from '@playwright/test';
import { runChecks } from '../../src/checks';
import { parseCaptions } from '../../src/parser';

const ORIGIN = 'http://127.0.0.1:4173';
const SAMPLE_REPEAT = 'Welcome to our our garden workshop.';

async function downloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  let value = '';
  for await (const chunk of stream ?? []) value += chunk.toString();
  return value;
}

async function readWorkspace(page: Page, databaseName: string): Promise<string | null> {
  return page.evaluate(async (name) => new Promise<string | null>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('workspace')) { database.close(); resolve(null); return; }
      const transaction = database.transaction('workspace', 'readonly');
      const get = transaction.objectStore('workspace').get('current');
      get.onsuccess = () => resolve(get.result ? JSON.stringify(get.result) : null);
      get.onerror = () => reject(get.error);
      transaction.oncomplete = () => database.close();
    };
  }), databaseName);
}

async function unlockStudio(page: Page): Promise<void> {
  await page.route('https://api.sociobot.in/api/v1/products/caption-fix-queue/verify?license=claim-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await page.getByRole('button', { name: 'View Studio', exact: true }).click();
  await page.getByLabel('Have a license? Paste it here').fill('claim-license');
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await expect(page.getByText('Studio restored on this device.')).toBeVisible();
}

test('@claim:demo-isolation demo reset and exit never alter the real workspace', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'real-team-captions.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:01,000 --> 00:00:03,000\nReal team caption.\n') });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('real-team-captions');
  await expect.poll(() => readWorkspace(page, 'caption-fix-queue')).not.toBeNull();
  const before = await readWorkspace(page, 'caption-fix-queue');

  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved to your workspace')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('garden-workshop-sample');
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.finding-row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(`${ORIGIN}/`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('real-team-captions');
  expect(await readWorkspace(page, 'caption-fix-queue')).toBe(before);
  expect(await readWorkspace(page, 'demo:caption-fix-queue')).toBeNull();
});

test('@claim:local-processing demo content stays in-browser with no third-party runtime resources', async ({ page }) => {
  const requests: Array<{ url: string; method: string; body: string | null }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /Repair text/ }).click();
  await page.getByLabel('Caption text', { exact: true }).fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  await page.locator('#glossary-button').click();
  await page.getByLabel('Preferred spelling').fill('garden-workshop');
  await page.getByLabel('Variants to flag').fill('garden workshop');
  await page.getByRole('button', { name: 'Add term' }).click();
  await expect(page.locator('.glossary-list')).toContainText('garden-workshop');
  await page.getByRole('button', { name: 'Close glossary' }).click();
  await expect(page.locator('.finding-row')).toHaveCount(6);
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  await downloadText(await downloadPromise);
  await page.reload();
  expect(requests.every((request) => new URL(request.url).origin === ORIGIN)).toBe(true);
  expect(requests.every((request) => !request.body?.includes('garden workshop'))).toBe(true);
  expect(await readWorkspace(page, 'caption-fix-queue')).toBeNull();
  expect(await readWorkspace(page, 'demo:caption-fix-queue')).not.toBeNull();
});

test('@claim:six-checks the seven-cue sample exposes all six finding kinds with reasons, evidence, and nearby context', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.locator('.workspace-head')).toContainText('7 cues');
  await expect(page.locator('.finding-row')).toHaveCount(6);
  const labels = await page.locator('.finding-row small').allTextContents();
  for (const label of ['Repeat', 'Blank run', 'Character', 'Reading speed', 'Speaker', 'Glossary']) expect(labels.some((value) => value.includes(label))).toBe(true);
  for (const button of await page.locator('.finding-row').all()) {
    await button.click();
    await expect(page.getByText('Why this was flagged')).toBeVisible();
    await expect(page.locator('.explanation p')).not.toBeEmpty();
    await expect(page.locator('.explanation span')).not.toBeEmpty();
  }

  const sampleFindings = page.locator('.finding-row');
  await sampleFindings.nth(0).click();
  await expect(page.locator('.cue-card.neighbor')).toHaveCount(1);
  await sampleFindings.nth(3).click();
  await expect(page.locator('.cue-card.neighbor')).toHaveCount(2);
  await sampleFindings.nth(5).click();
  await expect(page.locator('.cue-card.neighbor')).toHaveCount(2);

  const check = (body: string, glossary: Array<{ id: string; preferred: string; variants: string[] }> = []) =>
    runChecks(parseCaptions(body, 'boundary.srt'), glossary);
  const cue = (text: string, end = '00:00:02,000') => `1\n00:00:00,000 --> ${end}\n${text}\n`;
  expect(check(cue('Yes yes.')).some((finding) => finding.kind === 'repeat')).toBe(true);
  expect(check(`${cue('Same line.')}\n2\n00:00:02,100 --> 00:00:04,000\nSame line.\n`).some((finding) => finding.kind === 'repeat')).toBe(true);
  expect(check(cue('   ')).some((finding) => finding.kind === 'blank')).toBe(true);
  expect(check(cue('Hidden\u200B mark.')).some((finding) => finding.kind === 'character')).toBe(true);
  expect(check(cue('Joined\u200Cword.')).some((finding) => finding.kind === 'character')).toBe(false);
  expect(check(cue('x'.repeat(40))).some((finding) => finding.kind === 'speed')).toBe(false);
  expect(check(cue('x'.repeat(41))).some((finding) => finding.kind === 'speed')).toBe(true);
  expect(check(cue('x'.repeat(42), '00:00:10,000')).some((finding) => finding.kind === 'speed')).toBe(false);
  expect(check(cue('x'.repeat(43), '00:00:10,000')).some((finding) => finding.kind === 'speed')).toBe(true);
  expect(check(cue('one\ntwo', '00:00:10,000')).some((finding) => finding.kind === 'speed')).toBe(false);
  expect(check(cue('one\ntwo\nthree', '00:00:10,000')).some((finding) => finding.kind === 'speed')).toBe(true);
  const speakers = check(`${cue('MARA: Hello.')}\n2\n00:00:02,100 --> 00:00:04,000\nMARRA: Hello.\n\n3\n00:00:04,100 --> 00:00:06,000\nJOSEPH: Hello.\n`);
  expect(speakers.filter((finding) => finding.kind === 'speaker')).toHaveLength(1);
  expect(check(cue('Use bio-char.'), [{ id: 'bio', preferred: 'biochar', variants: ['bio-char'] }]).some((finding) => finding.kind === 'glossary')).toBe(true);
});

test('@claim:explicit-repairs export remains unchanged until a reviewer chooses a repair', async ({ page }) => {
  await page.goto('/?demo=1');
  let downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  expect(await downloadText(await downloadPromise)).toContain(SAMPLE_REPEAT);
  await page.getByRole('button', { name: /Repair text/ }).click();
  await page.getByLabel('Caption text', { exact: true }).fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  const repaired = await downloadText(await downloadPromise);
  expect(repaired).toContain('Welcome to our garden workshop.');
  expect(repaired).not.toContain(SAMPLE_REPEAT);
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  await page.getByRole('button', { name: /Dismiss flag/ }).click();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  const decided = await downloadText(await downloadPromise);
  expect(decided).toContain('MARA: Today we plant native seeds.');
  expect(decided).toContain('This demonstration moves quickly');
});

test('@claim:offline-demo demo reload, repair, and export work offline after one visit', async ({ page, context }) => {
  await page.goto('/?demo=1');
  const manifest = await page.evaluate(async () => fetch('/manifest.webmanifest').then((response) => response.json()) as Promise<{ display: string; icons: unknown[] }>);
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 15_000 });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Offline');
  await page.getByRole('button', { name: /Repair text/ }).click();
  await page.getByLabel('Caption text', { exact: true }).fill('Welcome to our garden workshop.');
  await page.getByRole('button', { name: 'Save repair' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  expect(await downloadText(await downloadPromise)).toContain('Welcome to our garden workshop.');
});

test('@claim:format-roundtrip SRT, WebVTT metadata, and populated JSON project backups import and export', async ({ page, browser }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'roundtrip.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:01,000 --> 00:00:03,000\nSRT line.\n') });
  let downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  expect(await downloadText(await downloadPromise)).toContain('00:00:01,000 --> 00:00:03,000\nSRT line.');

  await page.getByRole('button', { name: 'More document actions' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Review another file' }).click();
  const vtt = 'WEBVTT - Workshop\n\nNOTE local note\n\nSTYLE\n::cue { color: white; }\n\nREGION\nid:lower\n\nintro\n00:00:01.000 --> 00:00:03.000 align:start\n<v Mara>Hello hello</v>\n';
  await page.locator('#file-input').setInputFiles({ name: 'roundtrip.vtt', mimeType: 'text/vtt', buffer: Buffer.from(vtt) });
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export VTT/ }).click();
  const output = await downloadText(await downloadPromise);
  for (const fragment of ['WEBVTT - Workshop', 'NOTE local note', 'STYLE', 'REGION', 'intro', 'align:start', '<v Mara>Hello hello</v>']) expect(output).toContain(fragment);
  await page.locator('#glossary-button').click();
  await page.getByLabel('Preferred spelling').fill('coriander');
  await page.getByLabel('Variants to flag').fill('cilantro');
  await page.getByRole('button', { name: 'Add term' }).click();
  await expect(page.locator('.glossary-list')).toContainText('coriander');
  await page.getByRole('button', { name: 'Close glossary' }).click();
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  await expect(page.locator('.progress-strip strong').nth(1)).toHaveText('1');
  await page.getByRole('button', { name: 'More document actions' }).click();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project backup' }).click();
  const backupText = await downloadText(await downloadPromise);
  const backup = JSON.parse(backupText) as { version: number; document: { format: string }; glossary: Array<{ preferred: string }>; statuses: Record<string, string>; history: Array<{ action: string }> };
  expect(backup.version).toBe(1);
  expect(backup.document.format).toBe('vtt');
  expect(backup.glossary.some((entry) => entry.preferred === 'coriander')).toBe(true);
  expect(Object.values(backup.statuses)).toContain('accepted');
  expect(backup.history).toHaveLength(1);

  const restoredContext = await browser.newContext();
  const restoredPage = await restoredContext.newPage();
  await restoredPage.route('https://api.sociobot.in/api/v1/products/caption-fix-queue/verify?license=claim-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await restoredPage.goto('/');
  await restoredPage.locator('#file-input').setInputFiles({ name: 'roundtrip.caption-fix.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
  await expect(restoredPage.getByRole('heading', { level: 1 })).toContainText('roundtrip.vtt');
  await expect(restoredPage.locator('.workspace-head')).toContainText('1 cues · VTT');
  await expect(restoredPage.locator('.progress-strip strong').nth(1)).toHaveText('1');
  await restoredPage.locator('#glossary-button').click();
  await expect(restoredPage.locator('.glossary-list')).toContainText('coriander');
  await restoredPage.getByRole('button', { name: 'Close glossary' }).click();
  downloadPromise = restoredPage.waitForEvent('download');
  await restoredPage.locator('#export-button').click();
  const restoredVtt = await downloadText(await downloadPromise);
  for (const fragment of ['WEBVTT - Workshop', 'NOTE local note', 'STYLE', 'REGION', 'intro', 'align:start', '<v Mara>Hello hello</v>']) expect(restoredVtt).toContain(fragment);
  await unlockStudio(restoredPage);
  await restoredPage.getByRole('button', { name: 'More document actions' }).click();
  downloadPromise = restoredPage.waitForEvent('download');
  await restoredPage.getByRole('button', { name: 'Export team history' }).click();
  const restoredHistory = await downloadText(await downloadPromise);
  expect(restoredHistory).toContain('"roundtrip.vtt"');
  expect(restoredHistory).toContain('"accepted"');
  await restoredContext.close();
});

test('@claim:local-persistence captions, glossary, decisions, and history persist and can be deleted', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'saved.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('1\n00:00:01,000 --> 00:00:03,000\nYes yes.\n') });
  await page.locator('#glossary-button').click();
  await page.getByLabel('Preferred spelling').fill('caption');
  await page.getByLabel('Variants to flag').fill('captioning');
  await page.getByRole('button', { name: 'Add term' }).click();
  await page.getByRole('button', { name: 'Close glossary' }).click();
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  await expect.poll(async () => {
    const saved = await readWorkspace(page, 'caption-fix-queue');
    return saved ? Object.values((JSON.parse(saved) as { statuses?: Record<string, string> }).statuses ?? {}) : [];
  }).toContain('accepted');
  await page.reload();
  const persisted = JSON.parse((await readWorkspace(page, 'caption-fix-queue')) ?? '{}') as { document?: unknown; glossary?: unknown[]; statuses?: Record<string, string>; history?: unknown[] };
  expect(persisted.document).toBeTruthy();
  expect(persisted.glossary?.length).toBe(2);
  expect(Object.values(persisted.statuses ?? {})).toContain('accepted');
  expect(persisted.history?.length).toBe(1);
  await page.getByRole('button', { name: 'More document actions' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete local workspace' }).click();
  await expect.poll(() => readWorkspace(page, 'caption-fix-queue')).toBeNull();
});

test('@claim:shared-glossary a verified Studio glossary transfers between fresh browsers', async ({ browser }) => {
  const first = await browser.newContext();
  const page = await first.newPage();
  await page.goto(`${ORIGIN}/?demo=1`);
  await unlockStudio(page);
  await page.locator('#glossary-button').click();
  await page.getByLabel('Preferred spelling').fill('WebVTT');
  await page.getByLabel('Variants to flag').fill('Web VTT');
  await page.getByRole('button', { name: 'Add term' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export glossary JSON' }).click();
  const buffer = Buffer.from(await downloadText(await downloadPromise));
  await first.close();

  const second = await browser.newContext();
  const secondPage = await second.newPage();
  await secondPage.goto(`${ORIGIN}/?demo=1`);
  await unlockStudio(secondPage);
  await secondPage.locator('#glossary-button').click();
  await secondPage.locator('#glossary-import').click();
  await secondPage.locator('#glossary-file').setInputFiles({ name: 'caption-glossary.json', mimeType: 'application/json', buffer });
  await expect(secondPage.locator('.glossary-list')).toContainText('WebVTT');
  await second.close();
});

test('@claim:studio-contract Studio is $19 once for one reviewer and exports licensed history while core exports stay free', async ({ page }) => {
  let verifyRequests = 0;
  await page.route('https://api.sociobot.in/api/v1/products/caption-fix-queue/verify?license=claim-license', (route) => { verifyRequests += 1; return route.fulfill({ json: { valid: true, reason: 'ok' } }); });
  await page.goto('/?demo=1');
  let downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export SRT/ }).click();
  expect(await downloadText(await downloadPromise)).toContain(SAMPLE_REPEAT);
  await page.getByRole('button', { name: 'More document actions' }).click();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project backup' }).click();
  expect(JSON.parse(await downloadText(await downloadPromise)).version).toBe(1);
  await page.getByRole('button', { name: 'View Studio', exact: true }).click();
  await expect(page.getByText('$19', { exact: true })).toBeVisible();
  await expect(page.getByText(/once · one reviewer license/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Studio — $19' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/caption-fix-queue/checkout');
  await page.getByRole('link', { name: 'purchase terms' }).click();
  await expect(page).toHaveURL(`${ORIGIN}/terms/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
  await expect(page.getByText('Sociobot/Dodo handles payment and refunds.')).toBeVisible();
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'View Studio', exact: true }).click();
  await page.getByLabel('Have a license? Paste it here').fill('claim-license');
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await page.getByRole('button', { name: /Accept as-is/ }).click();
  await page.getByRole('button', { name: 'More document actions' }).click();
  downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export team history' }).click();
  const csv = await downloadText(await downloadPromise);
  expect(csv).toContain('"document","cue_id","finding","action","timestamp"');
  expect(csv).toContain('"garden-workshop-sample.srt"');
  await page.reload();
  expect(verifyRequests).toBe(1);
});

test('@claim:review-scope the product identifies itself as a review aid, not transcription or certification', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('These checks can miss problems or flag acceptable text.')).toBeVisible();
  await expect(page.getByText('They do not certify accessibility.')).toBeVisible();
  await expect(page.getByText('The checker does not create transcripts or host video.')).toBeVisible();
  await expect(page.locator('input[type="video"], input[accept*="video"], video')).toHaveCount(0);
  await page.goto('/?demo=1');
  await expect(page.getByText('Why this was flagged')).toBeVisible();
  await expect(page.getByText(/certified|guaranteed/i)).toHaveCount(0);
});
