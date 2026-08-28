# Caption Fix Queue — independent verification

## Verdict: FAIL

Candidate `778243fea3060d95769750ec0af0cc8046da2725` was tested from a fresh,
detached clone on 2026-08-28 UTC against
<https://caption-fix-queue.sociobot.in>. The free local review path is usable,
fast, private by default, and works offline. Release acceptance nevertheless
fails because three user-visible defects are release-blocking: Studio checkout
returns 404, repair Undo does not restore caption text, and a suggested WebVTT
repair discards valid voice markup.

No product source was changed during verification.

## Candidate and deployment identity

- Requested and tested commit: `778243fea3060d95769750ec0af0cc8046da2725`
- Fresh checkout status before installation: detached HEAD, no tracked or
  untracked changes
- Runtime: Node.js 22.23.2, npm 10.9.8, Chromium 145.0.7632.6
- `origin/main` at verification time: the same commit
- Exact build command: `npm run build`
- All 16 files in the generated `dist/` matched the corresponding live response
  byte-for-byte by SHA-256. This includes:
  - root HTML: `02ef82bbc75001130963e598011a923f81a44e55ff6fe72c01533efb58dd7048`
  - service worker: `aa45a186c3ec4849cd25ed78dea53c1dbf011c1eef9de74bb75816c541c928e8`
  - main JS: `6311638f8bb1d90dbcd86c20f70001b577c3cbed5bde16bb6270f0d567954269`
  - main CSS: `5ae1497f985a1f4602b574060adfb2389e5da2c9f9b81a4ff0d08fbde0342e58`
- The live HTML references the same hashed assets as the candidate build.

## Quality-gate results

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`; 61 packages, 0 audit vulnerabilities |
| Unit/integration | PASS | `npm test`; 2 files, 6/6 tests |
| Type check | PASS | `tsc --noEmit`, run by the build |
| Lint | N/A | No lint script or lint configuration is present |
| Production build | PASS | Vite 6.4.3; `dist/` generated successfully |
| Repository E2E | PASS | `npm run test:e2e`; 6/6 Chromium tests across desktop and 390×844 mobile |
| Factory URL smoke test | PASS | HTTPS 200, 717 ms network-idle load, title/lang/main/one h1/alt/button checks pass, no console errors |
| Independent E2E | FAIL | Core paths pass, but defects CFQ-001 through CFQ-007 below remain |
| Lighthouse 12.8.2 local | PASS | Performance 100, Accessibility 100, Best Practices 100; LCP 1.86 s, TBT 0 ms, CLS 0 |
| Lighthouse 12.8.2 live | PASS | Performance 100, Accessibility 100, Best Practices 100; LCP 1.37 s, TBT 16 ms, CLS 0 |

Lighthouse used the mobile preset and a fresh headless Chromium. PWA behavior was
tested directly because current Lighthouse releases no longer provide a complete
PWA category.

## End-to-end product evidence

The following passed against the production build and, where meaningful, the live
origin:

- Imported SRT by file picker, synthetic drag/drop, and paste. A clean one-cue SRT
  reached the “No likely defects found” state.
- The supplied sample produced all six promised finding families: repeat, blank,
  unsafe/invisible character, reading load, speaker-name inconsistency, and
  glossary mismatch.
- Used `J`/`K` to move, `E` to edit, `A` to accept, `D` to dismiss, and keyboard
  focus return to the finding heading. Decision Undo works; repair Undo does not
  (CFQ-002).
- Manual SRT repair exported the repaired caption and survived reload through
  IndexedDB. Theme selection also survived reload.
- An unchanged standards-oriented WebVTT round trip preserved its header metadata,
  `STYLE`, `REGION`, `NOTE`, cue identifier, cue setting, and `<v>` markup. The
  suggested-fix path does not preserve the markup (CFQ-003).
- Empty input, untimed text, a reverse duration, out-of-order cues, an unsupported
  extension, and a file over 5,000,000 bytes all produced recoverable errors. A
  valid retry then succeeded. A valid file of exactly 5,000,000 bytes was accepted
  in 2.24 seconds without a console/page error.
- “Delete local workspace” removed the IndexedDB record; the empty state remained
  after reload.
- Project/caption data caused no post-load network traffic. Across fresh import,
  repair, persistence, and export sessions, requests stayed on the product origin.
  The only coded third-party request is license verification to the Sociobot API.
- License-return behavior was exercised with an intercepted API result: the token
  was stored under `sb_license:caption-fix-queue`, stripped from the browser URL,
  only the token was sent to the documented verify route, and a revoked result
  returned the app to free mode with a quiet notice.

## PWA, accessibility, and responsive evidence

- Manifest parsed through Chromium with no manifest errors; name, short name,
  standalone display, versioned start URL, theme/background colors, 192/512 icons,
  and a 512 maskable icon were present at their declared dimensions.
- The live app installed a controlling worker, retained the sample workspace, and
  reloaded offline at 390×844. `/privacy/` and `/terms/` also opened offline.
- A controlled `caption-fix-v5` → `caption-fix-v6` worker update created the new
  shell cache, deleted the old cache, claimed the page, and displayed “A fresh
  field guide is ready. Reload to update.” Offline reload then succeeded without
  console errors.
- Empty and workspace states had no document-level horizontal overflow at 390 px.
  A 200% root text-size simulation also retained all content/actions without
  horizontal page overflow.
- Native dialogs contained keyboard focus and closed with Escape. The first Tab
  stop was the skip link, and the visible focus outline was 3 px solid pollen.
- `prefers-reduced-motion: reduce` reduced transition and animation durations to
  `0.01ms`.
- Stabilized axe scans of empty/workspace, desktop/mobile, light/dark, privacy,
  terms, and offline states found no serious or critical issues. The animated
  toast has a transient contrast failure documented as CFQ-007.
- No console errors or uncaught page errors occurred in local or live scenarios.

## Performance and privacy budgets

- Main JS: 37,019 B raw / 12,669 B gzip (budget 200 KB).
- Main CSS: 19,904 B raw / 5,390 B gzip (budget 50 KB).
- Fonts: 0 B (system fonts; budget 120 KB).
- Hero WebP: 93,780 B (budget 300 KB); JPEG fallback: 147,904 B.
- Live first-load transfer in Lighthouse: 123,047 B across 7 requests.
- No analytics, ad pixels, CDN scripts, remote fonts, or caption uploads were
  observed. Fresh free/Studio-dialog sessions made four same-origin requests and
  zero cross-origin requests.
- Privacy and terms pages accurately describe IndexedDB/localStorage, hosting logs,
  billing verification, deletion, and data ownership.

## Defects

### CFQ-001 — High — Studio purchase is unavailable on production

The visible “Buy Studio securely” link correctly targets
`https://api.sociobot.in/api/v1/products/caption-fix-queue/checkout`, but a fresh
GET returned HTTP 404 with body:

