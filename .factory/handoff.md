# Caption Fix Queue — review 1 handoff

## Result: FAIL

Completed the adversarial first-read review against the live deployment and clean commit `b561ed8d8d2be94867b17b1320d56101d16c52d1`. Full evidence and rewrites are in `.factory/review-1.md`. No product code was changed.

## What was verified

- Cold first screens at 390 × 844 and 1440 × 900
- Landing and README copy, terminology, headings, controls, word counts, and claims
- Sample entry, seeded state, persistence namespace, real-data isolation, and reset/exit controls
- Live offline reload and request interception
- Titles, metadata, favicon, routes, 404 behavior, browser Back/focus, links, headers, and site skeleton
- Live accessibility scans in mobile/desktop and light/dark states
- Clean clone: `npm ci`, `npm test`, `npm run build`, and `npm run test:e2e`

Clean-clone results: 13 unit tests passed; build passed; Playwright reported 15 passed and one intended skip. The factory URL verifier passed.

## Blocking gaps

1. The first screen never names the intended user.
2. “Try a sample” writes into the real IndexedDB workspace and can overwrite real work; there is no demo banner, Reset, Start for real, `/demo` state, or `.factory/demo.md`.
3. `.factory/claims.json` and all `@claim:` tests are missing despite extensive live and README claims.
4. `/demo` and unknown paths render the normal landing page; there is no designed 404.

Additional findings cover missing canonical/social metadata, robots/sitemap/apple icon, incomplete landing structure, inconsistent route chrome, missing focus transfer, undersized legal links, and specific copy rewrites.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then follow `.factory/review-1.md`, especially the real-data isolation sequence in B02. The highest-priority next step is an isolated `/demo` namespace before promoting the sample action.
