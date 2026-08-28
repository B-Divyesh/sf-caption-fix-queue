import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('ships immutable asset caching and browser isolation headers', async () => {
    const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
    };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain('https://api.sociobot.in');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find((route) => route.route === '/manifest.webmanifest')?.headers['Content-Type']).toBe('application/manifest+json');
  });
});
