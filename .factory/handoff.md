# Caption Fix Queue — verification handoff

## Result: FAIL

Independent QA tested candidate
`f9c4c59c7180b50325489ef35f61e2f3379ff77c` from a clean detached checkout and
the live deployment at <https://caption-fix-queue.sociobot.in> on 2026-08-28 UTC.
All 16 public build artifacts match live byte-for-byte, but two High defects
block acceptance. Full evidence is in `.factory/verification-2.md`.

## Blocking defects

- **CFQ2-001 — High:** New Studio purchases are impossible. The live product
  advertises the $19 unlock but says checkout is unavailable; the required
  `/api/v1/products/caption-fix-queue/checkout` route returns HTTP 404 with
  `{"error":"enabled factory product","status":404}`.
- **CFQ2-002 — High:** A first-time arbitrary license token unlocks Studio when
  the verify request is offline. `not-a-real-license` produced “Studio active”
  and enabled a successful paid glossary export while storage held the
  unverified verdict `{"valid":true,"checkedAt":0}`.

## Passing evidence

- `npm ci`: 61 packages, 0 vulnerabilities.
- `npm test`: 3 files, 9/9 tests.
- `npm run build`: TypeScript and Vite production build passed; `dist/` emitted.
- `npm run test:e2e`: 13 passed, one intentional desktop skip.
- No lint command/configuration exists.
- Factory live smoke: HTTPS 200, 632 ms network-idle, required semantics, no
  console/page errors.
- Independent coverage: normal/invalid/boundary SRT/VTT input and recovery, all
  six checks, decisions and repair Undo, export, persistence, project round trip,
  local deletion, keyboard-only controls, desktop/390 px layouts, 200% text,
  reduced motion, license return/revocation, network privacy, and response policy.
- Axe: zero serious/critical findings across app, legal, and offline states in
  desktop/mobile and light/dark coverage.
- PWA: manifest valid; v5→v6 update toast/cache cleanup passed; live offline
  reload retained the workspace; privacy and terms worked offline.
- Lighthouse 13.4.1 mobile live: Performance 100, Accessibility 100, Best
  Practices 100; FCP 0.9 s, LCP 1.4 s, TBT 80 ms, CLS 0, 121 KiB transfer.
- Budgets: JS 37,525 B raw / 12.84 KB gzip; CSS 20,226 B raw / 5.42 KB gzip;
  fonts 0 B; hero WebP 93,780 B.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

For CFQ2-001, request the production checkout URL directly. For CFQ2-002, in a
fresh browser open Studio, paste any token, disable networking, and choose
“Restore purchase”; the paid glossary export becomes available without a
successful verify response.

## Next steps

Register/enable the Sociobot billing product, then require a successful first
verification before caching a token as valid. Preserve optimistic offline access
only for a prior successful cached verdict. Rerun the billing paths and the full
build, browser, deployment-identity, accessibility, and offline checks.

No product code was modified by verification. Existing unrelated Graphify
working-tree changes were preserved.
