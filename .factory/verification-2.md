# Caption Fix Queue — independent verification 2

## Verdict: FAIL

Candidate `f9c4c59c7180b50325489ef35f61e2f3379ff77c` was independently
tested on 2026-08-28 UTC from a clean detached worktree and against
<https://caption-fix-queue.sociobot.in>. The deployed free caption-review PWA is
fast, accessible, private by default, and matches the candidate build exactly.
It does not meet release acceptance because the advertised Studio purchase is
still unavailable and an unverified arbitrary token unlocks paid features when
license verification is offline.

No product source was changed during verification.

## Candidate and deployment identity

- Requested/tested commit: `f9c4c59c7180b50325489ef35f61e2f3379ff77c`.
- `origin/main` and the remote GitHub `refs/heads/main` both resolved to that
  full SHA during verification.
- Testing ran in a detached `/tmp` worktree. It was clean before installation
  and remained free of tracked/untracked changes after all repository gates.
- Runtime: Node.js 22.23.2, npm 10.9.8, Chromium 145.0.7632.6.
- All 16 public files emitted under `dist/` matched the corresponding live
  responses byte-for-byte by SHA-256. `staticwebapp.config.json` is provider
  configuration and correctly is not a public file.
- Key hashes: `index.html`
  `7f3edd550e7f15a2c83a13ab4faf64bf2e341eaf33c3bacaf452b962cee6bb5`;
  `sw.js`
  `e7d6b43dcf8612710c0a5ef43a4cce3a4326f23d3a11210537420fdf54e27805`;
  main JS
  `99808ca0ab9834e78137c1178132f61c31cee3271a43902a2e08098382c1a6ad`;
  main CSS
  `9bf5fc67e176f547c92eb6ef0807ada404fa4cbb16104524c16833d4f73a760e`.

## Repository and production gates

| Gate | Result | Fresh evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 61 packages installed, 0 vulnerabilities |
| Unit/integration tests | PASS | `npm test`: 3 files, 9/9 tests |
| Type check | PASS | `tsc --noEmit` ran as the first stage of the exact build |
| Lint | N/A | No lint script or lint configuration exists |
| Exact production build | PASS | `npm run build`; Vite 6.4.3 emitted `dist/` |
| Repository E2E | PASS | `npm run test:e2e`: 13 passed, one intentional desktop skip for a mobile-only assertion |
| Factory URL smoke | PASS | `/opt/fleet/lib/verify-url.sh`: HTTPS 200, 632 ms network-idle load, correct title/lang, one h1, main, image alt and labeled-button checks, zero console/page errors |
| Independent browser matrix | PASS | 71 assertions passed before the two billing defects were probed separately |
| Lighthouse mobile live | PASS | Lighthouse 13.4.1: Performance 100, Accessibility 100, Best Practices 100; FCP 0.9 s, LCP 1.4 s, TBT 80 ms, CLS 0, 121 KiB transfer |

## End-to-end product evidence

The following passed against the candidate production build and, where relevant,
the byte-identical live deployment:

- Imported captions by paste, file picker, and synthetic drag/drop. A clean cue
  reached “No likely defects found.” The sample produced all six promised finding
  families: repeat, blank run, unsupported/hidden character, reading speed,
  inconsistent speaker name, and glossary mismatch.
- Used the visible controls and `J`, `K`, `E`, `A`, and `D` shortcuts. Focus moved
  to the selected finding/editor, accept and dismiss were undoable, and repair
  Undo restored the original repeated text in the exported SRT.
- Caption/workspace state survived reload. A project JSON export/import round trip
  restored the document and one resolved decision. “Delete local workspace”
  removed it, and the empty state remained after reload.
- A WebVTT suggested repair preserved the `WEBVTT` header, `STYLE`, `REGION`,
  `NOTE`, cue identifier, cue settings, voice markup, and capitalization while
  removing only the repeated word.
- Empty input, untimed text, an invalid timestamp, reverse duration, out-of-order
  cues, an unsupported extension, and a 5,000,001-byte file produced recoverable
  errors. A valid retry worked. A file of exactly 5,000,000 bytes was accepted.
- License-return handling was tested with an intercepted valid response: the
  token was stored at `sb_license:caption-fix-queue`, stripped from the URL, and
  sent only to the documented product verify endpoint. An intercepted revoked
  response stayed locked and showed a useful error.
