# Adversarial first-read review 1 — Caption Fix Queue

## Verdict: FAIL

Reviewed <https://caption-fix-queue.sociobot.in> on 2026-08-28 UTC in fresh Chromium contexts at 390 × 844 and 1440 × 900. Repository evidence was checked at `b561ed8d8d2be94867b17b1320d56101d16c52d1`.

There are four blocking findings: the first screen does not identify the user; the sample path overwrites real workspace storage; the required claim manifest/tests do not exist; and routing provides neither a working `/demo` nor a designed 404.

## Blocking findings

### B01 — The first screen does not say who this is for

**Quote:** “A field check for finished captions”; “Find the few lines worth a closer look.”; “Drop in an SRT or VTT. You’ll get a short, explainable queue of likely defects—not another full editing suite.”

| Cold-read question | 390 px | Desktop |
| --- | --- | --- |
| What does it do? | Checks an imported SRT/VTT and queues possible caption problems. | Same. |
| For whom? | Cannot answer; no role or publishing situation is named. | Cannot answer; no role or publishing situation is named. |
| What should I click first? | “Choose a file” is visible; “Try a sample” is at the viewport edge. | “Choose a file”; “Try a sample” is secondary. |

“Finished captions” also conflicts with the repair workflow. A first-time visitor cannot confirm whether this is for authors, translators, accessibility reviewers, video teams, or educators.

**Concrete fix:** Headline: “Find caption lines that need review”. Supporting sentence: “For small video teams and community educators checking SRT or WebVTT files before publishing.” Primary action: “Try it with sample data”. Adjacent consequence: “Opens seven sample cues with six findings. Demo changes are discarded.” Facts: “Caption files stay on this device”; “Works offline after the first visit”; “Free checker; Studio is $19 once”.

### B02 — “Try a sample” is not a sandbox and overwrites real data

**Quote:** “Try a sample”; resulting status “Saved locally”.

One click loads useful, realistic data: `garden-workshop-sample.srt` has seven cues and immediately shows six varied findings. However:

- The URL remains `/`; a cold `/demo` visit returns the ordinary landing page.
- There is no “Demo — sample data, nothing is saved” banner, Reset, or Start for real.
- `.factory/demo.md` is missing.
- The sample writes to real IndexedDB database `caption-fix-queue`, store `workspace`, key `current`.
- I imported `real-team-captions.srt`, confirmed it at `workspace/current`, selected “Review another file”, then “Try a sample”. The same key became `garden-workshop-sample.srt`; real work was overwritten.

**Concrete fix:** Make `/demo` a first-class route using only a `demo:` database/key namespace. Add the required persistent banner; make Reset reconstruct the seed; make Start for real discard demo state. Add an end-to-end test that seeds a real sentinel, completes and resets demo work, exits, and confirms the sentinel is byte-for-byte unchanged.

### B03 — Claims have no manifest or claim tests

**Quote:** `.factory/claims.json` is absent; `rg '@claim:' .` returns no matches.

There were no listed claim commands to run. General tests passed, but they do not provide the required claim-to-test map. Each row is a separate unlisted-claim finding; the fix is to add a claims entry at the cited location and one observable clean-demo test (or remove/rewrite the claim).

