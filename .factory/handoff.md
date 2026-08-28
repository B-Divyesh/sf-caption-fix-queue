# Caption Fix Queue — build handoff

## Shipped

- Finished Vite + vanilla TypeScript PWA for local SRT/WebVTT review.
- Strict parser with useful errors; preserves VTT header metadata, identifiers,
  settings, NOTE, STYLE, and REGION blocks through export.
- Six explainable check families: improbable repeats, blank cues/runs, invisible or
  unsafe characters, reading speed/line load, inconsistent speaker names, and
  glossary variants.
- Complete review loop: context, evidence, manual or suggested repair, rerun checks,
  accept, dismiss, undo, progress, resolved filter, and J/K/E/A/D keyboard path.
- IndexedDB persistence across refresh/tab close; SRT/VTT export, JSON project
  export/import, local deletion, and CSV history export.
- Free editable glossary plus a $19 one-time Studio unlock for shared-glossary JSON
  and team-history CSV. Implements return-token capture, local storage, daily
  Sociobot verification, optimistic offline unlock, invalid-license reconciliation,
  hosted checkout, and paste-to-restore. No product ID is embedded; the required
  slug route is used. The factory still needs to register the billing product.
- Install manifest, 192/512/maskable icons, versioned app-shell/runtime caches,
  offline fallback, update notice, and explicit offline state.
- Responsive 390px review UI, light/dark botanical field-guide treatments, reduced-
  motion handling, focus states, skip link, landmarks, dialog labels, touch targets,
  and legal pages.
- Original generated herbarium hero reviewed and optimized to a 92 KB WebP with a
  145 KB JPEG fallback. Prompt/model/date are in `.factory/design.md` and
  `assets/src/` sidecars.

## Verification (2026-08-28 UTC)

All run against the production build in this repository:

| Check | Result |
| --- | --- |
| `npm test` | 6/6 unit tests pass |
| `npm run build` | Pass; output is `dist/` with root `index.html` |
| `npm run test:e2e` | 6/6 pass across desktop Chromium and 390×844 mobile |
| Offline Playwright | Installed shell reload and local UI pass on desktop + mobile |
| Axe in Playwright | No serious/critical issues, working UI in light and dark modes |
| Factory `verify-url.sh` | Pass; no console/page errors, title/lang/main/one h1/alt checks pass |
| Lighthouse 12.8.2 mobile | Performance 100, Accessibility 100, Best Practices 100 |

Lighthouse lab metrics: LCP 1.8 s, CLS 0, total blocking time 0 ms, speed index
0.9 s. Initial production assets: 37.02 KB JS (12.69 KB gzip), 19.90 KB CSS
(5.37 KB gzip), no font download, 92 KB WebP hero. These are below the 200 KB JS,
50 KB CSS, 120 KB font, and 300 KB hero budgets.

Exact clean-clone commands:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Deployment serves `./dist` as a static site. Configure static routing so `/privacy/`
and `/terms/` retain their emitted HTML documents.

## Known gaps and next steps

- Studio checkout/verification cannot complete until the factory registers the live
  `caption-fix-queue` billing product. Use `VITE_BILLING_API` for pilot registration.
- The checker intentionally has no video playback, transcript generation, cloud
  sync, or factual auto-correction. Reading-speed and speaker checks are heuristics;
  a human watch-through remains necessary.
- Review history is capped to the latest 1,000 local events to keep browser storage
  bounded. V1 has portable files rather than account-based team synchronization.
- Lighthouse numbers are local lab measurements and should be rechecked on the
  deployed origin after CDN/cache configuration is applied.
