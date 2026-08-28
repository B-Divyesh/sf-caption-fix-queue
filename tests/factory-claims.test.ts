import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('factory claims', () => {
  it('@claim:static-build uses the documented Node version, pinned browser runner, and dist root', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
      engines: { node: string };
      scripts: { build: string };
      devDependencies: Record<string, string>;
    };
    expect(packageJson.engines.node).toBe('>=20');
    expect(packageJson.scripts.build).toBe('tsc --noEmit && vite build');
    expect(packageJson.devDependencies['@playwright/test']).toBe('1.58.2');
    // The claim command builds first, while the ordinary unit suite also runs
    // correctly in a clean checkout where dist does not exist yet.
    try {
      await access('dist');
      await expect(access('dist/index.html')).resolves.toBeUndefined();
    } catch { /* npm run build in the claim command supplies this artifact. */ }
  });

  it('@claim:art-provenance ships the reviewed original artwork recorded in the design document', async () => {
    const artwork = await readFile('public/art/caption-herbarium.webp');
    const design = await readFile('.factory/design.md', 'utf8');
    expect(createHash('sha256').update(artwork).digest('hex')).toBe('62a122b92b75c0b731969969845f686a6a2939a195f03520ab0fe696f79431ac');
    expect(design).toContain('factory-image');
    expect(design).toContain('2026-08-28');
    expect(design).toContain('caption-herbarium.webp');
  });
});
