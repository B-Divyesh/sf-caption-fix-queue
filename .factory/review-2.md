# Adversarial first-read review 2 — Caption Fix Queue

## Verdict: FAIL

Reviewed the live product on 28 August 2026 UTC in fresh Chromium profiles at 390 × 844 and 1440 × 900. Repository and claim evidence came from a fresh clone at `fa0b57050ce80abc66919028a7c70a35d7b3930d`.

The first screen is clear and the demo is useful. This cannot pass because one published import claim has no test that performs the promised import, and three smaller copy/claim items remain. No declared claim command failed.

## Cold first read

| Question before scrolling | 390 px | Desktop |
| --- | --- | --- |
| What does it do? | Finds caption lines that need human review before publishing. | Same. |
| For whom? | Small video teams and community educators checking SRT or WebVTT files. | Same. |
| What should I click first? | **Try it with sample data**; the note says it opens seven sample cues with six findings. | Same. |

The visible first-screen copy is: “Find caption lines that need review”; “For small video teams and community educators checking SRT or WebVTT files before publishing.”; and “Try it with sample data”. It answers all three cold-read questions without scrolling. The botanical field-guide surface is distinct from a generic SaaS template and keeps the import plot above the fold on both viewports.

## Findings

### F-2-1 — BLOCKING — The JSON-backup import claim is not tested

**Claim and location:** `.factory/claims.json`, `format-roundtrip`: “SRT, WebVTT, and JSON project backups import locally; exports preserve the caption format and WebVTT metadata.” The landing repeats “Imports SRT, WebVTT, or a JSON project backup in this browser.” README: “Imports SRT, WebVTT, and JSON project backups in the browser.”

**Evidence:** `npm run test:claims -- --grep @claim:format-roundtrip` passed. However, `tests/e2e/claims.spec.ts` uploads an SRT and a WebVTT, exports a project backup, and parses that download with `JSON.parse`. It never uploads the JSON file through `#project-file` or the regular import control, and never asserts that its document, glossary, decisions, and history are restored. The feature exists in `src/app.ts`, but the claim test does not demonstrate the promised JSON import from a clean state.

**Why this fails first-read honesty:** A reviewer can rely on “project backup import” before using the tool. The claims contract requires an observable test of that result, not only proof that the export has valid JSON.

**Concrete fix:** Extend this one tagged test to export a backup with a known caption, glossary term, resolved finding, and history row; open a fresh browser context; upload that JSON through project import; and assert the restored heading, glossary, finding status, history export, and format.

### F-2-2 — MINOR — Three visitor-facing claims have no matching manifest claim

| Exact quote and location | Why it is unlisted | Concrete fix |
| --- | --- | --- |
| “Opens **seven** sample cues with six findings.” — landing hero; “The demo has **seven** cues and six findings.” — README | `six-checks` asserts six findings, but no claim or assertion covers seven cues. | Expand `six-checks` to say “seven sample cues and six finding kinds”, then assert the `7 cues` count and six finding rows. |
| “Shows nearby cues for context.” — README | No manifest claim promises neighboring context. The broader test happens to inspect two findings only. | Add nearby-context wording to `six-checks` and assert first, middle, and last findings; or remove the sentence. |
| “Sociobot/Dodo handles payment and refunds.” — Studio dialog on landing | `studio-contract` checks price, checkout URL, free exports, and purchase-terms link. It does not establish who handles refunds. | Add a claim with a fixture or checkout contract that verifies merchant/refund policy, or replace it with “Read the purchase terms before buying.” |

### F-2-3 — MINOR — “Heuristics” is unexplained jargon in the plain-language promise

**Quote and location:** “Checks are heuristics, not accessibility certification.” — landing **Privacy and limits** section. README: “Its checks are heuristics and may miss problems or flag acceptable text.”

**Why:** “Heuristics” is implementation vocabulary. A visitor needs the consequence, not the label, when deciding whether a caption check is safe to rely on.

**Concrete rewrite:** “These checks can miss problems or flag acceptable text. They do not certify accessibility.” Use the same wording on the landing and in the README.

## Copy audit