| ID | Exact unlisted claim | Why / concrete test |
| --- | --- | --- |
| UC-01 | Landing: “Stays on this device” | Absolute privacy promise. Intercept the whole demo flow and assert its separate storage namespace. |
| UC-02 | Landing: “You’ll get a short, explainable queue of likely defects—not another full editing suite.” | Undefined result. Rewrite to “Queues six types of possible caption issue and shows a reason for each”; assert all six. |
| UC-03 | Landing: “Nothing uploads” | Unscoped absolute. Rewrite to “Caption files are not uploaded”; inspect all request bodies during import/edit/export. |
| UC-04 | Landing: “No silent rewrites” | Compare imported and exported text before an explicit repair. |
| UC-05 | Landing: “Works offline” | State “after the first visit”; install the worker, go offline, reload `/demo`, repair, and export. |
| UC-06 | Landing: “SRT, WebVTT, or a project backup · parsed locally” | Split and test all three imports plus no network transmission. |
| UC-07 | Landing: “Six checks.” | Assert exactly the six named seeded check kinds. |
| UC-08 | Landing: “Each one shows its work.” | Define this as a reason plus matching text; assert both for every kind. |
| UC-09 | Landing: “Back-to-back words or cues” | Add a repeat fixture and outcome assertion. |
| UC-10 | Landing: “Cues without readable words” | Add a blank-cue fixture and outcome assertion. |
| UC-11 | Landing: “Invisible or unsafe code points” | Define the supported set and test boundary characters. |
| UC-12 | Landing: “Reading load and line length” | State thresholds and test boundary values. |
| UC-13 | Landing: “Near-matching speaker labels” | Test near and far name pairs. |
| UC-14 | Landing: “Variants of your preferred terms” | Test a seeded glossary variant. |
| UC-15 | Landing: “Private by default.” | Too broad; replace with the specific, tested caption-upload statement. |
| UC-16 | Dialog: “Checks update immediately.” | “Immediately” is unmeasured. Say “after you save the term” and assert the new finding. |
| UC-17 | Dialog: “Move a shared glossary between devices without an account.” | Export in one fresh context and import in another without authentication. |
| UC-18 | Dialog: “$19 once · one reviewer license” | Assert amount, cadence, product, and seat count against the billing contract. |
| UC-19 | Dialog: “Import and export shared glossary files” | Test both directions with a sandbox license. |
| UC-20 | Dialog: “Export a portable team review-history CSV” | Assert download name, header, rows, and entitlement. |
| UC-21 | Dialog: “Free checker, repairs, and caption/project exports stay free” | Exercise every named action without a license. |
| UC-22 | Dialog: “Checkout and refunds are handled by Sociobot/Dodo, the merchant of record.” | Assert checkout destination and link the applicable refund policy, or remove the refund statement. |
| UC-23 | Landing: “Field-guide artwork generated for this product with the factory image model.” | Record the asset hash and generation evidence, or keep this only in provenance docs. |
| UC-24 | Offline state: “Offline — your local checker still works.” | Test repair and export offline, not only shell reload. |
| UC-25 | README: “Caption Fix Queue is a local, offline-capable review queue for existing SRT and WebVTT captions.” | Split into local processing, offline, and format claims covered by network/offline/import tests. |
| UC-26 | README: “It helps small video teams and community educators find the few lines that merit a human check before publishing, without turning caption review into a full editing-suite project.” | Subjective result; replace with B01’s audience sentence. |
| UC-27 | README: “Parses SRT and WebVTT locally, preserving VTT identifiers, cue settings, notes, style blocks, regions, and header metadata.” | Round-trip a fixture for every listed construct and intercept requests. |
| UC-28 | README: “Queues explainable findings for repeated words/cues, blank cues, unsafe or invisible characters, high reading load, near-matching speaker labels, and glossary variants.” | Use the six boundary-tested fixtures from UC-09–14. |
| UC-29 | README: “Shows the evidence and neighboring cues for every finding.” | Assert evidence and neighbor behavior for middle and edge cues. |
| UC-30 | README: “Reviewers can repair text, accept it as-is, or dismiss the flag; nothing is silently rewritten.” | Test all outcomes and compare serialized captions. |
| UC-31 | README: “Saves the current document, glossary, decisions, and review history in IndexedDB.” | Reload and compare all four groups. |
| UC-32 | README: “Exports repaired SRT/VTT files and portable JSON project backups for free.” | Assert all three downloads and their contents without a license. |
| UC-33 | README: “Works as an installable PWA after its first online visit, including offline reloads.” | Validate manifest/worker, then reload demo offline. |
| UC-34 | README: “Studio is an optional $19 one-time reviewer license.” | Use the billing-contract and free-feature tests. |
| UC-35 | README: “It adds portable shared-glossary JSON and team review-history CSV exports.” | Use cross-context glossary and CSV-content tests. |
| UC-36 | README: “Checkout and license verification use only the Sociobot billing API; the free checker, repairs, and core data exports are never gated.” | Intercept checkout/verify traffic and run all free actions without a token. |
| UC-37 | README: “Requires Node.js 20 or newer.” | Enforce with CI or `engines.node`. |
| UC-38 | README: “`npm run build` is the exact deployment command.” | Add a clean-clone build claim using that exact command. |
| UC-39 | README: “It writes the static site to `dist/`, with `dist/index.html` at its root.” | Assert the directory and root file after building. |
| UC-40 | README: “Playwright is pinned to 1.58.2.” | Assert package and lock versions, or remove this duplicative sentence. |
| UC-41 | README: “Caption parsing and all checks run in the browser.” | Intercept requests while importing and running every check. |
| UC-42 | README: “No captions, glossary terms, or review history are sent to a server.” | Inspect bodies throughout import, glossary editing, decisions, export, and reload. |
| UC-43 | README: “There are no analytics, advertising scripts, third-party fonts, or runtime CDNs.” | Assert resource/request inventory and CSP origins. |
| UC-44 | README: “A Studio license is the only data sent out, and only to the Sociobot API for purchase/verification.” | Intercept licensed and unlicensed flows; distinguish necessary hosting requests. |
| UC-45 | README: “Project backups are plain JSON; repaired captions retain their original SRT or VTT format.” | Parse JSON and round-trip repaired SRT/VTT fixtures. |
| UC-46 | README: “Delete local workspace” erases the current IndexedDB record. | Seed, delete, reopen, and assert the real key is absent. |
| UC-47 | README: “Clearing site data also removes the stored Studio license token.” | Rewrite to the app-controlled behavior or test an app clear action that removes it. |
| UC-48 | README: “Production uses the registered `caption-fix-queue` product at `https://api.sociobot.in/api/v1`.” | Assert production checkout and verify URLs. |
| UC-49 | README: “Staging can override the host at build time without changing a product ID.” | Build with the variable and assert host plus product ID. |
| UC-50 | README: “The hosted buy link is always the Sociobot billing route.” | Assert the href in production and overridden builds. |
| UC-51 | README: “A license token is never treated as active until its first verification succeeds; a prior verified verdict is retained for offline use and rechecked at most once a day.” | Split into first-verification, offline-cache, and 24-hour recheck tests. |
| UC-52 | README: “It does not generate transcripts, host video, synchronize playback, or make factual corrections.” | Keep as a limitation and test that no such controls/uploads/APIs are introduced. |
| UC-53 | README: “Its checks are deliberate heuristics, so the final watch-through and accessibility decision stay with the reviewer.” | Keep the limitation, document representative false positives/negatives, and test that the UI never labels results as certification. |

