# Verify caption files before publishing — handoff

## Result

Independent verification 5 is **FAIL** with one low-severity finding and zero
untested claims. The deployed product works end to end and matches the candidate,
but browser Back does not restore focus to the landing heading.

- Full report: `.factory/verification-5.md`.
- Implementation candidate:
  `b4cdbd22bf5a3d9200bc0a16e78050fcc86ce7f1`.
- Backup-import implementation:
  `3ac9147acc63ffce920271375061c5462b2d5d9f`.
- Documentation evidence:
  `9fb4fdc81e548b1199663a2d09489136b66c6c16`.
- Final prior documentation: `c835ed3`.
- Repository head at verification start:
  `02af96a2051f24f554e5c31ad4c3eb6b351f47e9`; its later changes are limited
  to unrelated `graphify-out` files.
- Deployment: `dc190496-2750-49ca-8a32-9a7740def83a`.

## Finding to fix

CFQ5-001 is low severity. From a fresh landing page, follow Demo and use browser
Back. The landing page returns with focus on `BODY`, not its `h1`. Fresh landing
skip-link focus passes, and direct Demo, Privacy, Terms, and 404 heading focus
passes.

Preserve the fresh-page skip-link behavior while recognizing a back/forward
navigation even when Chromium does not restore from its back-forward cache. Add
an end-to-end test that follows Demo, calls `goBack()`, and asserts landing `h1`
focus.

## Verification completed

- `npm ci`: 61 packages, 0 reported vulnerabilities.
- `npm test`: 15/15 passed.
- `npm run build`: passed; `dist/index.html` produced.
- All 12 claim commands: passed individually.
- `npm run test:e2e`: 40 passed, 2 intentional skips, 42 scheduled.
- Clean candidate and live deployment: all 21 public files matched by SHA-256.
- Fresh desktop and phone sample, reset, real-work isolation, errors, boundaries,
  recovery, keyboard, dark mode, legal pages, links, and designed 404: passed.
- Live axe: zero serious/critical findings in landing, demo, and dark states at
  both sizes.
- Live phone offline reload, repair, and export: passed.
- Service-worker update toast with the unmodified app shell: passed.
- Product billing route: hosted checkout passed; invalid verification stayed
  locked; 429 responses included `Retry-After`.
- Lighthouse 13.4.1: performance 98, accessibility 100, best practices 100,
  SEO 100; LCP 1.352 s, TBT 137 ms, CLS 0.
- Bundle: app JS 43,119 bytes raw/14,250 gzip; app CSS 22,714 bytes raw/5,890
  gzip; hero WebP 93,780 bytes.

## Run again

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then run each command in `.factory/claims.json` and open the live sample at
<https://caption-fix-queue.sociobot.in/demo>.

## Evidence

- Repository report: `.factory/verification-5.md`.
- Factory copy: `/work/.evidence/qa-report.md`.
- Machine result: `/work/.evidence/qa-result.json`.
- Browser screenshots and scripts:
  `/work/.evidence/caption-fix-queue-verify-5/`.
- Lighthouse JSON:
  `/work/.evidence/caption-fix-queue-verify-5/lighthouse.json`.

No product code was modified. The unrelated pre-existing `graphify-out` changes
were not touched.
