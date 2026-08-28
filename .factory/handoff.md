# Caption Fix Queue — perfection loop round 1

## Result

All four BLOCKING findings and every major, minor, copy, claim, mobile, legal,
routing, metadata, accessibility, privacy, offline, and performance item from
`.factory/review-1.md` are resolved. Product code is commit
`d9438690aff44ac43dd73ddedd260d31af67e237`.

## What changed

- Rewrote the first screen around the reviewed job and audience. The primary
  action now opens seven sample cues with six findings.
- Added isolated `?demo=1` and `/demo` entry points. Demo work uses only
  IndexedDB database `demo:caption-fix-queue` and never opens the real database.
- Added a persistent demo banner, Reset demo, and Start for real. Exit deletes
  demo state and restores an existing real workspace.
- Added `.factory/claims.json` with 12 claims and exactly one tagged test per
  claim. Tests cover rule boundaries, privacy traffic, all imports and exports,
  every review decision, persistence, billing, offline work, and provenance.
- Added distinct route metadata, direct `/demo`, a botanical 404 with deployed
  404 status configuration, focus announcements, shared chrome, legal links,
  robots, sitemap, canonical tags, social metadata, and app icons.
- Added the required landing sections, plain copy, 44 px mobile targets, legal
  focus behavior, responsive review layout, and immediate durable saves.
- Preserved the caption-herbarium visual thesis. Added only an art-derived
  1200×630 social card and 180×180 touch icon.
- Added `.factory/demo.md`, `.factory/copy-audit.md`, and the verb-first catalog
  description. README now maps its product claims to tested behavior.

## Exact verification evidence

Fresh clone: `/tmp/caption-fix-queue-clean.oYuitP` at
`d9438690aff44ac43dd73ddedd260d31af67e237`.

- `npm ci`: 61 packages installed; 0 vulnerabilities.
- `npm test`: 5 files passed; 15 tests passed.
- `npm run build`: passed; `dist/index.html` present.
- Production assets: app JavaScript 43.10 KB raw / 14.24 KB gzip; app CSS
  22.71 KB raw / 5.89 KB gzip; hero WebP 93.78 KB.
- Every one of the 12 commands in `.factory/claims.json`: passed independently.
- `npm run test:e2e`: 38 passed; 2 intentional cross-project skips; 0 failed.
- Playwright axe checks: 0 serious or critical findings on landing, work view,
  light theme, and dark theme at desktop and 390×844 mobile sizes.
- Offline claim: worker-controlled `/demo` reloaded offline, then repaired and
  exported an SRT successfully.
- Isolation claim: a real workspace sentinel remained byte-for-byte unchanged
  after demo decisions, reset, and exit; the demo record was deleted.
- Factory `verify-url.sh`: HTTP 200, title and `lang` present, one h1 and main,
  0 missing alt attributes, 0 unlabeled buttons, and 0 console errors.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.8 s, CLS 0, TBT 100 ms.
- Social card inspected at 1200×630; touch icon inspected at 180×180.

## Run it

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then run each `test` command in `.factory/claims.json`. Preview the production
site with `npm run preview` and open `http://127.0.0.1:4173/?demo=1`.

## Known gaps and next steps

No blocking or known product defect remains from review 1. The release step is
to push these commits, deploy `dist/` through the static work-order helper, and
record the live URL check below.