Observed evidence was positive for two of these: the sample flow made no cross-origin requests, and after one online visit the sample survived an offline reload with the offline status visible. This does not cure the missing manifest or demo isolation.

### B04 — `/demo` and unknown routes render the ordinary landing page

**Evidence:** Cold `/demo` and `/this-route-does-not-exist` requests both returned HTTP 200, title “Caption Fix Queue — local SRT & VTT review”, and the normal landing h1. The demo link does not enter sample mode, and mistyped URLs get no explanation.

**Concrete fix:** Add `/demo` titled “Demo — Caption Fix Queue” that immediately opens isolated sample data. Add a styled not-found route with a distinct h1, recovery links, and a 404 response where supported. Test both from brand-new contexts and on reload.

## Major and minor findings

### M01 — Required metadata and discovery files are missing

`/`, `/privacy/`, and `/terms/` have no canonical, Open Graph title/description/image, Twitter card, or apple-touch icon. `/robots.txt` and `/sitemap.xml` return 404. Add per-route canonical/social metadata, a 1200 × 630 product-art image, 180 px apple icon, and robots/sitemap entries for every route.

### M02 — The standard skeleton and shared chrome are incomplete

The landing page stops after the import surface and “Six checks. Each one shows its work.” It lacks three-step “How it works” and plain-language limitations/privacy sections; the $19 tier is hidden in a dialog. Legal pages replace the root header/footer and omit Demo, Studio, artwork credit, “Built by Param Factory”, and a version/build ID. Add the required sections in order and use one header/footer on every route.

### M03 — Route changes do not focus or announce the new page

After following Privacy and after browser Back, `document.activeElement` was `BODY`, not the new h1. Legal pages have no polite route announcement. Focus a `tabindex="-1"` h1 after navigation, announce it in a persistent `aria-live="polite"` region, and test forward/back.

### M04 — Legal-page links miss the 44 px touch baseline

At 390 px, “Back to checker” measured 114 × 25 px; the privacy email 143 × 17 px; the support email 146 × 17 px. Give each a minimum 44 × 44 px hit area.

