# Verify caption files before publishing — verification 5

## Verdict: FAIL

Verified 5 September 2026 against the deployed product at
<https://caption-fix-queue.sociobot.in> and a clean checkout of implementation
candidate `b4cdbd22bf5a3d9200bc0a16e78050fcc86ce7f1`.

There is **one low-severity finding**, no high- or medium-severity finding, and
**zero untested claims**. The product works end to end, the live files match the
candidate, and every declared claim command passes. It cannot receive a PASS
because browser Back does not restore focus to the landing heading.

## Product and audience

Caption Fix Queue reviews existing SRT and WebVTT captions before publishing.
It is for small video teams and community educators. On both a fresh 1440×900
desktop page and a fresh 390×844 phone page, the first screen showed:

- Job: “Find caption lines that need review”.
- Audience: “For small video teams and community educators checking SRT or
  WebVTT files before publishing.”
- First action: “Try it with sample data”.

All three appeared before scrolling. The adjacent text says the action opens
seven sample cues with six findings and discards demo changes. The three facts
state local files, offline use after the first visit, and the free/$19 split.

## Candidate and live identity

- Implementation candidate: `b4cdbd22bf5a3d9200bc0a16e78050fcc86ce7f1`.
- Implementation parent for the backup-import repair:
  `3ac9147acc63ffce920271375061c5462b2d5d9f`.
- Documentation evidence: `9fb4fdc81e548b1199663a2d09489136b66c6c16`.
- Final prior documentation: `c835ed3`.
- Repository head at verification start: `02af96a2051f24f554e5c31ad4c3eb6b351f47e9`.
  Its changes after `c835ed3` are limited to `graphify-out` files and do not
  change the product or deployed image.
- Deployment recorded in the handoff:
  `dc190496-2750-49ca-8a32-9a7740def83a`.

The clean build matched **all 21 public live files byte for byte by SHA-256**.
`staticwebapp.config.json` was excluded because it is deployment configuration,
not a public file. The live app references candidate assets
`app-BEFTlFLp.js` and `app-C_XfDjsl.css`.

## Finding

### CFQ5-001 — Low — browser Back does not restore focus to the landing heading

Steps in fresh Chromium contexts:

1. Open `/`.
2. Follow the header “Demo” link.
3. Use browser Back.
4. Inspect `document.activeElement` after the landing page returns.

The landing page and title return correctly, but focus is on `BODY`, not the
landing `h1`. This reproduced at desktop and 390 px. Direct visits to `/demo`,
`/privacy/`, `/terms/`, and the designed 404 do focus their headings. A fresh
landing page also correctly leaves focus at the document so the first Tab
reaches the visible skip link.

This reopens the browser-Back part of review-1 finding M03. Commit `b4cdbd2`
changed the `pageshow` handler to focus the heading only when
`event.persisted` is true. Chromium reports a back/forward navigation here but
does not restore the page from its back-forward cache, so the handler does not
move focus or announce the route.

Expected: browser Back restores the landing route and moves focus to its `h1`,
while a fresh landing visit still starts at the skip link. Add a browser test
that follows Demo, calls `goBack()`, and asserts landing-heading focus. One
possible implementation is to recognize a `back_forward` Navigation Timing
entry in addition to a persisted `pageshow` event.

Impact is low because the page, title, actions, and skip link remain available.
It still violates the required back/forward focus behavior and the earlier
finding is not fully resolved.

## Clean-checkout quality gates

