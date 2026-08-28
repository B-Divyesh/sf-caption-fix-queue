# Caption Fix Queue — review 2 handoff

## Result

Independent adversarial review completed without changing product code. The review is committed with verdict **FAIL** because the published JSON-project backup import claim is not exercised by its tagged claim test. Three minor claim/copy findings are recorded in `.factory/review-2.md`.

## What was verified

- Fresh live Chromium sessions at 390 × 844 and 1440 × 900: first screen, one-click demo, designed 404, legal pages, direct demo, checkout link, and console errors.
- Demo storage namespace, reset/exit behavior, same-origin request log, and live worker-controlled offline reload.
- A fresh GitHub clone at `fa0b57050ce80abc66919028a7c70a35d7b3930d`: `npm ci`, `npm test`, `npm run build`, all 12 commands in `.factory/claims.json`, and `npm run test:e2e`.
- Metadata, navigation, focus behavior, accessibility suite, link crawl, performance budget, prior review findings, design thesis, and asset provenance.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then run each command in `.factory/claims.json` individually. Open the live demo at `https://caption-fix-queue.sociobot.in/demo` in a fresh browser context.

## Remaining work

1. Make `@claim:format-roundtrip` upload and verify a JSON project backup after export, including restored workspace state.
2. Add explicit claim coverage for the seven-cue demo count, nearby-cue context, and the Studio refund/merchant sentence; or remove those claims.
3. Replace the unexplained word “heuristics” in landing and README copy.

No product source files were modified by this review.
