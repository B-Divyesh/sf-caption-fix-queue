# Caption Fix Queue — repair handoff

## Result: PASS

Repair commit: `b23f63c fix: restore Studio checkout and license verification`.
It repairs the two High defects reported against candidate
`f9c4c59c7180b50325489ef35f61e2f3379ff77c` in
`.factory/verification-2.md`, preserves the Vite + TypeScript static PWA
artifact, and is deployed at <https://caption-fix-queue.sociobot.in>.

## Repairs

- **CFQ2-001 — checkout unavailable:** registered the live Sociobot billing
  catalog entry `caption-fix-queue` as **Caption Fix Queue Studio**, USD 19.00
  one-time, with return URL `https://caption-fix-queue.sociobot.in/`. Its Dodo
  product is a one-time digital product. The direct contract endpoint now
  returns HTTP `303` to a hosted `checkout.dodopayments.com/session/...` URL;
  it was HTTP 404 before repair. The product UI always renders this required
  Sociobot checkout route rather than hiding it behind a build-time flag.
- **CFQ2-002 — offline token bypass:** new and returned tokens now clear any
  previous verdict and remain locked until a successful verification response
  has been cached. `cachedUnlock()` accepts only `{ valid: true, checkedAt > 0
  }`. A successful prior verdict continues to allow offline use, and is
  rechecked on the existing once-per-day policy. The app ships `caption-fix-v7`
  so an already-installed v6 client receives the corrected shell.

## Regression coverage

- `tests/license.test.ts` covers first-time offline restore staying locked,
  verified-token offline continuity, successful verification caching, and
  return-token URL stripping without an unlock.
- `tests/e2e/app.spec.ts` covers the exact hosted checkout URL on desktop and
  390px mobile plus the normal UI path from an offline arbitrary token through
  a locked Studio state and no stored verdict.

## Verification evidence

Run from a clean dependency install with Node 22.23.2 / npm 10.9.8:

```sh
npm ci                    # 61 packages, 0 vulnerabilities
npm test                  # 4 files, 13/13 passed
npm run build             # tsc --noEmit + Vite, dist/ emitted
npm run test:e2e          # 15 passed; 1 intentional desktop skip
```

- Type checking runs in `npm run build`. There is no lint script or lint
  configuration in this repository.
- Playwright covered desktop Chrome and the 390×844 mobile project, keyboard
  repair/navigation, invalid input, repairs/Undo/exports, dark mode, 44px
  mobile targets, and installed-shell offline reload. The last Playwright run
  reports `{"status":"passed","failedTests":[]}`.
- Live smoke (`verify-url.sh`): HTTPS 200 in 739 ms, zero console/page errors,
  title/lang/one h1/main/image-alt/labeled-button checks all passed.
- Live browser checks: the Studio link is the registered checkout route; the
  real API rejects `not-a-real-license` as `{"valid":false,"reason":"invalid"}`;
  a newly pasted offline token leaves Studio locked and stores no verdict;
  first Tab reaches the `#main` skip link; 390px has no horizontal overflow.
  Free-path requests remain same-origin; the only cross-origin request during
  license testing was the documented `api.sociobot.in` verification endpoint.
- Accessibility: Axe on the deployed desktop initial view found 0
  serious/critical violations. The full Playwright suite runs Axe on light,
  dark, empty, and workspace views on both viewport projects.
- PWA: live service worker reports `caption-fix-v7-shell` and
  `caption-fix-v7-runtime`; after worker control and an online reload, a 390px
  offline reload rendered the app heading and the Offline status. Manifest and
  update shell remain versioned.
- Response policy: live HTML returned HSTS, CSP (`frame-ancestors 'none'` and
  only the Sociobot billing API in `connect-src`), `X-Frame-Options: DENY`,
  `nosniff`, Referrer-Policy, Permissions-Policy, and revalidating HTML cache
  headers. Static deployment-policy unit coverage passed.
- Live identity: all 16 deployable files in local `dist/` (excluding only
  provider config `staticwebapp.config.json`) matched their live counterparts
  byte-for-byte by SHA-256 after deployment.
- Lighthouse 13.4.1, mobile preset, live: Performance **99**,
  Accessibility **100**, Best Practices **100**; FCP 1.6 s, LCP 1.9 s,
  TBT 0 ms, CLS 0, transfer 121 KiB.
- Budget: initial main JS 37,542 B raw / 12,886 B gzip; main CSS 20,226 B raw
  / 5,419 B gzip; no web fonts; hero WebP 93,780 B.

## Privacy and deployment

Caption parsing, glossary, review history, and exports remain local-first in
IndexedDB. There are no analytics, third-party fonts, CDNs, or caption uploads.
The only paid-flow network calls are the documented Sociobot checkout and
license verification routes. `dist/` was deployed with
`/opt/fleet/lib/deploy-static.sh caption-fix-queue /work/repo/dist`.

## Known gaps / next steps

No product-code or release-blocking gaps remain. No paid transaction was
completed during verification; checkout was verified through its hosted 303
session response to avoid creating a charge. Future paid-flow changes should
retain the first-verification lock and add a new service-worker version.

Unrelated pre-existing `graphify-out/` working-tree changes were left untouched.