### M05 — Copy uses metaphors, inconsistent terms, and vague claims

Each row is a separate copy finding.

| ID | Quote | Why | Proposed rewrite |
| --- | --- | --- | --- |
| C-01 | “A field check for finished captions” | Metaphor; “finished” conflicts with repair. | “Check captions before publishing” |
| C-02 | “Find the few lines worth a closer look.” | The h1 omits captions and fails out of context. | “Find caption lines that need review” |
| C-03 | “short, explainable queue of likely defects—not another full editing suite” | Unquantified adjective plus jargon/comparison. | “The checker queues possible caption issues and shows the reason for each.” |
| C-04 | “The field key” | Metaphorical heading fails out of context. | “What the checker finds” |
| C-05 | “Invisible or unsafe code points” | Developer terminology. | “Hidden or unsupported characters” |
| C-06 | “Keep the field notes moving across your team.” | Metaphor does not name the paid result. | “Share glossaries and export team review history” |
| C-07 | “merchant of record” | Payment-industry jargon. | “Sociobot/Dodo handles payment and refunds.” |
| C-08 | “Buy Studio securely” | Unsupported marketing adverb. | “Buy Studio — $19” |
| C-09 | “portable” in three export descriptions | Vague adjective. | Use “downloadable”, or state exact import/export behavior. |
| C-10 | “IndexedDB” in reader-facing privacy copy | Unexplained implementation detail. | First use: “this browser’s local storage (IndexedDB)”; then “local storage”. |
| C-11 | “installable PWA” | Unexplained acronym. | “installable web app” |
| C-12 | “runtime CDNs” | Developer jargon in a privacy promise. | “services that load code or fonts from other sites” |
| C-13 | README heading “Configuration” | Ambiguous in a headings-only list. | “Configure the billing API” |
| C-14 | README heading “Scope” | Ambiguous in a headings-only list. | “What Caption Fix Queue does not do” |
| C-15 | “Theme” | Visible button is a noun. | “Use dark theme” / “Use light theme” |
| C-16 | “Get Studio” | It opens information; it does not get Studio. | “View Studio options” |
| C-17 | “Try a sample” | Does not use the required explicit demo wording. | “Try it with sample data” |
| C-18 | Footer “Studio” | Noun button does not name its result. | “View Studio options” |
| C-19 | “likely defects”, “findings”, “checks”, “flags”, and “lines” | The queued item changes name. | Use “findings” for queued items, “checks” for rules, “caption lines” for source text. |
| C-20 | README audience sentence (R03), 28 words | Over 22 words and carries four ideas. | “Small video teams and community educators use it before publishing. It queues caption lines that need a human check.” |
| C-21 | README license sentence (R36), 29 words | Over 22 words and carries three rules. | “A new token stays inactive until verification succeeds. A verified result works offline. The app checks it again after 24 hours.” |

No banned plain-words term appears. R03 and R36 are the only items over 22 words. “Choose a file”, “Paste captions”, “Check pasted captions”, “Add term”, “Import JSON”, “Export JSON”, and “Restore purchase” adequately name their actions.

## Complete copy audit

Counts treat hyphenated/slash terms, URLs, paths, commands, and versions as one word; an em dash separates words. The landing inventory includes meaningful initial-route text, hidden dialogs, the offline message, and image alt. Decorative glyphs are excluded; repeated Privacy/Terms links appear once.

### Landing route