```json
{"error":"enabled factory product","status":404}
```

Impact: users are offered a $19 product they cannot buy, so the advertised paid
workflow cannot be completed. The `/verify` route itself responded normally to an
invalid test token (`200`, `valid:false`, `reason:"invalid"`). This confirms the
previously described registration/deployment gap still exists from fresh evidence.

### CFQ-002 — High — Undo after a text repair does not undo the repair

Reproduction on the live sample:

1. Open “Try a sample”.
2. Repair cue 1 from “Welcome to our our garden workshop.” to “Welcome to our
   garden workshop.”
3. Activate the offered “Undo” action.
4. Export SRT.

The UI announces “Decision undone,” but the export still contains the repaired
single-`our` text. The original text is not restored. `lastAction` records finding
status/history length but not the prior cue text. This violates the explicit
reversible-action contract and can lose the original caption content.

### CFQ-003 — High — Suggested repeat repair destroys valid WebVTT markup

Input cue:

```vtt
intro
00:00.000 --> 00:02.000 line:90%
<v MARA>Hello hello</v>
```

An unchanged export preserves the cue identifier, setting, and voice markup.
Activating its visible suggested fix exports the cue body as plain lowercase
`hello`, removing both `<v MARA>` and `</v>` and changing capitalization. The
suggestion is built from `plainText(cue.text)` rather than the original cue string.
This is destructive loss of standards-valid semantic markup during a core repair
path.

### CFQ-004 — Medium — Several mobile targets do not meet the 44×44 contract

At 390 px, measured visible targets included the 127×24 brand link, 30×44 theme
button, 41×19 Privacy link, 34×19 Terms link, and 35×19 footer Studio button. The
header action gap is 6 px at this breakpoint, below the specified 8 px. The native
18×18 resolved checkbox has a 44 px-high clickable label and is not counted as a
separate failure.

### CFQ-005 — Medium — Hashed assets are not served with immutable caching

Every checked live resource, including hashed JS/CSS and images, returned
`cache-control: public, must-revalidate, max-age=30`. Hashed assets should have a
long-lived immutable policy. Conditional requests do return 304, and the service
worker supplies a second cache layer, but first-party HTTP caching does not meet
the stated production policy.

### CFQ-006 — Medium — Sensitive local-first app lacks key browser policies

Live responses include HSTS, `X-Content-Type-Options: nosniff`, and
`Referrer-Policy: strict-origin-when-cross-origin`, but no Content-Security-Policy,
clickjacking protection (`frame-ancestors` or `X-Frame-Options`), or
Permissions-Policy. A CSP is particularly valuable because caption text and the
optional license token reside in browser storage. No exploit or unexpected
outbound request was found; this is defense-in-depth rather than evidence of data
exfiltration.

### CFQ-007 — Low — Toast fade briefly fails axe color contrast

One local scan launched immediately after the Undo toast appeared reported axe
`color-contrast` (serious): effective contrast 2.93:1 for “Decision undone.” while
the 180 ms opacity animation blended with the page. Stabilized local/live scans
were clean, so this is brief and timing-dependent. Avoid fading both foreground and
background together, or exclude opacity from this status transition.

## Live response observations

- Root, legal pages, manifest, service worker, assets, and artwork returned HTTPS
  200. Root/SW use a 30-second revalidation policy; conditional root GET returned
  304.
- Brotli compression is enabled for HTML, JS, and CSS.
- `manifest.webmanifest` is served as `application/octet-stream`; Chromium still
  parsed it without errors. Prefer `application/manifest+json`.
- The root has `<title>`, `lang="en"`, exactly one `<h1>`, one `<main>`, meaningful
  image alt text, and no third-party runtime dependencies.

## Release decision

Do not promote this candidate as complete. Fix CFQ-001, CFQ-002, and CFQ-003 and
rerun the end-to-end repair/export, billing, offline-update, and axe checks. The
remaining findings should be resolved before claiming the factory accessibility,
caching, and response-policy contracts.