Counts treat hyphenated terms, file formats, URLs, paths, commands, and versions as one word. Headings and action labels are included because they are heard out of context by screen-reader users. No audited sentence exceeds 22 words. No banned marketing adjective appears. Aside from F-2-3, headings are meaningful and actions name outcomes: “Try it with sample data”, “Choose a caption file”, “Export repairs”, “Reset demo”, and “Start for real”.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Check captions before publishing | 4 | Pass |
| Find caption lines that need review | 6 | Pass |
| For small video teams and community educators checking SRT or WebVTT files before publishing. | 13 | Pass |
| Opens seven sample cues with six findings. | 7 | F-2-2 |
| Demo changes are discarded. | 4 | Pass |
| Caption files stay on this device | 6 | Pass |
| Works offline after the first visit | 6 | Pass |
| Free checker; Studio is $19 once | 6 | Pass |
| Check your caption file | 5 | Pass |
| Drop an .srt or .vtt here | 6 | Pass |
| Imports SRT, WebVTT, or a JSON project backup in this browser. | 11 | F-2-1 |
| Six checks with a reason and matching text | 8 | Pass |
| Repeated words or neighboring cues | 5 | Pass |
| Cues without readable words | 4 | Pass |
| Hidden or unsupported characters | 4 | Pass |
| Over 20 characters per second, 42 characters per line, or two lines | 12 | Pass |
| Speaker labels within two edits of each other | 8 | Pass |
| Listed variants of a preferred term | 6 | Pass |
| Review captions in three steps | 5 | Pass |
| Choose an SRT, WebVTT, or JSON project backup. | 8 | F-2-1 |
| See the reason, matching text, and nearby cues. | 8 | F-2-2 |
| Download captions in their original format or save a JSON backup. | 11 | Pass |
| Your captions stay under your control | 6 | Pass |
| Caption text is processed in this browser and is not uploaded. | 11 | Pass |
| Checks are heuristics, not accessibility certification. | 6 | F-2-3 |
| The checker does not create transcripts or host video. | 8 | Pass |
| It does not change caption text until you choose a repair. | 11 | Pass |
| A final watch-through still needs a person. | 7 | Pass |
| Share glossaries and export team review history | 7 | Pass |
| $19 once for one reviewer. | 5 | Pass |
| The checker, repairs, caption exports, and project backups stay free. | 10 | Pass |
| Demo — sample data, nothing is saved to your workspace | 10 | Pass |
| Use the six seeded findings without changing your real captions. | 9 | Pass |
| Sociobot/Dodo handles payment and refunds. | 5 | F-2-2 |
| Review SRT and WebVTT caption findings in your browser. | 9 | Pass |
| Original field-guide artwork generated with the factory image model. | 8 | Pass |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Review existing SRT and WebVTT caption files before publishing. | 9 | Pass |
| Small video teams and community educators use the checker to find lines needing a human review. | 14 | Pass |
| Try the isolated sample at `https://caption-fix-queue.sociobot.in/?demo=1`. | 6 | Pass |
| Imports SRT, WebVTT, and JSON project backups in the browser. | 9 | F-2-1 |
| Runs six caption checks and explains each finding with matching text. | 11 | Pass |
| Shows nearby cues for context. | 5 | F-2-2 |
| Lets reviewers repair text, accept it, or dismiss a finding. | 10 | Pass |
| Saves captions, glossary terms, decisions, and review history in local storage. | 11 | Pass |
| Exports repaired captions and JSON project backups for free. | 9 | Pass |
| Works offline after the first visit, including repair and export. | 9 | Pass |
| The demo has seven cues and six findings. | 7 | F-2-2 |
| It uses the separate `demo:caption-fix-queue` database. | 5 | Pass |
| Resetting or leaving the demo deletes that sample state without changing the real workspace. | 13 | Pass |
| Studio costs $19 once for one reviewer. | 7 | Pass |
| It adds glossary JSON transfer and team review-history CSV export. | 10 | Pass |
| The checker, repairs, captions, and project backups stay free. | 9 | Pass |
| Use Node.js 20 or newer. | 5 | Pass |
| `npm run build` writes the static deployment to `dist/`. | 9 | Pass |
| Its root file is `dist/index.html`. | 5 | Pass |
| Preview it with `npm run preview`. | 6 | Pass |
| Playwright is pinned to 1.58.2. | 5 | Pass |
| The factory image provides its browsers through `PLAYWRIGHT_BROWSERS_PATH`. | 8 | Pass |
| Elsewhere, run `npx playwright install chromium`. | 6 | Pass |
| Every public product claim and its test command is listed in `.factory/claims.json`. | 12 | Pass |
| Demo details are in `.factory/demo.md`. | 5 | Pass |
| Caption checks run in the browser. | 6 | Pass |
| Free use does not upload captions, glossary terms, or review history. | 11 | Pass |
| The app loads no analytics, ads, tracking scripts, third-party fonts, or third-party runtime code. | 14 | Pass |
| Studio purchase and verification use the Sociobot billing API. | 8 | Pass |
| Verification sends the license token, not caption content. | 8 | Pass |
| Project backups are JSON files. | 5 | Pass |
| Repaired captions keep their SRT or WebVTT format. | 8 | Pass |
| “Delete local workspace” removes the current workspace record. | 7 | Pass |
| Production uses the `caption-fix-queue` product at `https://api.sociobot.in/api/v1`. | 5 | Pass |
| Set another API base during a staging build. | 8 | Pass |
| It does not create transcripts, host video, synchronize playback, or make factual corrections. | 13 | Pass |
| Its checks are heuristics and may miss problems or flag acceptable text. | 12 | F-2-3 |
| A person makes the final publishing decision. | 6 | Pass |
| The visual rationale and original-image provenance are in `.factory/design.md`. | 8 | Pass |
| Repair evidence is recorded in `.factory/handoff.md`. | 6 | Pass |

