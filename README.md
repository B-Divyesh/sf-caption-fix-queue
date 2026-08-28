# Caption Fix Queue

Caption Fix Queue is a local, offline-capable review queue for existing SRT and
WebVTT captions. It helps small video teams and community educators find the few
lines that merit a human check before publishing, without turning caption review
into a full editing-suite project.

Live product: <https://caption-fix-queue.sociobot.in>

## What it does

- Parses SRT and WebVTT locally, preserving VTT identifiers, cue settings, notes,
  style blocks, regions, and header metadata.
- Queues explainable findings for repeated words/cues, blank cues, unsafe or
  invisible characters, high reading load, near-matching speaker labels, and
  glossary variants.
- Shows the evidence and neighboring cues for every finding. Reviewers can repair
  text, accept it as-is, or dismiss the flag; nothing is silently rewritten.
- Saves the current document, glossary, decisions, and review history in IndexedDB.
- Exports repaired SRT/VTT files and portable JSON project backups for free.
- Works as an installable PWA after its first online visit, including offline reloads.

Studio is an optional $19 one-time reviewer license. It adds portable shared-
glossary JSON and team review-history CSV exports. Checkout and license verification
use only the Sociobot billing API; the free checker, repairs, and core data exports
are never gated.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run build` is the exact deployment command. It writes the static site to
`dist/`, with `dist/index.html` at its root. Preview the production build with
`npm run preview`.

Playwright is pinned to 1.58.2. In the factory worker image its browsers are read
from `PLAYWRIGHT_BROWSERS_PATH`; elsewhere, run `npx playwright install chromium`
once before the end-to-end suite.

## Privacy and data ownership

Caption parsing and all checks run in the browser. No captions, glossary terms, or
review history are sent to a server. There are no analytics, advertising scripts,
third-party fonts, or runtime CDNs. A Studio license is the only data sent out, and
only to the Sociobot API for purchase/verification. See `/privacy/` and `/terms/`.

Project backups are plain JSON; repaired captions retain their original SRT or VTT
format. “Delete local workspace” erases the current IndexedDB record. Clearing site
data also removes the stored Studio license token.

## Configuration

Production uses `https://api.sociobot.in/api/v1` for billing. Staging can override
the host at build time without changing a product ID:

```sh
VITE_BILLING_API=https://pilot-api.sociobot.in/api/v1 npm run build
```

The factory registers the `caption-fix-queue` product separately.

## Scope

This app reviews captions already made. It does not generate transcripts, host
video, synchronize playback, or make factual corrections. Its checks are deliberate
heuristics, so the final watch-through and accessibility decision stay with the
reviewer.

Visual rationale and original-image provenance are in `.factory/design.md`.
Build verification is recorded in `.factory/handoff.md`.

## License

[MIT](LICENSE)
