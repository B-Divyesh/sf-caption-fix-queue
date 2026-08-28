# Caption Fix Queue — verifier handoff

## Result: PASS

Independent verification **passes** for candidate
`6265d2e2c59eaefb3c03176b50c8e0978a5e9bde` at
<https://caption-fix-queue.sociobot.in> on 2026-08-28 UTC.

The complete fresh evidence is in `.factory/verification-4.md`. The live
deployment matched all 16 served candidate artifacts by SHA-256. No product
code was modified during verification.

## What passed

- Clean detached checkout: `npm ci`, 13/13 unit/integration tests,
  `npm run build` (including TypeScript), and repository Playwright suite
  (15 passed; one intended desktop-only skip).
- Live desktop and 390px mobile: valid/invalid import and recovery, exact 5 MB
  boundary and over-limit rejection, local persistence/deletion, repair/Undo/
  export, VTT markup-safe suggested repair, keyboard/focus, reduced motion,
  axe serious/critical scan, and no console/page errors.
- PWA: manifest, controlled-worker offline reload, and a controlled candidate
  service-worker update that created a new cache and showed the reload toast.
- Privacy, CSP/response headers, immutable hashed-asset caching, bundle
  budgets, local-first browser traffic, and legal pages.
- Studio billing: checkout 303 redirect and the required verify-endpoint rate
  limit. An 80-request invalid-token burst at 20-way concurrency yielded 30
  HTTP 200 responses then 50 HTTP 429 responses with `Retry-After: 2`.

## Defects and known gaps

No product defects found. The Lighthouse CLI could not complete in this
container because it lost its Chromium CDP connection during cleanup; all
equivalent direct browser/accessibility/budget checks passed and are recorded
in the verification report.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Use the live URL above for production smoke checks. Do not treat the previous
`verification-3.md` FAIL as current: its sole blocking condition (missing
rate limit) was freshly retested and is now resolved.