- Free import, checking, decisions, repair, persistence, and export made no
  cross-origin requests. There are no analytics, ad pixels, CDN scripts, remote
  fonts, or caption uploads.

## PWA, accessibility, mobile, and policies

- Chromium reported no manifest errors. The manifest has standalone display, a
  versioned start URL, product colors, 192/512 icons, and a 512 maskable icon;
  each raster icon's real dimensions matched its declaration.
- A controlled `caption-fix-v5` to `caption-fix-v6` update displayed the in-app
  update notice, installed/activated the v6 shell, removed the v5 cache, and then
  reloaded offline with the saved workspace. The live v6 worker also retained a
  workspace on offline reload; live privacy and terms pages opened offline.
- Desktop and 390×844 mobile empty/workspace views had no horizontal overflow.
  The five previously remediated mobile navigation controls measured at least
  44×44 CSS pixels. A 200% root-font simulation retained page content without
  horizontal overflow.
- The first Tab stop was the skip link, with a measured 3 px solid visible focus
  outline. The skip link worked; native dialogs received focus and closed with
  Escape. Reduced-motion mode reduced transitions/animations to 0.01 ms.
- Axe scans of light/dark empty and workspace states plus privacy, terms, and
  offline pages at desktop and 390 px found zero serious or critical findings.
- No unexpected console exceptions or page errors occurred. The single logged
  `ERR_INTERNET_DISCONNECTED` during the deliberate offline license test was the
  expected failed verification request that exposed CFQ2-002.
- Live responses provide HSTS, CSP with `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, and Permissions-Policy.
  The manifest has `application/manifest+json`; `sw.js` is `no-cache`; hashed
  JS/CSS is `public, max-age=31536000, immutable`; legal/root HTML revalidates
  after 30 seconds; Brotli is available.

## Performance budgets

- Initial main JS: 37,525 B raw / 12.84 KB gzip (budget 200 KB).
- Initial main CSS: 20,226 B raw / 5.42 KB gzip (budget 50 KB).
- Fonts: 0 B; system stacks only (budget 120 KB).
- Hero WebP: 93,780 B; JPEG fallback: 147,904 B (budget 300 KB).
- Live Lighthouse transfer: 121 KiB; LCP 1.4 s, TBT 80 ms, CLS 0.

## Defects

### CFQ2-001 — High — New Studio purchases are unavailable

The live “Get Studio” dialog advertises a `$19` one-time license and paid
features but replaces the required buy link with “Checkout is not available
yet.” A fresh direct request to the contract route
`https://api.sociobot.in/api/v1/products/caption-fix-queue/checkout` returned:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The verify endpoint itself is live and returned `200` with
`{"valid":false,"reason":"invalid"}` for an invalid token. Hiding the dead link
is a good recovery from the prior candidate's broken navigation, but it does not
complete the brief's freemium flow or the attached paid-unlock contract. New
users cannot buy the paid features the product and terms advertise.

### CFQ2-002 — High — Any token unlocks paid features when first verification is offline

Fresh live reproduction in a new browser context:

1. Open the sample and “Get Studio.”
2. Paste `not-a-real-license` into “Have a license?” and take the browser offline.
3. Activate “Restore purchase.”
4. The verify request fails with `ERR_INTERNET_DISCONNECTED`, but the header says
   “Studio active,” the dialog says Studio is active, and paid “Export JSON” is
   enabled and successfully downloads the glossary.

Storage at that point contains the arbitrary token and
`{"valid":true,"checkedAt":0}`. `saveLicense()` writes an optimistic valid verdict
before the forced first verification; the offline fallback then trusts that same
unverified verdict. Optimistic offline access is appropriate for a previously
verified cached license, not for a token that has never been verified. This is a
straightforward paid-feature authorization bypass through the normal UI.

## Release decision

Do not promote this candidate as complete. The core free PWA meets its job-to-be-
done and all tested accessibility, privacy, offline, performance, build, and
deployment-identity gates. Release acceptance remains **FAIL** until the factory
registers/enables the checkout route and first-time license restoration cannot
unlock on a failed verification. After repair, rerun purchase/return/restore,
cached-offline license behavior, revoked-license handling, the repository gates,
deployment byte comparison, and the PWA offline smoke test.
