const SLUG = 'caption-fix-queue';
const API_BASE = import.meta.env.VITE_BILLING_API || 'https://api.sociobot.in/api/v1';
const CHECKOUT_ENABLED = import.meta.env.VITE_STUDIO_CHECKOUT_ENABLED === 'true';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;

interface CachedVerdict { valid: boolean; checkedAt: number; reason?: string }

export function checkoutUrl(): string {
  return `${API_BASE}/products/${SLUG}/checkout`;
}

/** Checkout is opt-in at build time after the factory has enabled the product. */
export function studioCheckoutAvailable(): boolean {
  return CHECKOUT_ENABLED;
}

export function captureReturnedLicense(): void {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storedLicense(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function saveLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
}

export function cachedUnlock(): boolean {
  if (!storedLicense()) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as CachedVerdict;
    return cached.valid !== false;
  } catch { return true; }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason?: string }> {
  const token = storedLicense();
  if (!token) return { valid: false, reason: 'missing' };
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as CachedVerdict;
    if (!force && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return cached;
  } catch { /* verify below */ }
  try {
    const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verify unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return { valid: cachedUnlock(), reason: 'offline' };
  }
}