Clean detached worktree:
`/tmp/caption-fix-queue-verify5.dn69oV` at the full candidate SHA above.

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`; 61 packages, 0 reported vulnerabilities |
| Unit and configuration tests | PASS | `npm test`; 5 files, 15/15 tests |
| Type check and build | PASS | `npm run build`; TypeScript passed and Vite emitted `dist/index.html` |
| Full browser suite | PASS | `npm run test:e2e`; 40 passed, 2 intentional project-specific skips, 42 scheduled |
| Clean tree | PASS | no tracked change in the detached candidate after install, tests, and build |
| Lint | N/A | no lint command or lint configuration is declared |

Build sizes remain within the contract:

- App JavaScript: 43,119 bytes raw, 14,250 bytes gzip.
- App CSS: 22,714 bytes raw, 5,890 bytes gzip.
- Hero WebP: 93,780 bytes.
- No font files or remote fonts ship.

## Declared claims

`.factory/claims.json` has 12 unique claim IDs, 12 unique commands, and exactly
one matching `@claim:<id>` test for each claim. Every command was run
individually from the clean candidate checkout.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | real IndexedDB record remained byte-for-byte equal after demo changes, reset, and exit; demo record was removed |
| `local-processing` | PASS | full free repair/glossary/decision/export flow made only same-origin requests and kept demo data separate |
| `six-checks` | PASS | seven cues, six finding kinds, reasons, matching text, first/middle/last nearby context, and rule boundaries passed |
| `explicit-repairs` | PASS | export stayed unchanged before repair and changed only after the reviewer saved a repair |
| `offline-demo` | PASS | fresh worker-controlled demo reloaded, repaired, and exported offline |
| `format-roundtrip` | PASS | SRT and metadata-rich VTT round-tripped; a populated JSON backup restored document, glossary, decision, history, and VTT in a new browser context |
| `local-persistence` | PASS | captions, glossary, decisions, and history survived reload; Delete local workspace removed the record |
| `shared-glossary` | PASS | mocked valid Studio license transferred glossary JSON between two fresh browser contexts |
| `studio-contract` | PASS | $19 once/one reviewer, free core exports, purchase terms, licensed CSV contents, and 24-hour verification cache passed |
| `review-scope` | PASS | copy and controls identify review only, with no transcription, hosting, or accessibility certification |
| `static-build` | PASS | Node 20+, pinned Playwright 1.58.2, exact build, and `dist/index.html` passed |
| `art-provenance` | PASS | shipped WebP hash matched the recorded factory-generated asset |

There is no unlisted or untested public capability claim. The visible numeric
check thresholds are exercised by the `six-checks` boundary assertions. The
plain-language limitations and payment terms are exercised by their claim
tests. No AI feature is needed for the brief: local import/export and
explainable human review cover the implied useful steps without sending caption
content to a model.

## Live demo and user paths

Fresh desktop and phone contexts both completed the one-click sample path.

- `/demo` and `/?demo=1` opened `garden-workshop-sample.srt` immediately.
- The workspace showed seven cues and six findings: Repeat, Reading speed,
  Glossary, Speaker, Character, and Blank run.
- Each selected finding had a reason, matching text, and nearby cues. The middle
  finding showed one cue on each side.
- The “Demo — sample data, nothing is saved to your workspace” label remained
  visible after scrolling and after a decision.
- Reset demo returned the queue to six open findings.
- Start for real deleted `demo:caption-fix-queue` and restored a previously
  saved real workspace byte for byte.

Normal, invalid, boundary, and recovery checks passed:

- Valid SRT, metadata-rich WebVTT, and populated project backup import/export.
- Repair, suggested repair, accept, dismiss, Undo, glossary changes, history,
  refresh persistence, and confirmed local deletion.
- Malformed pasted text gave the nearby missing-timing message, then accepted a
  corrected caption in the same dialog.
- Reverse timing and malformed project JSON gave specific recovery text.
- A 5,000,000-byte SRT was accepted. A 5,000,001-byte file was rejected with
  instructions to split it.
- WebVTT voice markup, cue identifier, and settings survived the repeat repair.
- `J`, `K`, `E`, `A`, and `D` worked from the keyboard. Repair moved focus into
  its editor, and dialogs took and returned focus.

## Accessibility, routes, and links

- `/opt/fleet/lib/verify-url.sh` passed live HTTPS, title, language, one `h1`,
  main landmark, image alt, button names, and console checks. Load to network
  idle was 1,544 ms in that check.
- Fresh live axe scans on landing, populated demo, and dark workspace states had
  zero serious or critical violations at desktop and phone sizes.
- The phone scan found no visible interactive target below 44×44 px. The page
  had no horizontal overflow at normal size. Content and controls remained
  present under a 200% scaling check.
- The first Tab on a fresh landing page focused the visible skip link, and Enter
  targeted `#main`. Focus rings were visible.
- Reduced-motion Chromium computed transition and animation duration as
  `0.00001s`.
- `/`, `/demo`, `/privacy/`, and `/terms/` returned 200 with distinct titles,
  one `h1`, header, main, footer, canonical URL, description, Open Graph image,
  and Twitter card.
