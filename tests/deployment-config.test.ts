import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  it('ships immutable asset caching and browser isolation headers', async () => {
    const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as {
      globalHeaders: Record<string, string>;
      mimeTypes: Record<string, string>;
      responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
      routes: Array<{ route: string; rewrite?: string; headers?: Record<string, string> }>;
    };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain('https://api.sociobot.in');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/index.html');
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });
});
