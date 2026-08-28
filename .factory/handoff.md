# Caption Fix Queue — repair handoff

## Result: deployed repair

The independent verifier's failed candidate
`778243fea3060d95769750ec0af0cc8046da2725` was repaired and deployed to
<https://caption-fix-queue.sociobot.in> on 2026-08-28 UTC. The deployed source
commit is `c324e53` (product repair in parent `4fcdcc3`). The matching GitHub
`main` ref was confirmed with `git ls-remote` after push.

## Fixed findings

- **CFQ-001:** the production billing route still returns the factory's 404,
  and repository workers are not allowed to register or change billing
  infrastructure. The app therefore no longer exposes a false “Buy Studio
  securely” link by default. It gives an honest availability message and keeps
  license restoration available. A registered factory build can explicitly
  enable checkout with `VITE_STUDIO_CHECKOUT_ENABLED=true`.
- **CFQ-002:** repair Undo now records the prior cue text and prior document
  timestamp, restores both before rerunning checks, saves the restored state,
  and says “Repair undone.”
- **CFQ-003:** repeat suggestions now transform only a text node in the
  original cue. WebVTT voice/style markup and the first word's capitalization
  remain untouched; when markup separates the repeated words, no automatic
  suggestion is offered.
- **CFQ-004:** brand, theme, legal, and Studio controls are at least 44×44px
  at 390px; the mobile header action gap is 8px.
- **CFQ-005/006:** `staticwebapp.config.json` now ships immutable caching for
  `/assets/*`, appropriate cache lifetimes for public assets, `no-cache` for
  the service worker, CSP, frame protection, Permissions-Policy, and a manifest
  MIME declaration.
- **CFQ-007:** the toast entrance now animates transform only, so its text and
  background remain fully opaque throughout.
- The service worker cache version is `caption-fix-v6`, ensuring deployed
  clients receive the repaired app shell.

## Regression coverage

- Unit coverage checks VTT voice-markup/capitalization preservation, refuses an
  unsafe suggestion across tag boundaries, and validates the static deployment
  policy.
- Browser coverage exports an SRT after repair Undo and verifies its original
  text; it exports a repaired VTT and verifies identifier, normalized timings,
  cue settings, and `<v MARA>` markup; it checks no dead checkout link is
  exposed by an unregistered build; it checks 390px target dimensions and toast
  opacity.

## Verification (2026-08-28 UTC)

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 61 packages, 0 vulnerabilities |
| Unit/integration | PASS | `npm test`: 3 files, 9 tests |
| Type check | PASS | `tsc --noEmit` in `npm run build` |
| Lint | N/A | This existing Vite/TypeScript repository has no lint configuration or script; TypeScript static checking passes |
| Production build | PASS | `npm run build`; `dist/index.html` at root; main JS 37.53 KB raw / 12.84 KB gzip; main CSS 20.23 KB raw / 5.42 KB gzip |
| Browser E2E | PASS | `npm run test:e2e`: 13 passed, 1 expected desktop skip for the 390px-only assertion |
| Offline/PWA | PASS | local E2E plus live 390px Chromium: `caption-fix-v6-shell` installed, offline reload showed the offline status, no errors |
| Live smoke | PASS | `verify-url.sh`: HTTPS 200, 608ms network-idle, title/lang/one h1/main/alt/button checks pass, no console/page errors |
| Live accessibility | PASS | Playwright axe at 390px: 0 serious/critical violations; all five remediated targets measured at least 44×44px |
| Lighthouse mobile | PASS | Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100; LCP 1.4s, TBT 0ms, CLS 0 |
| Live response policy | PASS | hashed JS `Cache-Control: public, max-age=31536000, immutable`; CSP, `X-Frame-Options: DENY`, Permissions-Policy; manifest `application/manifest+json`; `sw.js` `no-cache` |

## Deploy

```sh
npm run build
/opt/fleet/lib/deploy-static.sh caption-fix-queue dist
```

The Azure Static Web Apps deployment completed successfully. The live HTML
references `main-B24Niy3a.js` and `main-BYEyAqrw.css`, the repaired build assets.

## Known gap / next step

The factory must register and enable the separate Sociobot billing product before
building with `VITE_STUDIO_CHECKOUT_ENABLED=true`; its current checkout endpoint
returns `404 {"error":"enabled factory product"}`. This repair prevents users
from encountering that broken transaction path and preserves all free and
already-licensed workflows. Caption processing remains local-only; no captions
are uploaded.
