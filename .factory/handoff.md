# Caption Fix Queue — repair 3 handoff

## Result

The blocking `review-2` finding and all three smaller findings are resolved and
deployed. Caption Fix Queue remains a local SRT/WebVTT review queue for small
video teams and community educators checking captions before publishing.

- Implementation commits: `3ac9147acc63ffce920271375061c5462b2d5d9f`
  (backup-import proof and copy/claim repair) and
  `b4cdbd22bf5a3d9200bc0a16e78050fcc86ce7f1` (landing skip-link focus).
- Documentation evidence commit:
  `9fb4fdc81e548b1199663a2d09489136b66c6c16` (the first committed version of
  this handoff, before this SHA annotation). It is separate from the deployed
  implementation commits above.
- Final static deployment: `dc190496-2750-49ca-8a32-9a7740def83a`, succeeded
  on 2026-09-05 UTC. The live custom domain returned HTTPS 200 after deploy.

## Review disposition

| Review item | Current disposition |
| --- | --- |
| F-2-1 JSON project-backup import | Fixed. `@claim:format-roundtrip` now exports a populated metadata-rich VTT backup, uploads that JSON in a **new browser context**, and verifies the restored document name/format, glossary term, accepted decision, team-history CSV row, and VTT metadata export. |
| F-2-2 seven sample cues and nearby context | Fixed. The `six-checks` public claim now names seven sample cues, six finding kinds, matching reason/evidence, and nearby cues. Its demo test observes all six rows and context for the first, middle, and last findings. |
| F-2-2 Studio payment/refund wording | Fixed. The Studio dialog now says “Read the purchase terms before buying.” The Studio claim follows that visible link to Terms, where the payment/refund policy is rendered. |
| F-2-3 unexplained “heuristics” | Fixed on the landing, README, and Terms. The product now states the concrete consequence: checks can miss problems or flag acceptable text, and do not certify accessibility. |
| Landing keyboard focus | Fixed during live QA. A fresh landing page now begins at the document so the first Tab reaches the visible skip link; demo, 404, and restored navigation still move focus to the route heading. |

All review-1 blockers remain covered: the cold first screen names the job,
audience, and first action; the demo uses its own IndexedDB namespace; all 12
claims have tagged tests; and `/demo` plus the designed 404 work. Earlier
verification fixes for repair Undo, markup-safe VTT suggestions, mobile target
size, response headers/caching, checkout/license behavior, and PWA behavior
remain in the complete browser suite. The static repair did not change the
external billing API; its prior product-scoped rate-limit evidence remains the
latest check for that service.

## Verification

Final clean checkout: `/tmp/caption-fix-queue-clean.BE3tVN` at
`b4cdbd22bf5a3d9200bc0a16e78050fcc86ce7f1`.

- `npm ci`: passed; 61 packages installed and 0 reported vulnerabilities.
- `npm test`: passed, 15/15 tests.
- `npm run build`: passed and emitted `dist/index.html`.
- Every one of the 12 commands in `.factory/claims.json` passed individually
  from that clean checkout.
- `npm run test:e2e`: passed; 42 scheduled browser checks with two intentional
  project skips for mobile-only assertions.
- The final build is 43,119 B JavaScript (14,250 B gzip), 22,714 B app CSS
  (5,890 B gzip), and a 93,780 B hero WebP: all within the PWA budgets.
- The final live artifact matched all 21 deployed files from `dist/` by
  SHA-256 (provider-only `staticwebapp.config.json` excluded).
- `/opt/fleet/lib/verify-url.sh` passed against the HTTPS custom domain: 680 ms
  load, zero console errors, title/lang, one h1, main landmark, and no missing
  image alt text or unlabeled buttons.
- Live axe scans had zero serious or critical violations on landing and demo at
  both 1440×900 desktop and 390×844 phone sizes.
- Fresh live desktop and phone contexts both showed, before scrolling: “Find
  caption lines that need review”; the named small-team/community-educator
  audience; and “Try it with sample data.” The first Tab reached the skip link.
  The one-click demo showed seven cues, six findings, its persistent sandbox
  label, reset back to six findings, and returned to the real landing page.
  Free-use requests stayed same-origin, phone width had no horizontal overflow,
  and neither context logged a console/page error.
- A fresh 390px worker-controlled live demo reloaded offline, repaired a cue,
  and exported the repaired SRT successfully.
- `/`, `/demo`, `/privacy/`, `/terms/`, robots, sitemap, and manifest returned
  200. The designed unknown route returned the expected HTTP 404 with the
  `Page not found — Caption Fix Queue` title.

Lighthouse 13.4.1 created a partial live report at
`/work/.evidence/caption-fix-queue-live/lighthouse.json` with 0.98
performance, 1 accessibility, and 1 best-practices plus FCP 1.0 s, LCP 1.4 s,
and CLS 0. Its browser tab then crashed while gathering the full-page screenshot,
so that run is recorded as partial rather than a fully successful Lighthouse
gate. Direct live axe, browser, bundle, and artifact checks above passed.

## How to run

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Then run each declared command in `.factory/claims.json`. Open the live sandbox
at `https://caption-fix-queue.sociobot.in/demo` or `/?demo=1`.

## Known gaps and next steps

No known product defect remains from the current or earlier reviews. The only
verification limitation is the Lighthouse tab crash described above; rerun it
with a stable Chrome/Lighthouse pairing if a complete Lighthouse JSON artifact
is needed. No data migration, backend deployment, or external AI dependency is
needed for this static local-first product.