| ID | Exact copy | Words |
| --- | --- | ---: |
| L01 | Skip to caption review | 4 |
| L02 | Caption Fix Queue | 3 |
| L03 | Stays on this device | 4 |
| L04 | Theme | 1 |
| L05 | Get Studio | 2 |
| L06 | A field check for finished captions | 6 |
| L07 | Find the few lines worth a closer look. | 8 |
| L08 | Drop in an SRT or VTT. | 6 |
| L09 | You’ll get a short, explainable queue of likely defects—not another full editing suite. | 14 |
| L10 | Nothing uploads | 2 |
| L11 | No silent rewrites | 3 |
| L12 | Works offline | 2 |
| L13 | Bring in your captions | 4 |
| L14 | Drop an .srt or .vtt here | 6 |
| L15 | Choose a file | 3 |
| L16 | Paste captions | 2 |
| L17 | Try a sample | 3 |
| L18 | SRT, WebVTT, or a project backup · parsed locally | 8 |
| L19 | The field key | 3 |
| L20 | Six checks. | 2 |
| L21 | Each one shows its work. | 5 |
| L22 | Repeat | 1 |
| L23 | Back-to-back words or cues | 4 |
| L24 | Blank run | 2 |
| L25 | Cues without readable words | 4 |
| L26 | Character | 1 |
| L27 | Invisible or unsafe code points | 5 |
| L28 | Reading speed | 2 |
| L29 | Reading load and line length | 5 |
| L30 | Speaker | 1 |
| L31 | Near-matching speaker labels | 3 |
| L32 | Glossary | 1 |
| L33 | Variants of your preferred terms | 5 |
| L34 | Private by default. | 3 |
| L35 | Built for the last careful pass. | 6 |
| L36 | Privacy | 1 |
| L37 | Terms | 1 |
| L38 | Studio | 1 |
| L39 | Field-guide artwork generated for this product with the factory image model. | 11 |
| L40 | Local import | 2 |
| L41 | Paste caption text | 3 |
| L42 | File name | 2 |
| L43 | SRT or WebVTT captions | 4 |
| L44 | Check pasted captions | 3 |
| L45 | Preferred terms | 2 |
| L46 | Glossary | 1 |
| L47 | List a preferred spelling and comma-separated variants. | 7 |
| L48 | Checks update immediately. | 3 |
| L49 | Preferred spelling | 2 |
| L50 | Variants to flag | 3 |
| L51 | Example: bio-char, bio char | 4 |
| L52 | Add term | 2 |
| L53 | biochar | 1 |
| L54 | bio-char, bio char | 3 |
| L55 | Remove | 1 |
| L56 | Portable glossary · Studio | 3 |
| L57 | Move a shared glossary between devices without an account. | 9 |
| L58 | Import JSON · Unlock | 3 |
| L59 | Export JSON · Unlock | 3 |
| L60 | One-time Studio unlock | 3 |
| L61 | Keep the field notes moving across your team. | 8 |
| L62 | $19 once · one reviewer license | 5 |
| L63 | Import and export shared glossary files | 6 |
| L64 | Export a portable team review-history CSV | 6 |
| L65 | Free checker, repairs, and caption/project exports stay free | 8 |
| L66 | Buy Studio securely | 3 |
| L67 | Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. | 11 |
| L68 | Have a license? Paste it here | 6 |
| L69 | Restore purchase | 2 |
| L70 | Offline — your local checker still works. | 6 |
| L71 | A pressed maidenhair fern arranged around three blank archival caption strips | 11 |

### README

Headings and link labels are included because they must make sense out of context.

