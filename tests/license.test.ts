import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedUnlock, captureReturnedLicense, saveLicense, storedLicense, verifyLicense } from '../src/license';

const tokenKey = 'sb_license:caption-fix-queue';
const verdictKey = 'sb_license_verdict:caption-fix-queue';

function installBrowser(url = 'https://caption-fix-queue.sociobot.in/') {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; }
  } as Storage;
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', { location: { href: url } });
  vi.stubGlobal('history', { replaceState: vi.fn() });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe('Studio license authorization', () => {
  it('does not unlock a newly pasted token when its first verification is offline', async () => {
    const values = installBrowser();
    saveLicense('not-a-real-license');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(verifyLicense(true)).resolves.toEqual({ valid: false, reason: 'offline' });
    expect(storedLicense()).toBe('not-a-real-license');
    expect(cachedUnlock()).toBe(false);
    expect(values.has(verdictKey)).toBe(false);
  });

  it('keeps a previously verified token available during an offline recheck', async () => {
    const values = installBrowser();
    values.set(tokenKey, 'verified-token');
    values.set(verdictKey, JSON.stringify({ valid: true, checkedAt: Date.now() - 86_400_001 }));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(verifyLicense()).resolves.toEqual({ valid: true, reason: 'offline' });
    expect(cachedUnlock()).toBe(true);
  });

  it('caches a successful verification so the same token can work offline later', async () => {
    const values = installBrowser();
    saveLicense('verified-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: true, reason: 'ok' }) }));

    await expect(verifyLicense(true)).resolves.toMatchObject({ valid: true, reason: 'ok' });
    expect(cachedUnlock()).toBe(true);
    expect(JSON.parse(values.get(verdictKey) ?? '{}')).toMatchObject({ valid: true, reason: 'ok' });
  });

  it('strips a returned token but waits for verification before unlocking', () => {
    const values = installBrowser('https://caption-fix-queue.sociobot.in/?license=return-token&from=checkout');
    values.set(verdictKey, JSON.stringify({ valid: true, checkedAt: Date.now() }));

    captureReturnedLicense();

    expect(storedLicense()).toBe('return-token');
    expect(cachedUnlock()).toBe(false);
    expect(history.replaceState).toHaveBeenCalledWith({}, '', '/?from=checkout');
  });
});
