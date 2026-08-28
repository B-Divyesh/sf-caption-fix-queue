# Caption Fix Queue — independent verification 4

**Result: PASS**

Candidate `6265d2e2c59eaefb3c03176b50c8e0978a5e9bde` passes the supplied
acceptance contract. I tested it on 2026-08-28 UTC from a new detached,
clean checkout (`git clone --no-local`, then detached checkout of the exact
SHA) and against <https://caption-fix-queue.sociobot.in>. No product source
was modified during verification.

## Candidate and live identity

- The fresh checkout started with no tracked or untracked changes; Node was
  `v22.23.2` and npm `10.9.8`.
- The locally built candidate and live production matched by SHA-256 for all
  16 deployed files: root and legal HTML, both JS bundles, both CSS bundles,
  artwork, all four icons, manifest, offline page, and service worker. The
  provider-only `staticwebapp.config.json` is not a served artifact.
- Live HTML references the candidate hashes `main-CmeZsOme.js` and
  `main-BYEyAqrw.css`; the matched main JS SHA-256 is
  `3842f4a9355b00c4835162588615d1202da5ed7d708247d9dc7bd7c0f43b469d`.

## Clean-checkout quality gates

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 61 packages, 0 audit vulnerabilities |
| Unit/integration | PASS | `npm test`: 4 files, 13/13 tests passed |
| Type check and production build | PASS | exact `npm run build` ran `tsc --noEmit` then Vite and emitted `dist/` |
| Repository browser suite | PASS | `npm run test:e2e`: 15 passed, 1 intentional desktop-only skip; desktop and 390×844 projects ran |
| Lint | N/A | no lint script or lint configuration is present |

I also ran Lighthouse 12.8.2 and 13.4.1 against the supplied Playwright
Chromium. Both terminated during Lighthouse cleanup with a Chromium CDP
`Connection closed` error, before producing a report. This is a verifier-tool
compatibility issue, not a product console/page error; the direct browser,
axe, semantic, responsive, transfer, and bundle checks below all passed.

## End-to-end product evidence

Fresh live Chromium checks were repeated at desktop (1440px) and mobile
(390×844), in a new browser profile for each size.

- The normal local review flow worked: paste/import a valid SRT, inspect the
  explainable sample queue, open repair with `E`, save, Undo, and export. The
  exported SRT after Undo contained the original repeated `our our` text.
- A malformed paste reported the missing timing line in its alert; replacing
  it with valid SRT recovered successfully. The saved workspace persisted
  across refresh, and confirmed local-workspace deletion returned to the
  empty state.
- A 5,000,001-byte SRT was rejected with the recoverable over-5-MB message;
  an exactly 5,000,000-byte SRT was accepted.
- A VTT with a cue identifier, `line:90%` setting, and `<v MARA>` voice markup
  retained all three after the suggested repeat repair and export.
- No text changed until an explicit repair/suggested-fix action. The supplied
  checks and unit suite cover repeats, blank runs, unsafe characters, reading
  load, near-matching speakers, and glossary variants.
- Free-use sessions made no outbound browser requests: caption data remained
  local. No analytics, ad pixels, remote fonts, runtime CDN, or caption upload
  was seen. The only coded cross-origin integration is the documented
  Sociobot billing API when Studio is used.
- Studio's visible checkout URL returned HTTP 303 to a hosted
  `checkout.dodopayments.com` session. Invalid license verification remained
  locked. There is no sign-in flow, so no identity-provider integration applies.

## Accessibility, responsive, and PWA evidence

- Empty and workspace axe scans found **zero serious or critical** violations
  on both desktop and 390px mobile. The live document has a title,
  `lang="en"`, exactly one `h1`, one `main`, meaningful artwork alt text, and
  no horizontal document overflow at either size.
- The first keyboard Tab reached the skip link; it had a visible focus outline.
  `E` operated repair without a pointer. At 390px, the primary task and review
  actions remained available without horizontal clipping.
- Under `prefers-reduced-motion: reduce`, live animation duration changed from
  180ms to `0.00001s` (`1e-05s` computed), satisfying the motion policy.
- Live service-worker control and an offline reload were tested after the app
  shell was cached; the main page and visible Offline status rendered at both
  sizes. The manifest parsed in Chromium with standalone display, versioned
  start URL, 192/512 icons, and a maskable 512 icon.
- Service-worker upgrade behavior was exercised with the unmodified candidate
  app shell on a local test origin: the first worker used
  `caption-fix-v7-shell`; a controlled subsequent `/sw.js` response changed
  only the cache version to `caption-fix-v8-qa`. `registration.update()` made
  two worker requests, created both versioned caches, claimed the page, and
  displayed “A fresh field guide is ready. Reload to update.” No console error
  occurred. This verifies the candidate's update listener, `skipWaiting`, and
  `clientsClaim` path without changing product source or production state.

## Privacy, response policies, caching, and budgets

- `/privacy/` and `/terms/` are live and describe the local IndexedDB
  workspace, localStorage license token, deletion, and the limited billing
  call. Source and runtime evidence agree with the local-first claim.
- Live HTTPS responses have HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, CSP with
  `connect-src 'self' https://api.sociobot.in`, `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, and a restrictive Permissions-Policy. The manifest
  MIME is `application/manifest+json`.
- Root/legal HTML uses short revalidation; hashed JS/CSS uses
  `Cache-Control: public, max-age=31536000, immutable`; service worker uses
  `no-cache`; the JS response is Brotli encoded.
- Main JS is 37,542 B raw / 12,850 B gzip (under 200 KB); main CSS is 20,226 B
  raw / 5,420 B gzip (under 50 KB); no font files ship; the hero WebP is
  93,780 B (under 300 KB).

## Server endpoint rate-limit test

`GET https://api.sociobot.in/api/v1/products/caption-fix-queue/verify` is the
only product server-side API endpoint. I sent 80 distinct invalid-token GETs
at 20-way concurrency. The result was **30 × 200** followed by **50 × 429**;
the first observed rejection threshold was therefore 30 requests in this
burst. Every sampled 429 included `Retry-After: 2` (and
`X-RateLimit-After: 2`). A single invalid-token call returned the expected
no-store JSON verdict, `{"valid":false,"reason":"invalid","expires_at":null}`.

This corrects the previous verification's blocking CFQ3-001 condition. The
checkout endpoint was separately checked once and returned the expected hosted
payment redirect; it is not a general-purpose product API.

## Defects

No release-blocking, high, medium, or low product defects were found in this
fresh verification. The only non-product limitation was the failed Lighthouse
CLI cleanup described above; direct browser checks cover its relevant contract
items and passed.

## Release decision

**PASS.** The deployed product matches candidate
`6265d2e2c59eaefb3c03176b50c8e0978a5e9bde` and meets the requested local
checker, privacy, accessibility, PWA, response-policy, caching, performance,
and rate-limit acceptance checks.