| ID | Exact copy | Words |
| --- | --- | ---: |
| R01 | Caption Fix Queue | 3 |
| R02 | Caption Fix Queue is a local, offline-capable review queue for existing SRT and WebVTT captions. | 15 |
| R03 | It helps small video teams and community educators find the few lines that merit a human check before publishing, without turning caption review into a full editing-suite project. | **28** |
| R04 | Live product: https://caption-fix-queue.sociobot.in | 3 |
| R05 | What it does | 3 |
| R06 | Parses SRT and WebVTT locally, preserving VTT identifiers, cue settings, notes, style blocks, regions, and header metadata. | 17 |
| R07 | Queues explainable findings for repeated words/cues, blank cues, unsafe or invisible characters, high reading load, near-matching speaker labels, and glossary variants. | 21 |
| R08 | Shows the evidence and neighboring cues for every finding. | 9 |
| R09 | Reviewers can repair text, accept it as-is, or dismiss the flag; nothing is silently rewritten. | 15 |
| R10 | Saves the current document, glossary, decisions, and review history in IndexedDB. | 11 |
| R11 | Exports repaired SRT/VTT files and portable JSON project backups for free. | 11 |
| R12 | Works as an installable PWA after its first online visit, including offline reloads. | 13 |
| R13 | Studio is an optional $19 one-time reviewer license. | 8 |
| R14 | It adds portable shared-glossary JSON and team review-history CSV exports. | 10 |
| R15 | Checkout and license verification use only the Sociobot billing API; the free checker, repairs, and core data exports are never gated. | 21 |
| R16 | Develop and verify | 3 |
| R17 | Requires Node.js 20 or newer. | 5 |
| R18 | `npm run build` is the exact deployment command. | 8 |
| R19 | It writes the static site to `dist/`, with `dist/index.html` at its root. | 12 |
| R20 | Preview the production build with `npm run preview`. | 8 |
| R21 | Playwright is pinned to 1.58.2. | 5 |
| R22 | In the factory worker image its browsers are read from `PLAYWRIGHT_BROWSERS_PATH`; elsewhere, run `npx playwright install chromium` once before the end-to-end suite. | 22 |
| R23 | Privacy and data ownership | 4 |
| R24 | Caption parsing and all checks run in the browser. | 9 |
| R25 | No captions, glossary terms, or review history are sent to a server. | 12 |
| R26 | There are no analytics, advertising scripts, third-party fonts, or runtime CDNs. | 11 |
| R27 | A Studio license is the only data sent out, and only to the Sociobot API for purchase/verification. | 17 |
| R28 | See `/privacy/` and `/terms/`. | 4 |
| R29 | Project backups are plain JSON; repaired captions retain their original SRT or VTT format. | 14 |
| R30 | “Delete local workspace” erases the current IndexedDB record. | 8 |
| R31 | Clearing site data also removes the stored Studio license token. | 10 |
| R32 | Configuration | 1 |
| R33 | Production uses the registered `caption-fix-queue` product at `https://api.sociobot.in/api/v1`. | 8 |
| R34 | Staging can override the host at build time without changing a product ID: | 13 |
| R35 | The hosted buy link is always the Sociobot billing route. | 10 |
| R36 | A license token is never treated as active until its first verification succeeds; a prior verified verdict is retained for offline use and rechecked at most once a day. | **29** |
| R37 | Scope | 1 |
| R38 | This app reviews captions already made. | 6 |
| R39 | It does not generate transcripts, host video, synchronize playback, or make factual corrections. | 13 |
| R40 | Its checks are deliberate heuristics, so the final watch-through and accessibility decision stay with the reviewer. | 16 |
| R41 | Visual rationale and original-image provenance are in `.factory/design.md`. | 8 |
| R42 | Build verification is recorded in `.factory/handoff.md`. | 6 |
| R43 | License | 1 |
| R44 | MIT | 1 |

## Checks that passed

- Root, Privacy, and Terms return 200, set `lang="en"`, contain one h1/main, and use acceptable title patterns. Root title is 46 characters.
- Root meta description, SVG favicon, manifest, theme color, CSP, referrer policy, content-type protection, and permissions policy are present.
- All rendered HTTP links crawled successfully: Home, Privacy, Terms, and Sociobot checkout returned 200; mail links were exempt.
- Console/page-error capture was empty on both cold viewports.
- Axe found zero serious/critical violations on landing, sample light/dark, Privacy, and Terms at both viewports.
- There was no 390 px horizontal overflow. Reduced-motion CSS suppresses practical transition/animation duration.
- The herbarium paper, botanical illustration, serif/sans pairing, clipped-paper controls, and finding glyphs are distinct and not a generic SaaS template.
- The factory URL verifier passed its title/language/h1/main/alt/button/console checks.
- Built JavaScript is 37.54 kB raw / 12.89 kB gzip; `dist/` is produced.

## Verification results

Clean clone: `/tmp/caption-fix-queue-review.BsTm19` at the required base commit.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 61 packages, 0 vulnerabilities reported |
| `npm test` | Pass; 4 files, 13 tests |
| `npm run build` | Pass; `dist/` produced |
| `npm run test:e2e` | Pass; 15 passed, 1 intended desktop skip |
| Commands in `.factory/claims.json` | **Blocked: file missing; zero commands exist** |
| `rg '@claim:' .` | **Zero tagged claim tests** |
| `/opt/fleet/lib/verify-url.sh` | Pass; baseline checks, no console errors |
| Live axe scans | Pass; zero serious/critical findings in tested states |
| Live sample interception | Same-origin requests only in the observed unlicensed flow |
| Live offline reload | Pass after first online visit |
| Live real-data isolation probe | **Fail; sample replaced the real `workspace/current` document** |

Passing baseline checks do not change the FAIL verdict while B01–B04 remain.