## Demo, privacy, claims, and sandbox verification

- A fresh `/demo` and `/?demo=1` visit immediately rendered `garden-workshop-sample.srt`, seven displayed cues, six varied findings, the persistent demo banner, **Reset demo**, and **Start for real**. This is a useful one-click starting state, not an empty tour.
- Live `indexedDB.databases()` after demo entry contained only `demo:caption-fix-queue`. The clean-clone isolation test seeded real work, changed/reset/exited demo, and passed its byte-for-byte comparison.
- The live request log contained only the product origin: HTML, artwork, app JavaScript, and CSS. A worker-controlled demo reload displayed the offline banner and sample finding while the browser context was offline.
- All 12 manifest commands passed independently. F-2-1 is a gap in what one passing test observes, not a failing command.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; clean clone, 0 reported vulnerabilities |
| `npm test` | Pass; 15 tests |
| `npm run build` | Pass; static `dist/index.html` generated |
| 12 declared claim commands | Pass individually |
| `npm run test:e2e` | Pass; 40 tests, 2 expected viewport skips |
| Live console/page errors, phone and desktop | None observed |
| Built primary JavaScript | 43.10 kB raw, 14.24 kB gzip |

## Structure, accessibility, and routing

- `/`, `/demo`, `/privacy/`, `/terms/`, and the designed unknown-route page had one h1, a `<main>`, the expected title pattern, description, canonical, OG/Twitter metadata, favicon, and apple-touch icon. Direct `/demo` was titled “Demo — Caption Fix Queue”; an unknown route returned HTTP 404 with “This page is not in the field guide”.
- The live link crawl found live internal routes and the documented checkout endpoint (HTTP 303 to Dodo). Mail links were explicit `mailto:` links. The current-page skip anchor on the 404 retains that page’s 404 status and is not a broken navigation target.
- Fresh direct legal, demo, and 404 loads focused their h1. `/?studio=1` opened the Studio dialog and focused its close control, so legal-page Studio links work. Back/forward uses normal document navigation on legal routes.
- The repository Playwright axe coverage passed for landing, sample work, and dark mode with no serious or critical violations. Its 390 px target-size and legal-route focus tests passed. No horizontal overflow appeared at 390 px.
- `robots.txt`, `sitemap.xml`, manifest, CSP, referrer policy, content-type and frame protection, and reduced-motion behavior are present. The original herbarium asset provenance test passes. The paper/fern/annotation treatment is recognizably product-specific, not a shared card-and-gradient template.

## Earlier-review follow-through

Read `.factory/review-1.md`, all available verification notes, and the prior handoff. There are no `.factory/polish-*.md` files.

| Earlier id | Current verification |
| --- | --- |
| B01 cold first screen | Fixed: job, audience, primary sample action, consequence, and three facts are above the fold at both viewports. |
| B02 unsafe sample | Fixed: separate demo database, reset/exit controls, and passed real-sentinel isolation test. |
| B03 missing claims manifest/tests | Fixed as originally written: manifest exists and every declared command passes. F-2-1 is a new inadequate observation within one declared test. |
| B04 `/demo` and 404 routing | Fixed: direct demo has isolated sample/title; unknown route returns designed HTTP 404. |
| M01 metadata/discovery | Fixed: route metadata, icons, canonical/social tags, robots, and sitemap are live. |
| M02 skeleton/shared chrome | Fixed: header/footer, import surface, checks, three steps, limits, and Studio section are present. |
| M03 route focus/announcement | Fixed on direct legal/demo/404 routes and the Studio deep link. |
| M04 mobile target sizes | Fixed by 390 px regression checks and phone inspection. |
| M05 copy labels/terminology | Old wording is gone. F-2-3 records the remaining plain-language jargon. |

No prior finding is merely marked fixed or has regressed under its original condition.

## Missed leverage

The brief calls for a deliberately local, explainable caption-review queue. Import and export are present. An AI drafting or transcription feature would change that scope and conflict with the offline/local-first value. No AI feature is missing, decorative, or key-bearing.

## What would make this perfect

Make JSON-backup import observable in `@claim:format-roundtrip`, declare and test the three remaining visitor-facing promises, and replace “heuristics” with the plain-language consequence. Then rerun every claim command from a clean clone and repeat the live cold-read/demo check.
