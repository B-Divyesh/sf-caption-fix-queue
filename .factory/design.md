# Caption Fix Queue — visual thesis

## Direction: the caption herbarium

Caption review is careful classification work: notice a small anomaly, compare it
with its context, label it, and preserve the corrected specimen. The interface is
therefore a **botanical field guide**, not a generic dashboard. Cues sit on warm
herbarium paper; issue types use tiny hand-authored leaf/seed glyphs; the review
rail resembles margin annotations; a pressed sprig intersects caption strips in
the opening illustration. Ornament is sparse and explanatory: botanical taxonomy
maps naturally to the app's explainable checks and queue.

The utility screen, rather than a marketing hero, is the product's front door.
Its largest action is the drop plot. Once a file is open, the illustration recedes
and transcript context becomes the visual specimen under examination.

## Palette

Light is the primary treatment, deliberately evoking unbleached archive paper.
Dark mode evokes a field notebook opened at dusk rather than inverting colors.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | `#F4F0E5` | `#18201B` | page |
| paper raised | `#FFFDF6` | `#222C25` | focused work surfaces |
| ink | `#18251E` | `#F1EEE3` | primary copy |
| ink muted | `#566359` | `#B7C0B6` | supporting copy |
| fern | `#245B3D` | `#72C695` | primary action and focus |
| fern deep | `#173C2A` | `#A8E2BC` | strong labels |
| pollen | `#D8A632` | `#E9C765` | selected/warning accents |
| clay | `#A04432` | `#ED8E79` | errors/high severity |
| moss wash | `#DDE8D9` | `#293B30` | accepted/safe states |
| rule | `#C7C2B4` | `#445047` | dividers and controls |

All text pairs meet WCAG AA. Color is never the only state signal; labels,
shapes, and iconography accompany it.

## Typography

- Display/field-note voice: Georgia, Cambria, `Times New Roman`, serif. This
  gives titles and specimens a human editorial character without a network font.
- Interface/measurements: `Arial`, `Helvetica Neue`, sans-serif. Familiar,
  compact, and reliable for dense timings and controls. No font files or CDN.
- Scale: 14 metadata, 16 body, 18 lead, 22 section, clamp 32–52 display.
  Body line-height is 1.55; prose is capped around 68 characters.
- Cue times and counts use tabular numerals.

## Spacing and shape

An 8px base rhythm, with 4px used only inside labels. Page gutters are 16px at
390px and 32–48px on wide screens. Corners are modest (6–16px) like clipped
paper, never pill-shaped except status tokens. Thin rules and dotted baselines
replace default card grids. Touch targets are at least 44px.

## Interaction grammar

- Import is a “plot”: dashed outline, file/drag/paste actions, immediate parsing.
- Checks are “findings”; each has a plain-language reason, measured evidence,
  neighboring cues, and exactly three outcomes: repair, accept as-is, dismiss.
- Repair edits a single cue in place and reruns all checks. No text is ever
  changed silently.
- A narrow field-index bar shows remaining/resolved findings. Keyboard shortcuts
  (`J/K`, `E`, `A`, `D`) match visible button hints, never replace controls.
- Success leaves an archival trace: resolved marks remain filterable and saved
  locally. Undo is offered after status changes.

## Motion

UI transitions run 160–220ms and only animate opacity/transform: a finding enters
from the queue direction, the progress marker settles, and toasts rise from their
origin. Nothing loops. With `prefers-reduced-motion: reduce`, smooth scrolling and
transforms are removed; state changes are immediate with opacity-only feedback.
Depth remains through border weight, overlap, and shadow.

## Original asset plan and provenance

- `public/art/caption-herbarium.webp`: generated opening illustration of a pressed
  fern and caption strips, then reviewed and optimized locally. Prompt sheet:
  “Editorial botanical field-guide plate, overhead view of one pressed maidenhair
  fern specimen weaving gently around three blank cream archival caption strips,
  subtle graphite registration marks and ruled annotations, warm unbleached paper,
  dark forest green ink, muted ochre pollen details, terracotta correction mark,
  tactile paper fibers, quiet natural window light, flat lay, restrained negative
  space, crisp accessible silhouette, no people, no text, no letters, no watermark,
  no logos, no UI screenshot, no neon, no gradient.” Generated with the factory
  Azure image deployment (`factory-image`) on 2026-08-28. Original asset for this
  product; no third-party source material.
- Interface symbols are hand-authored inline SVG (leaf, seed, bracket, timing
  tick), drawn specifically for this app and inheriting current color.
- App icons are hand-authored SVG/raster derivatives of the leaf-and-caption-mark
  identity. Generated imagery is disclosed in the footer.

## Responsive intent

Desktop uses a two-column review bench: queue/index at left and cue specimen at
right. At 390px the queue summary becomes a compact horizontal strip, context is
trimmed to one cue on each side, and actions stack in the natural repair → accept
→ dismiss order. No capability disappears; decorative illustration crops away
before task content does.
