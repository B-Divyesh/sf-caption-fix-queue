# Caption Fix Queue — verification handoff

## Result: FAIL

Independent QA tested candidate `778243fea3060d95769750ec0af0cc8046da2725`
from a clean checkout and the live deployment at
<https://caption-fix-queue.sociobot.in> on 2026-08-28 UTC. All 16 built files match
the live deployment byte-for-byte, so this verdict applies to both.

## What passed

- `npm ci`: success, 0 audit vulnerabilities.
- `npm test`: 6/6 tests pass.
- `npm run build`: type check and exact production build pass; `dist/` produced.
- `npm run test:e2e`: 6/6 desktop and 390×844 Chromium tests pass.
- Core local SRT/VTT import, six check families, manual repair, accept/dismiss,
  decision Undo, persistence, export, deletion, validation recovery, clean state,
  and drag/drop work.
- Keyboard navigation, visible focus, dark mode, reduced motion, 390 px layout,
  legal pages, and stabilized axe checks pass without serious/critical findings.
- Service-worker install, version update notice/cache replacement, persisted-state
  offline reload, and offline legal pages work.
- Fresh workflows make no cross-origin requests and do not upload captions.
- Lighthouse 12.8.2: local 100/100/100 and live 100/100/100 for Performance,
  Accessibility, and Best Practices. Live LCP 1.37 s, TBT 16 ms, CLS 0.
- Budgets pass: 37.0 KB JS, 19.9 KB CSS, no fonts, 93.8 KB WebP hero.

## Release blockers

1. **High — Studio checkout is broken in production.** The advertised Sociobot
   checkout URL returns HTTP 404 with `{"error":"enabled factory product",
   "status":404}`. The billing product is not enabled/registered.
2. **High — repair Undo is false feedback.** Undo after saving a text repair does
   not restore the previous cue text; exporting proves the edit remains.
3. **High — suggested fixes can corrupt WebVTT semantics.** Applying the repeat
   suggestion to `<v MARA>Hello hello</v>` exports lowercase `hello`, stripping
   the voice tags and capitalization.

## Other defects

- **Medium:** brand/theme/footer targets at 390 px are below the required 44×44
  CSS px, and the mobile header gap is 6 px rather than 8 px.
- **Medium:** all live assets, including hashed JS/CSS, use only
  `max-age=30, must-revalidate` rather than long-lived immutable caching.
- **Medium:** live responses omit CSP, clickjacking protection, and
  Permissions-Policy.
- **Low:** the toast opacity entrance can briefly trigger an axe serious contrast
  failure (2.93:1); stabilized scans are clean.
- **Low/configuration:** the manifest is served as `application/octet-stream`,
  although Chromium parses it without errors.

Full commands, evidence, reproduction steps, hashes, response-policy results, and
coverage are in [`.factory/verification.md`](verification.md).

## Required next steps

- Register/enable the live `caption-fix-queue` Sociobot billing product and verify
  a real checkout/return/restore flow.
- Store and restore prior cue text in repair Undo.
- Generate suggested replacements against the original marked-up cue while
  preserving WebVTT tags/entities and original capitalization.
- Correct target sizing, toast transition contrast, immutable asset caching, and
  response headers; then rerun the complete verification matrix.

No product code was modified by the verifier.
