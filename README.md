# Caption Fix Queue

Review existing SRT and WebVTT caption files before publishing. Small video
teams and community educators use the checker to find lines needing a human
review.

Live product: <https://caption-fix-queue.sociobot.in>

Try the isolated sample at <https://caption-fix-queue.sociobot.in/?demo=1>.

## What it does

- Imports SRT, WebVTT, and JSON project backups in the browser.
- Runs six caption checks and explains each finding with matching text.
- Shows nearby cues for context.
- Lets reviewers repair text, accept it, or dismiss a finding.
- Saves captions, glossary terms, decisions, and review history in local storage.
- Exports repaired captions and JSON project backups for free.
- Works offline after the first visit, including repair and export.

The demo has seven cues and six findings. It uses the separate
`demo:caption-fix-queue` database. Resetting or leaving the demo deletes that
sample state without changing the real workspace.

Studio costs $19 once for one reviewer. It adds glossary JSON transfer and team
review-history CSV export. The checker, repairs, captions, and project backups
stay free.

## Develop and verify

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run build` writes the static deployment to `dist/`. Its root file is
`dist/index.html`. Preview it with `npm run preview`.

Playwright is pinned to 1.58.2. The factory image provides its browsers through
`PLAYWRIGHT_BROWSERS_PATH`. Elsewhere, run `npx playwright install chromium`.

Every public product claim and its test command is listed in
`.factory/claims.json`. Demo details are in `.factory/demo.md`.

## Privacy and data ownership

Caption checks run in the browser. Free use does not upload captions, glossary
terms, or review history. The app loads no analytics, ads, tracking scripts,
third-party fonts, or third-party runtime code.

Studio purchase and verification use the Sociobot billing API. Verification
sends the license token, not caption content. Read the [privacy policy](/privacy/)
and [terms](/terms/).

Project backups are JSON files. Repaired captions keep their SRT or WebVTT
format. “Delete local workspace” removes the current workspace record.

## Configure the billing API

Production uses the `caption-fix-queue` product at
`https://api.sociobot.in/api/v1`. Set another API base during a staging build:

```sh
VITE_BILLING_API=https://pilot-api.sociobot.in/api/v1 npm run build
```

## What Caption Fix Queue does not do

It does not create transcripts, host video, synchronize playback, or make
factual corrections. Its checks are heuristics and may miss problems or flag
acceptable text. A person makes the final publishing decision.

The visual rationale and original-image provenance are in
`.factory/design.md`. Repair evidence is recorded in `.factory/handoff.md`.

## License

[MIT](LICENSE)
