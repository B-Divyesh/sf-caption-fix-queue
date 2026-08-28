# Caption Fix Queue — independent verification 3

**Result: FAIL**

Verified candidate commit `6265d2e2c59eaefb3c03176b50c8e0978a5e9bde`
against the live product at <https://caption-fix-queue.sociobot.in> on
2026-08-28. This is a fresh, independent run from detached clean worktree
`/tmp/cfq-verify-6265`; no product code was changed.

The deployed static artifact matches the candidate exactly and the free checker
works end to end. The release fails the acceptance contract because the
product's required license-verification endpoint has no observed rate limit.

## Release-blocking defect

### High — CFQ3-001: license verification API has no rate limit

`GET https://api.sociobot.in/api/v1/products/caption-fix-queue/verify` is the
product's server-side Studio-unlock endpoint. A burst of **60** concurrent
requests (20-way concurrency), each with a distinct invalid `license` value,
returned **60 × HTTP 200**. No response returned HTTP 429 and no
`Retry-After` header was observed. A single invalid-token response was
`{"expires_at":null,"reason":"invalid","valid":false}` with
`Cache-Control: no-store`.

The work order explicitly requires a burst at every product API endpoint to
begin returning 429 with `Retry-After`, and to record the threshold. The
observed threshold is therefore **not reached after 60 requests**. This allows
unbounded online token probing and violates the acceptance contract. Add an
appropriate per-client/product rate limit to this verification endpoint, with a
standards-compliant `Retry-After`, then redeploy and re-verify. The separate
checkout route was only checked once (HTTP 303 to a Dodo hosted session) to
avoid creating unnecessary payment sessions.

## Clean-checkout quality gates

Node 22.23.2 / npm 10.9.8:

```sh
git worktree add --detach /tmp/cfq-verify-6265 6265d2e2c59eaefb3c03176b50c8e0978a5e9bde
cd /tmp/cfq-verify-6265
npm ci
npm test
npm run build
npx playwright test --workers=1
```

- `npm ci`: 61 packages installed; audit reported 0 vulnerabilities.
- `npm test`: 4 files, **13/13 passed**.
- `npm run build`: passed `tsc --noEmit` and emitted `dist/`.
- Playwright 1.58.2: **15 passed, 1 intentional desktop skip**. It covered the
  repository's desktop and 390×844 mobile projects. A serial run was used to
  avoid service-worker state racing between browser projects.
- There is no lint script or lint configuration in this repository. Type
  checking is included in the exact production build.

## Product and recovery testing

- Normal SRT path: imported the supplied sample, got **6 explainable findings**
  spanning the advertised checks, repaired a cue, accepted a finding, and
  exported captions. No transcript text changed before the explicit repair.
- WebVTT path: imported a cue with an identifier, voice markup, and `line:90%`
  settings; accepted the suggested repeated-word repair and confirmed exported
  VTT retained `intro`, the normalized timestamp, `line:90%`, and
  `<v MARA>Hello</v>`.
- Invalid pasted text remained in the dialog and announced
  `Found text without a timing line near “not a captions document”.`, giving a
  direct recovery path.
- A 5,000,001-byte `.srt` upload was rejected with
  `That file is over 5 MB. Split it into a smaller caption file first.`
- Repository E2E coverage also passed for empty/reverse/malformed captions,
  timestamp dialects, all six finding kinds, markup-split repeat safety,
  Undo/export, local persistence, an offline first-use license token staying
  locked, and a previously verified token surviving an offline recheck.
- The real hosted checkout route returned HTTP 303 to
  `checkout.dodopayments.com`; an invalid token stayed locked. No sign-in flow
  exists, so no identity-provider integration applies.

## Browser, accessibility, PWA, and privacy evidence

- Fresh live desktop Chromium session: no console errors or page errors;
  initial requests were same-origin only. The only product code outbound route
  is the documented Sociobot verification/checkout API; source inspection found
  no analytics, pixels, third-party fonts, runtime CDN, or caption upload.
- Axe on the live empty and workspace views: **0 serious/critical** violations.
  The passing E2E suite repeats Axe on empty, workspace, and dark views in both
  browser projects.
- Keyboard: a fresh first Tab focuses the visible 3px focus-ring skip link to
  `#main`; sample review works with `E` and `A`. At 390px the page measured
  390px `scrollWidth` for 390px `innerWidth`; the primary import action was
  180×46.8px and body text 16px.
- Reduced motion: `prefers-reduced-motion: reduce` changed transitions and
  animations to `0.00001s` and scrolling to `auto`.
- PWA: live registration controlled `/sw.js`, created
  `caption-fix-v7-shell`, and an explicit `registration.update()` check kept
  that active version (no waiting worker when the worker was identical).
  `sw.js` is `Cache-Control: no-cache`, has versioned caches plus
  `skipWaiting`/`clientsClaim`, and its update listener supplies the reload
  toast. After worker control, a 390px offline reload rendered the main h1 and
  visible Offline status banner.
- Manifest is valid in-browser: standalone display, versioned start query,
  192/512 icons and a 512 maskable icon. Privacy and Terms live at `/privacy/`
  and `/terms/`; local content uses IndexedDB and the license token localStorage.

## Deployment, response policy, and budgets

- SHA-256 comparison matched **all 16 deployable candidate files** to live:
  HTML, JS/CSS, artwork, icons, manifest, service worker, offline page, and
  legal pages. `staticwebapp.config.json` is provider configuration and was
  correctly excluded from the served-artifact comparison.
- Live HTML: HTTPS 200, `Cache-Control: public, must-revalidate, max-age=30`,
  HSTS, CSP limiting `connect-src` to self and `api.sociobot.in`,
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict-origin
  referrer policy, and a restrictive Permissions-Policy. Hashed JS is immutable
  for one year; `sw.js` is no-cache; manifest has the declared manifest MIME.
- Exact build sizes: main JS 37,542 B raw / 12,867 B gzip; main CSS 20,226 B
  raw / 5,438 B gzip; no shipped fonts; hero WebP 93,780 B. All are within the
  stated static/PWA budgets.
- Fresh Lighthouse 13.4.1 mobile run on live: Performance **99**,
  Accessibility **100**, Best Practices **100**; FCP 0.9 s, LCP 1.4 s,
  TBT 120 ms, CLS 0, transfer 121 KiB.

## Re-verification required

Do not mark this candidate releasable until CFQ3-001 is corrected. Re-run the
60-request (or smaller documented threshold) burst and record the first HTTP
429 plus its `Retry-After` header, then repeat the affected license and PWA
smoke tests.