- The unknown route returned the expected HTTP 404, the title
  “Page not found — Caption Fix Queue”, a designed recovery page, and working
  links. Its expected 404 network message is not a defect.
- Every discovered same-origin link returned its intended 200 or the deliberate
  404. The two email links were valid `mailto:` addresses.
- The browser-Back focus exception is CFQ5-001 above.

## PWA, privacy, payment, and response policy

- A fresh live 390 px demo installed the worker, reloaded offline, displayed the
  offline status, saved a repair, and exported the repaired SRT with no console
  error.
- The unmodified candidate shell was also served on a temporary local origin.
  Changing only the served worker version from `caption-fix-v8` to a verification
  version created the new shell cache and displayed “A fresh field guide is
  ready. Reload to update.” This proves the update path without changing product
  source or production.
- Live free-use request logs were same-origin only. No caption, glossary, or
  review content was sent to another origin. No analytics, ad, tracking, remote
  font, or runtime CDN request appeared.
- The Studio checkout returned HTTP 303 to the hosted Dodo checkout. A distinct
  invalid license returned HTTP 200 with `valid: false` and reason `invalid`.
- A 40-request invalid-license burst returned 29 × 200 and 11 × 429. Every 429
  included `Retry-After: 4`. No credential was used or recorded.
- This is a static PWA, so tenant isolation, server restart persistence, and a
  product health endpoint do not apply. The only remote product integration is
  the scoped billing route tested above.
- HTTP redirects to HTTPS. Live responses include HSTS, CSP with
  `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options: DENY`.
- Hashed assets use one-year immutable caching, `sw.js` uses `no-cache`, and the
  manifest has the correct web-manifest MIME type.

## Performance

Lighthouse 13.4.1 completed successfully against the live phone profile. This
closes the partial-report limitation from verification 4.

| Category or metric | Result |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First contentful paint | 999 ms |
| Largest contentful paint | 1,352 ms |
| Total blocking time | 137 ms |
| Cumulative layout shift | 0 |
| Transfer size | 126,388 bytes |

Full JSON: `/work/.evidence/caption-fix-queue-verify-5/lighthouse.json`.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Review 1 B01, first-screen job/audience/action | RESOLVED on desktop and phone |
| Review 1 B02, sample overwrote real work | RESOLVED; live real-work sentinel stayed byte-for-byte equal |
| Review 1 B03 and unlisted claims | RESOLVED; 12/12 unique commands pass and no claim is untested |
| Review 1 B04, demo and unknown routes | RESOLVED; demo is direct and unknown routes return the designed 404 |
| Review 1 M01/M02, metadata and site structure | RESOLVED on all routes |
| Review 1 M03, route and Back focus | **PARTLY REGRESSED; CFQ5-001** |
| Review 1 M04, legal touch targets | RESOLVED |
| Review 1 M05, copy, terms, and wording | RESOLVED; current copy audit has no over-22-word or banned-term item |
| Review 2 F-2-1, JSON backup claim | RESOLVED by fresh-context populated restore test |
| Review 2 F-2-2, seven cues/context/payment terms | RESOLVED and observed live |
| Review 2 F-2-3, unexplained “heuristics” | RESOLVED with plain-language limits |
| Verification 1 CFQ-001, unavailable checkout | RESOLVED; live hosted checkout redirect works |
| Verification 1 CFQ-002, repair Undo | RESOLVED by export regression test |
| Verification 1 CFQ-003, VTT markup loss | RESOLVED by markup/identifier/settings regression test |
| Verification 1 CFQ-004 through CFQ-007, targets/cache/headers/toast | RESOLVED by live measurements and browser tests |
| Verification 2 CFQ2-001, checkout | RESOLVED |
| Verification 2 CFQ2-002, offline first verification | RESOLVED; an unverified token stays locked |
| Verification 3 CFQ3-001, missing rate limit | RESOLVED; live 429 responses include `Retry-After` |
| Verification 4 Lighthouse limitation | RESOLVED; complete Lighthouse report produced |

## Release decision

**FAIL.** Finding count: **1**. Untested claim count: **0**. Fix CFQ5-001 and
rerun its browser-Back focus regression plus the normal clean gates. No product
code was changed during this verification.
