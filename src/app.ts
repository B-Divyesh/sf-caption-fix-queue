import './styles.css';
import { runChecks } from './checks';
import { captureReturnedLicense, cachedUnlock, checkoutUrl, saveLicense, storedLicense, verifyLicense } from './license';
import { formatTimestamp, parseCaptions, serializeCaptions } from './parser';
import { clearState, loadState, saveState, setStorageMode } from './storage';
import type { CaptionDocument, Finding, FindingKind, FindingStatus, GlossaryEntry, ReviewRecord, SavedState } from './types';

const SAMPLE = `1
00:00:01,000 --> 00:00:03,400
Welcome to our our garden workshop.

2
00:00:03,500 --> 00:00:05,100
MARA: Today we plant native seeds.

3
00:00:05,200 --> 00:00:06,000
This demonstration moves quickly and contains far too many words for viewers to comfortably read in less than one second.

4
00:00:06,100 --> 00:00:08,200
MARRA: Add bio-char to the soil.

5
00:00:08,300 --> 00:00:10,000
Watch for the hidden​ character.

6
00:00:10,100 --> 00:00:12,000

7
00:00:12,100 --> 00:00:14,000
The biochar helps hold moisture.
`;

const HOME_TITLE = 'Caption Fix Queue — find caption lines to review';
const DEMO_TITLE = 'Demo — Caption Fix Queue';
const BUILD_ID = '1.0.0 · repair 1';
const path = window.location.pathname.replace(/\/+$/, '') || '/';
let isDemo = path === '/demo' || new URLSearchParams(window.location.search).get('demo') === '1';
const isNotFound = !['/', '/demo'].includes(path);

const kindLabels: Record<FindingKind, string> = {
  repeat: 'Repeat', blank: 'Blank run', character: 'Character', speed: 'Reading speed', speaker: 'Speaker', glossary: 'Glossary'
};

const kindIcons: Record<FindingKind, string> = {
  repeat: '<path d="M5 9a7 7 0 0 1 12-2l2 2m0-4v4h-4M19 15a7 7 0 0 1-12 2l-2-2m0 4v-4h4"/>',
  blank: '<path d="M4 7h16M4 17h16M8 12h8"/>',
  character: '<path d="M12 3v18M5 7h11a4 4 0 0 1 0 8H8"/>',
  speed: '<path d="M5 18a9 9 0 1 1 14 0M12 12l5-4"/>',
  speaker: '<path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-2h5m-2-2v4M2 21a6 6 0 0 1 12 0"/>',
  glossary: '<path d="M4 5a3 3 0 0 1 3-3h13v17H7a3 3 0 0 0-3 3V5Zm0 17h16"/>'
};

let documentState: CaptionDocument | undefined;
let statuses: Record<string, FindingStatus> = {};
let glossary: GlossaryEntry[] = [{ id: 'starter-biochar', preferred: 'biochar', variants: ['bio-char', 'bio char'] }];
let reviewHistory: ReviewRecord[] = [];
let findings: Finding[] = [];
let selectedId = '';
let showResolved = false;
let editing = false;
let isStudio = false;
let licenseInactive = false;
let routeShouldFocus = false;
interface LastAction {
  id: string;
  previous: FindingStatus;
  historyLength: number;
  repair?: { cueId: string; previousText: string; previousUpdatedAt: number };
}

let lastAction: LastAction | undefined;

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('Application root is missing.');
const root: HTMLDivElement = rootElement;

function icon(kind: FindingKind): string {
  return `<svg class="finding-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${kindIcons[kind]}</svg>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function activeFindings(): Finding[] {
  return findings.filter((finding) => showResolved || finding.status === 'open');
}

function currentFinding(): Finding | undefined {
  const visible = activeFindings();
  return visible.find((finding) => finding.id === selectedId) ?? visible[0];
}

function refreshFindings(): void {
  findings = documentState ? runChecks(documentState, glossary, statuses) : [];
  const visible = activeFindings();
  if (!visible.some((finding) => finding.id === selectedId)) selectedId = visible[0]?.id ?? '';
}

function scheduleSave(): void {
  const state: SavedState = {
    document: documentState,
    statuses: { ...statuses },
    glossary: glossary.map((entry) => ({ ...entry, variants: [...entry.variants] })),
    history: reviewHistory.slice(-1000).map((record) => ({ ...record })),
    savedAt: Date.now()
  };
  void saveState(state).catch(() => toast('Could not save locally. Export a project backup before closing.', 'warning'));
}

function header(): string {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="Caption Fix Queue home">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span></span>
      <span>Caption Fix Queue</span>
    </a>
    <nav class="header-nav" aria-label="Primary">
      <a href="/?demo=1" ${isDemo ? 'aria-current="page"' : ''}>Demo</a>
      <a href="/privacy/">Privacy</a>
      <button class="nav-button ${isStudio ? 'studio-active' : ''}" id="studio-button" type="button">${isStudio ? 'Studio active' : 'View Studio'}</button>
      <button class="theme-button" id="theme-button" type="button" aria-label="${document.documentElement.dataset.theme === 'dark' ? 'Use light theme' : 'Use dark theme'}"><span aria-hidden="true">◐</span></button>
    </nav>
  </header>${licenseInactive ? '<div class="license-notice" role="status">Studio license is no longer active. Free features are unchanged. <button id="license-notice-link" type="button">View Studio options</button></div>' : ''}`;
}

function emptyView(): string {
  return `<main id="main" class="empty-main">
    <section class="intro-copy" aria-labelledby="page-title">
      <p class="eyebrow">Check captions before publishing</p>
      <h1 id="page-title" tabindex="-1">Find caption lines<br><em>that need review</em></h1>
      <p class="lede">For small video teams and community educators checking SRT or WebVTT files before publishing.</p>
      <div class="hero-actions">
        <a class="primary-button button-link" id="sample-link" href="/?demo=1">Try it with sample data</a>
        <button class="text-button" id="choose-file-hero" type="button">Choose a caption file</button>
      </div>
      <p class="action-note">Opens seven sample cues with six findings. Demo changes are discarded.</p>
      <ul class="trust-list" aria-label="Product facts">
        <li><span aria-hidden="true">✓</span> Caption files stay on this device</li>
        <li><span aria-hidden="true">✓</span> Works offline after the first visit</li>
        <li><span aria-hidden="true">✓</span> Free checker; Studio is $19 once</li>
      </ul>
      <input class="visually-hidden" id="file-input" type="file" aria-label="Choose an SRT, VTT, or project backup file" accept=".srt,.vtt,.json,text/vtt,application/x-subrip,application/json" />
    </section>
    <section class="import-plot" id="drop-zone" aria-labelledby="import-title">
      <picture class="hero-art">
        <source srcset="/art/caption-herbarium.webp" type="image/webp" />
        <img src="/art/caption-herbarium.jpg" width="1280" height="853" alt="A pressed maidenhair fern arranged around three blank archival caption strips" fetchpriority="high" decoding="async" />
      </picture>
      <div class="import-panel">
        <span class="specimen-number" aria-hidden="true">PLOT 01</span>
        <div class="file-glyph" aria-hidden="true"><span>CC</span></div>
        <h2 id="import-title">Check your caption file</h2>
        <p>Drop an <strong>.srt</strong> or <strong>.vtt</strong> here</p>
        <button class="secondary-button" id="choose-file" type="button">Choose a caption file</button>
        <div class="import-alternatives"><button class="text-button" id="paste-button" type="button">Paste captions</button><span aria-hidden="true">·</span><a href="/?demo=1">Try it with sample data</a></div>
        <p class="file-note">Imports SRT, WebVTT, or a JSON project backup in this browser.</p>
      </div>
    </section>
    <section class="check-key" aria-labelledby="checks-title">
      <p class="eyebrow">What the checker finds</p><h2 id="checks-title">Six checks with a reason and matching text</h2>
      <div class="check-grid">${(Object.keys(kindLabels) as FindingKind[]).map((kind) => `<div>${icon(kind)}<span><strong>${kindLabels[kind]}</strong><small>${kindDescription(kind)}</small></span></div>`).join('')}</div>
    </section>
    <section class="how-section" aria-labelledby="how-title">
      <p class="eyebrow">How it works</p><h2 id="how-title">Review captions in three steps</h2>
      <ol><li><strong>Import captions</strong><span>Choose an SRT, WebVTT, or JSON project backup.</span></li><li><strong>Review findings</strong><span>See the reason, matching text, and nearby cues.</span></li><li><strong>Export repairs</strong><span>Download captions in their original format or save a JSON backup.</span></li></ol>
    </section>
    <section class="limits-section" aria-labelledby="limits-title">
      <div><p class="eyebrow">Privacy and limits</p><h2 id="limits-title">Your captions stay under your control</h2><p>Caption text is processed in this browser and is not uploaded. Checks are heuristics, not accessibility certification.</p></div>
      <ul><li>The checker does not create transcripts or host video.</li><li>It does not change caption text until you choose a repair.</li><li>A final watch-through still needs a person.</li></ul>
    </section>
    <section class="studio-section" aria-labelledby="studio-section-title">
      <div><p class="eyebrow">Optional Studio license</p><h2 id="studio-section-title">Share glossaries and export team review history</h2><p><strong>$19 once</strong> for one reviewer. The checker, repairs, caption exports, and project backups stay free.</p></div><button class="secondary-button" id="studio-section-button" type="button">View Studio options</button>
    </section>
  </main>`;
}

function kindDescription(kind: FindingKind): string {
  return ({ repeat: 'Repeated words or neighboring cues', blank: 'Cues without readable words', character: 'Hidden or unsupported characters', speed: 'Over 20 characters per second, 42 characters per line, or two lines', speaker: 'Speaker labels within two edits of each other', glossary: 'Listed variants of a preferred term' })[kind];
}

function workView(): string {
  if (!documentState) return '';
  const open = findings.filter((finding) => finding.status === 'open').length;
  const resolved = findings.length - open;
  const progress = findings.length ? Math.round((resolved / findings.length) * 100) : 100;
  const finding = currentFinding();
  return `<main id="main" class="workspace">
    <section class="workspace-head" aria-labelledby="page-title">
      <div><p class="eyebrow">Caption review</p><h1 id="page-title" tabindex="-1">${escapeHtml(documentState.name)}</h1><p>${documentState.cues.length} cues · ${documentState.format.toUpperCase()} · <span id="save-status">${isDemo ? 'Saved only in the demo sandbox' : 'Saved in this browser'}</span></p></div>
      <div class="document-actions">
        <button class="secondary-button" id="glossary-button" type="button">Glossary <span class="count-dot">${glossary.length}</span></button>
        <button class="secondary-button" id="export-button" type="button">Export ${documentState.format.toUpperCase()}</button>
        <button class="menu-button" id="more-button" type="button" aria-expanded="false" aria-controls="more-menu" aria-label="More document actions">•••</button>
        <div class="more-menu" id="more-menu" hidden>
          <button id="project-export" type="button">Export project backup</button>
          <button id="project-import" type="button">Import project backup</button>
          <button id="history-export" type="button">Export team history ${isStudio ? '' : '· Studio'}</button>
          <button id="new-file" type="button">Review another file</button>
          <button id="delete-workspace" class="danger-text" type="button">Delete local workspace</button>
          <input class="visually-hidden" id="project-file" type="file" aria-label="Import project backup" accept=".json,application/json" />
        </div>
      </div>
    </section>
    <section class="progress-strip" aria-label="Review progress">
      <div><strong>${open}</strong><span>to review</span></div><div><strong>${resolved}</strong><span>resolved</span></div>
      <div class="progress-track"><span style="width:${progress}%"></span></div><span class="progress-value">${progress}%</span>
    </section>
    ${findings.length === 0 ? cleanState() : `<div class="review-layout">${queueView()}${finding ? detailView(finding) : finishedState()}</div>`}
  </main>`;
}

function queueView(): string {
  const visible = activeFindings();
  return `<aside class="queue-panel" aria-labelledby="queue-title">
    <div class="queue-head"><div><p class="eyebrow">Field index</p><h2 id="queue-title">Findings</h2></div><label class="resolved-toggle"><input id="resolved-toggle" type="checkbox" ${showResolved ? 'checked' : ''}/><span>Show resolved</span></label></div>
    <ol class="finding-list">${visible.length ? visible.map((finding, index) => {
      const cueIndex = documentState?.cues.findIndex((cue) => cue.id === finding.cueId) ?? -1;
      return `<li><button class="finding-row ${finding.id === currentFinding()?.id ? 'selected' : ''} ${finding.status !== 'open' ? 'resolved' : ''}" data-finding="${escapeHtml(finding.id)}" type="button" aria-current="${finding.id === currentFinding()?.id ? 'true' : 'false'}">
        ${icon(finding.kind)}<span><small>${kindLabels[finding.kind]} · Cue ${cueIndex + 1}</small><strong>${escapeHtml(finding.title)}</strong><em>${finding.status === 'open' ? (finding.severity === 'important' ? 'Important' : 'Check') : finding.status}</em></span><b aria-hidden="true">${index + 1}</b>
      </button></li>`;
    }).join('') : '<li class="queue-empty">No findings in this view.</li>'}</ol>
    <p class="shortcut-note"><kbd>J</kbd>/<kbd>K</kbd> move · <kbd>E</kbd> repair · <kbd>A</kbd> accept · <kbd>D</kbd> dismiss</p>
  </aside>`;
}

function detailView(finding: Finding): string {
  if (!documentState) return '';
  const cueIndex = documentState.cues.findIndex((cue) => cue.id === finding.cueId);
  const cue = documentState.cues[cueIndex];
  if (!cue) return '';
  const previous = documentState.cues[cueIndex - 1];
  const next = documentState.cues[cueIndex + 1];
  return `<section class="detail-panel" aria-labelledby="finding-title">
    <div class="finding-heading"><span class="kind-mark">${icon(finding.kind)}</span><div><p class="eyebrow">${kindLabels[finding.kind]} · Cue ${cueIndex + 1} of ${documentState.cues.length}</p><h2 id="finding-title">${escapeHtml(finding.title)}</h2></div><span class="severity ${finding.severity}">${finding.severity === 'important' ? 'Important' : 'Check'}</span></div>
    <div class="explanation"><strong>Why this was flagged</strong><p>${escapeHtml(finding.explanation)}</p><span>${escapeHtml(finding.evidence)}</span></div>
    <div class="cue-context" aria-label="Caption context">
      ${previous ? contextCue(previous.text, cueIndex, formatTimestamp(previous.startMs, documentState.format), false) : ''}
      <article class="cue-card current"><header><span>Flagged cue</span><time>${formatTimestamp(cue.startMs, documentState.format)} → ${formatTimestamp(cue.endMs, documentState.format)}</time></header>
        ${editing ? `<label for="cue-editor">Caption text</label><textarea id="cue-editor" rows="5">${escapeHtml(cue.text)}</textarea><div class="edit-actions"><button class="primary-button" id="save-repair" type="button">Save repair</button><button class="secondary-button" id="cancel-edit" type="button">Cancel</button></div>` : `<p>${escapeHtml(cue.text) || '<span class="empty-cue">[No readable text]</span>'}</p>`}
      </article>
      ${next ? contextCue(next.text, cueIndex + 2, formatTimestamp(next.startMs, documentState.format), false) : ''}
    </div>
    ${!editing ? `<div class="resolution-actions">
      <button class="primary-button" id="repair-button" type="button">Repair text <kbd>E</kbd></button>
      ${finding.suggestion ? `<button class="suggestion-button" id="apply-suggestion" type="button"><span>Suggested fix</span><strong>${escapeHtml(finding.suggestion)}</strong></button>` : ''}
      <button class="secondary-button" id="accept-button" type="button">Accept as-is <kbd>A</kbd></button>
      <button class="text-button dismiss-button" id="dismiss-button" type="button">Dismiss flag <kbd>D</kbd></button>
    </div>` : ''}
    <nav class="finding-nav" aria-label="Finding navigation"><button id="previous-finding" type="button">← Previous</button><span>${Math.max(1, activeFindings().findIndex((item) => item.id === finding.id) + 1)} of ${activeFindings().length}</span><button id="next-finding" type="button">Next →</button></nav>
  </section>`;
}

function contextCue(text: string, number: number, time: string, _current: boolean): string {
  return `<article class="cue-card neighbor"><header><span>Cue ${number}</span><time>${time}</time></header><p>${escapeHtml(text) || '[Empty]'}</p></article>`;
}

function cleanState(): string {
  return `<section class="completion-state"><span class="completion-leaf" aria-hidden="true">✓</span><p class="eyebrow">Field check complete</p><h2>No likely defects found</h2><p>The six checks found nothing to queue. A human watch-through is still the final authority.</p><button class="primary-button" id="export-button" type="button">Export unchanged ${documentState?.format.toUpperCase()}</button></section>`;
}

function finishedState(): string {
  return `<section class="detail-panel completion-state"><span class="completion-leaf" aria-hidden="true">✓</span><p class="eyebrow">Queue resolved</p><h2>Every finding has a decision</h2><p>Export the repaired captions, or show resolved findings to revisit a decision.</p><button class="primary-button" id="export-button-secondary" type="button">Export ${documentState?.format.toUpperCase()}</button></section>`;
}

function purchaseControls(): string {
  return `<a class="primary-button button-link" href="${checkoutUrl()}">Buy Studio — $19</a><p class="merchant-note">Sociobot/Dodo handles payment and refunds. Read the <a href="/terms/">purchase terms</a>.</p><hr><label for="license-token">Have a license? Paste it here</label><input id="license-token" value="${escapeHtml(storedLicense())}" autocomplete="off" /><p class="form-error" id="license-error" role="alert"></p><button class="secondary-button" id="restore-license" type="button">Restore purchase</button>`;
}

function dialogs(): string {
  return `<dialog id="paste-dialog" aria-labelledby="paste-title"><form method="dialog" class="dialog-card"><button class="dialog-close" value="cancel" aria-label="Close paste dialog">×</button><p class="eyebrow">Local import</p><h2 id="paste-title">Paste caption text</h2><label for="paste-name">File name</label><input id="paste-name" value="pasted-captions.srt" /><label for="paste-content">SRT or WebVTT captions</label><textarea id="paste-content" rows="10" placeholder="1&#10;00:00:01,000 --> 00:00:03,000&#10;Caption text"></textarea><p class="form-error" id="paste-error" role="alert"></p><button class="primary-button" id="parse-paste" type="button">Check pasted captions</button></form></dialog>
  <dialog id="glossary-dialog" aria-labelledby="glossary-title"><div class="dialog-card wide-dialog"><button class="dialog-close" data-close="glossary-dialog" aria-label="Close glossary">×</button><p class="eyebrow">Preferred terms</p><h2 id="glossary-title">Glossary</h2><p>List a preferred spelling and comma-separated variants. Findings update after you save the term.</p><form id="glossary-form"><label for="preferred-term">Preferred spelling</label><input id="preferred-term" required /><label for="variant-terms">Variants to flag</label><input id="variant-terms" required aria-describedby="variant-help" /><small id="variant-help">Example: bio-char, bio char</small><button class="primary-button" type="submit">Add term</button></form><ul class="glossary-list">${glossary.map((entry) => `<li><span><strong>${escapeHtml(entry.preferred)}</strong><small>${escapeHtml(entry.variants.join(', '))}</small></span><button data-remove-term="${escapeHtml(entry.id)}" type="button" aria-label="Remove ${escapeHtml(entry.preferred)}">Remove</button></li>`).join('') || '<li class="queue-empty">No terms yet.</li>'}</ul><div class="studio-tools"><strong>Shared glossary · Studio</strong><p>Export a glossary, then import it in another browser without an account.</p><button class="secondary-button" id="glossary-import" type="button">Import glossary JSON ${isStudio ? '' : '· Studio'}</button><button class="text-button" id="glossary-export" type="button">Export glossary JSON ${isStudio ? '' : '· Studio'}</button><input class="visually-hidden" id="glossary-file" type="file" aria-label="Import glossary JSON" accept="application/json,.json" /></div></div></dialog>
  <dialog id="studio-dialog" aria-labelledby="studio-title"><div class="dialog-card studio-dialog"><button class="dialog-close" data-close="studio-dialog" aria-label="Close Studio dialog">×</button><p class="eyebrow">One-time Studio license</p><h2 id="studio-title">Share glossaries and export team review history</h2><p class="price"><strong>$19</strong> once · one reviewer license</p><ul><li>Import and export shared glossary JSON files</li><li>Export team review history as CSV</li><li>The checker, repairs, captions, and project backups stay free</li></ul>${isStudio ? '<p class="license-good">✓ Studio is active on this device.</p>' : purchaseControls()}<p class="legal-line"><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p></div></dialog>`;
}

function footer(): string {
  return `<footer><p>Review SRT and WebVTT caption findings in your browser.</p><nav aria-label="Footer"><a href="/?demo=1">Demo</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button class="footer-studio" id="footer-studio" type="button">View Studio options</button></nav><p class="art-credit">Built by Param Factory · ${BUILD_ID} · Original field-guide artwork generated with the factory image model.</p></footer>`;
}

function demoBanner(): string {
  if (!isDemo) return '';
  return `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your workspace</strong><span>Use the six seeded findings without changing your real captions.</span><div><button id="reset-demo" type="button">Reset demo</button><button id="start-real" type="button">Start for real</button></div></aside>`;
}

function notFoundView(): string {
  return `<main id="main" class="not-found"><div aria-hidden="true" class="lost-specimen"><span>404</span></div><p class="eyebrow">Specimen not found</p><h1 id="page-title" tabindex="-1">This page is not in the field guide</h1><p>Check the address, open the checker, or try the sample captions.</p><div><a class="primary-button button-link" href="/">Open the checker</a><a class="secondary-button button-link" href="/?demo=1">Try sample captions</a></div></main>`;
}

function setRouteMetadata(): void {
  const title = isNotFound ? 'Page not found — Caption Fix Queue' : isDemo ? DEMO_TITLE : HOME_TITLE;
  const description = isNotFound ? 'Return to Caption Fix Queue or open its isolated sample.' : isDemo ? 'Try Caption Fix Queue with seven isolated sample cues and six review findings.' : 'Find caption lines that need review before small video teams and community educators publish.';
  const canonicalPath = isNotFound ? '/404.html' : isDemo ? '/demo' : '/';
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://caption-fix-queue.sociobot.in${canonicalPath}`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', title);
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `https://caption-fix-queue.sociobot.in${canonicalPath}`);
}

function render(): void {
  setRouteMetadata();
  root.innerHTML = `${header()}${demoBanner()}${isNotFound ? notFoundView() : (documentState ? workView() : emptyView())}${footer()}${isNotFound ? '' : dialogs()}<div class="route-status visually-hidden" id="route-status" aria-live="polite" aria-atomic="true"></div><div class="toast-region" id="toast-region" aria-live="polite" aria-atomic="true"></div><div class="offline-banner" id="offline-banner" role="status" ${navigator.onLine ? 'hidden' : ''}>Offline — the caption checker, repairs, and exports still work.</div>`;
  bindEvents();
  if (routeShouldFocus) focusRoute();
}

function bindEvents(): void {
  document.querySelector('#theme-button')?.addEventListener('click', toggleTheme);
  document.querySelector('#studio-button')?.addEventListener('click', () => openDialog('studio-dialog'));
  document.querySelector('#footer-studio')?.addEventListener('click', () => openDialog('studio-dialog'));
  document.querySelector('#license-notice-link')?.addEventListener('click', () => openDialog('studio-dialog'));
  document.querySelector('#studio-section-button')?.addEventListener('click', () => openDialog('studio-dialog'));
  document.querySelector('#reset-demo')?.addEventListener('click', () => void resetDemo());
  document.querySelector('#start-real')?.addEventListener('click', () => void startForReal());
  document.querySelectorAll<HTMLElement>('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.dataset.close ?? '')));
  if (!isNotFound && !documentState) bindEmptyEvents(); else if (!isNotFound) bindWorkspaceEvents();
  bindDialogEvents();
}

function bindEmptyEvents(): void {
  const input = document.querySelector<HTMLInputElement>('#file-input');
  document.querySelector('#choose-file')?.addEventListener('click', () => input?.click());
  document.querySelector('#choose-file-hero')?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', () => { const file = input.files?.[0]; if (file) void importFile(file); });
  document.querySelector('#paste-button')?.addEventListener('click', () => openDialog('paste-dialog'));
  const zone = document.querySelector<HTMLElement>('#drop-zone');
  zone?.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('dragging'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone?.addEventListener('drop', (event) => { event.preventDefault(); zone.classList.remove('dragging'); const file = event.dataTransfer?.files[0]; if (file) void importFile(file); });
}

function bindWorkspaceEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-finding]').forEach((button) => button.addEventListener('click', () => { selectedId = button.dataset.finding ?? ''; editing = false; render(); focusFindingTitle(); }));
  const resolvedToggle = document.querySelector<HTMLInputElement>('#resolved-toggle');
  resolvedToggle?.addEventListener('change', () => { showResolved = resolvedToggle.checked; refreshFindings(); render(); });
  document.querySelector('#repair-button')?.addEventListener('click', startEditing);
  document.querySelector('#cancel-edit')?.addEventListener('click', () => { editing = false; render(); focusFindingTitle(); });
  document.querySelector('#save-repair')?.addEventListener('click', saveRepair);
  document.querySelector('#apply-suggestion')?.addEventListener('click', applySuggestion);
  document.querySelector('#accept-button')?.addEventListener('click', () => resolveFinding('accepted'));
  document.querySelector('#dismiss-button')?.addEventListener('click', () => resolveFinding('dismissed'));
  document.querySelector('#previous-finding')?.addEventListener('click', () => moveFinding(-1));
  document.querySelector('#next-finding')?.addEventListener('click', () => moveFinding(1));
  document.querySelectorAll('#export-button, #export-button-secondary').forEach((button) => button.addEventListener('click', exportCaptions));
  document.querySelector('#glossary-button')?.addEventListener('click', () => openDialog('glossary-dialog'));
  const moreButton = document.querySelector<HTMLButtonElement>('#more-button');
  const moreMenu = document.querySelector<HTMLElement>('#more-menu');
  moreButton?.addEventListener('click', () => { if (moreMenu) moreMenu.hidden = !moreMenu.hidden; moreButton.setAttribute('aria-expanded', String(!moreMenu?.hidden)); });
  document.querySelector('#project-export')?.addEventListener('click', exportProject);
  document.querySelector('#project-import')?.addEventListener('click', () => document.querySelector<HTMLInputElement>('#project-file')?.click());
  document.querySelector<HTMLInputElement>('#project-file')?.addEventListener('change', (event) => void importFile((event.currentTarget as HTMLInputElement).files?.[0]));
  document.querySelector('#history-export')?.addEventListener('click', () => { if (isStudio) exportHistory(); else openDialog('studio-dialog'); });
  document.querySelector('#new-file')?.addEventListener('click', newFile);
  document.querySelector('#delete-workspace')?.addEventListener('click', deleteWorkspace);
}

function bindDialogEvents(): void {
  document.querySelector('#parse-paste')?.addEventListener('click', () => {
    const name = document.querySelector<HTMLInputElement>('#paste-name')?.value || 'pasted-captions.srt';
    const content = document.querySelector<HTMLTextAreaElement>('#paste-content')?.value || '';
    try { importText(content, name); closeDialog('paste-dialog'); } catch (error) { setError('paste-error', messageFor(error)); }
  });
  document.querySelector('#glossary-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const preferred = document.querySelector<HTMLInputElement>('#preferred-term')?.value.trim() ?? '';
    const variants = (document.querySelector<HTMLInputElement>('#variant-terms')?.value ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (!preferred || !variants.length) return;
    glossary.push({ id: `${Date.now()}`, preferred, variants }); refreshFindings(); scheduleSave(); render(); openDialog('glossary-dialog'); toast(`Added “${preferred}” to the glossary.`);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-remove-term]').forEach((button) => button.addEventListener('click', () => { glossary = glossary.filter((entry) => entry.id !== button.dataset.removeTerm); refreshFindings(); scheduleSave(); render(); openDialog('glossary-dialog'); }));
  document.querySelector('#glossary-import')?.addEventListener('click', () => isStudio ? document.querySelector<HTMLInputElement>('#glossary-file')?.click() : openDialog('studio-dialog'));
  document.querySelector('#glossary-export')?.addEventListener('click', () => isStudio ? download('caption-glossary.json', JSON.stringify({ version: 1, glossary }, null, 2), 'application/json') : openDialog('studio-dialog'));
  document.querySelector<HTMLInputElement>('#glossary-file')?.addEventListener('change', (event) => void importGlossary((event.currentTarget as HTMLInputElement).files?.[0]));
  document.querySelector('#restore-license')?.addEventListener('click', restoreLicense);
}

async function importFile(file?: File): Promise<void> {
  if (!file) return;
  if (/\.json$/i.test(file.name) || file.type === 'application/json') { await importProject(file); return; }
  if (!/\.(srt|vtt)$/i.test(file.name) && !['text/vtt', 'application/x-subrip', 'text/plain'].includes(file.type)) { toast('Choose an SRT or VTT caption file.', 'warning'); return; }
  if (file.size > 5_000_000) { toast('That file is over 5 MB. Split it into a smaller caption file first.', 'warning'); return; }
  try { importText(await file.text(), file.name); } catch (error) { toast(messageFor(error), 'warning'); }
}

async function importProject(file: File): Promise<void> {
  try {
    const data = JSON.parse(await file.text()) as Partial<SavedState> & { version?: number };
    if (data.version !== 1 || !data.document || !Array.isArray(data.document.cues) || !['srt', 'vtt'].includes(data.document.format)) throw new Error('invalid');
    documentState = data.document;
    statuses = data.statuses ?? {};
    glossary = Array.isArray(data.glossary) ? data.glossary : glossary;
    reviewHistory = Array.isArray(data.history) ? data.history : [];
    showResolved = false; editing = false; refreshFindings(); scheduleSave(); render();
    toast(`Restored “${documentState.name}” from its project backup.`);
  } catch { toast('That JSON file is not a valid Caption Fix Queue project backup.', 'warning'); }
}

function importText(text: string, name: string): void {
  const parsed = parseCaptions(text, name);
  documentState = parsed; statuses = {}; reviewHistory = []; showResolved = false; editing = false; refreshFindings(); scheduleSave(); render();
  requestAnimationFrame(() => document.querySelector('#page-title')?.scrollIntoView());
  toast(`${parsed.cues.length} cues checked. ${findings.length} finding${findings.length === 1 ? '' : 's'} queued.`);
}

function resolveFinding(status: 'accepted' | 'dismissed'): void {
  const finding = currentFinding();
  if (!finding || !documentState) return;
  lastAction = { id: finding.id, previous: statuses[finding.id] ?? 'open', historyLength: reviewHistory.length };
  statuses[finding.id] = status;
  reviewHistory.push({ id: `${Date.now()}-${finding.id}`, documentName: documentState.name, cueId: finding.cueId, findingKind: finding.kind, action: status, at: Date.now() });
  refreshFindings(); scheduleSave(); render(); toast(`Finding ${status}.`, 'normal', true);
}

function startEditing(): void { editing = true; render(); requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('#cue-editor')?.focus()); }

function saveRepair(): void {
  const value = document.querySelector<HTMLTextAreaElement>('#cue-editor')?.value;
  if (value === undefined) return;
  repairWith(value);
}

function applySuggestion(): void { const finding = currentFinding(); if (finding?.suggestion !== undefined) repairWith(finding.suggestion); }

function repairWith(text: string): void {
  const finding = currentFinding();
  const cue = documentState?.cues.find((item) => item.id === finding?.cueId);
  if (!finding || !cue || !documentState) return;
  lastAction = {
    id: finding.id,
    previous: statuses[finding.id] ?? 'open',
    historyLength: reviewHistory.length,
    repair: { cueId: cue.id, previousText: cue.text, previousUpdatedAt: documentState.updatedAt }
  };
  cue.text = text; documentState.updatedAt = Date.now(); statuses[finding.id] = 'repaired';
  reviewHistory.push({ id: `${Date.now()}-${finding.id}`, documentName: documentState.name, cueId: finding.cueId, findingKind: finding.kind, action: 'repaired', at: Date.now() });
  editing = false; refreshFindings(); scheduleSave(); render(); toast('Repair saved and all checks rerun.', 'normal', true);
}

function undoLast(): void {
  if (!lastAction) return;
  const action = lastAction;
  if (action.repair && documentState) {
    const cue = documentState.cues.find((item) => item.id === action.repair?.cueId);
    if (cue) {
      cue.text = action.repair.previousText;
      documentState.updatedAt = action.repair.previousUpdatedAt;
    }
  }
  statuses[action.id] = action.previous;
  reviewHistory = reviewHistory.slice(0, action.historyLength);
  selectedId = action.id; lastAction = undefined; refreshFindings(); scheduleSave(); render(); toast(action.repair ? 'Repair undone.' : 'Decision undone.');
}

function moveFinding(direction: number): void {
  const visible = activeFindings();
  if (!visible.length) return;
  const index = Math.max(0, visible.findIndex((finding) => finding.id === currentFinding()?.id));
  selectedId = visible[(index + direction + visible.length) % visible.length]?.id ?? selectedId; editing = false; render(); focusFindingTitle();
}

function exportCaptions(): void {
  if (!documentState) return;
  download(documentState.name, serializeCaptions(documentState), documentState.format === 'vtt' ? 'text/vtt' : 'application/x-subrip');
  toast('Caption file exported.');
}

function exportProject(): void {
  download(`${documentState?.name ?? 'captions'}.caption-fix.json`, JSON.stringify({ version: 1, document: documentState, statuses, glossary, history: reviewHistory, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
}

function exportHistory(): void {
  const rows = [['document', 'cue_id', 'finding', 'action', 'timestamp'], ...reviewHistory.map((record) => [record.documentName, record.cueId, record.findingKind, record.action, new Date(record.at).toISOString()])];
  download('caption-review-history.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv');
}

function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

async function importGlossary(file?: File): Promise<void> {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text()) as { glossary?: GlossaryEntry[] };
    if (!Array.isArray(data.glossary) || data.glossary.some((entry) => !entry.preferred || !Array.isArray(entry.variants))) throw new Error('invalid');
    glossary = data.glossary.map((entry, index) => ({ id: entry.id || `imported-${index}`, preferred: String(entry.preferred), variants: entry.variants.map(String) }));
    refreshFindings(); scheduleSave(); render(); openDialog('glossary-dialog'); toast(`Imported ${glossary.length} glossary terms.`);
  } catch { toast('That JSON file is not a Caption Fix Queue glossary.', 'warning'); }
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: name }); anchor.click(); URL.revokeObjectURL(url);
}

function newFile(): void {
  if (!confirm('Review another file? Your current work is saved locally and can be exported first.')) return;
  documentState = undefined; statuses = {}; findings = []; selectedId = ''; render();
}

async function deleteWorkspace(): Promise<void> {
  if (!confirm(`Delete the local workspace for “${documentState?.name}”? Exported files will not be affected. This cannot be undone.`)) return;
  await clearState(); documentState = undefined; statuses = {}; reviewHistory = []; findings = []; selectedId = ''; render(); toast('Local workspace deleted.');
}

async function restoreLicense(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('#license-token');
  const token = input?.value.trim() ?? '';
  if (!token) { setError('license-error', 'Paste the license token from your receipt.'); return; }
  saveLicense(token); const result = await verifyLicense(true);
  if (result.valid) { isStudio = true; licenseInactive = false; render(); toast('Studio restored on this device.'); }
  else { isStudio = false; licenseInactive = result.reason !== 'offline'; setError('license-error', result.reason === 'offline' ? 'Could not reach the license service. Check your connection and try again.' : 'That license is not active for this product.'); }
}

function openDialog(id: string): void {
  const dialog = document.querySelector<HTMLDialogElement>(`#${id}`);
  if (dialog && !dialog.open) dialog.showModal();
}

function closeDialog(id: string): void { document.querySelector<HTMLDialogElement>(`#${id}`)?.close(); }
function setError(id: string, message: string): void { const node = document.querySelector(`#${id}`); if (node) node.textContent = message; }
function messageFor(error: unknown): string { return error instanceof Error ? error.message : 'That caption file could not be read.'; }

function toast(message: string, tone: 'normal' | 'warning' = 'normal', undo = false): void {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  region.innerHTML = `<div class="toast ${tone}"><span>${escapeHtml(message)}</span>${undo ? '<button id="undo-action" type="button">Undo</button>' : ''}</div>`;
  document.querySelector('#undo-action')?.addEventListener('click', undoLast);
  window.setTimeout(() => { if (region.textContent?.includes(message)) region.innerHTML = ''; }, 5000);
}

function focusFindingTitle(): void { requestAnimationFrame(() => { const heading = document.querySelector<HTMLElement>('#finding-title'); heading?.setAttribute('tabindex', '-1'); heading?.focus(); }); }

function toggleTheme(): void {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; localStorage.setItem('caption-theme', next);
  document.querySelector('#theme-button')?.setAttribute('aria-label', next === 'dark' ? 'Use light theme' : 'Use dark theme');
}

function applyStoredTheme(): void {
  const stored = localStorage.getItem('caption-theme');
  if (stored === 'dark' || stored === 'light') document.documentElement.dataset.theme = stored;
}

function onKeyboard(event: KeyboardEvent): void {
  if (!documentState || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName) || document.querySelector('dialog[open]')) return;
  if (event.key.toLowerCase() === 'j') { event.preventDefault(); moveFinding(1); }
  if (event.key.toLowerCase() === 'k') { event.preventDefault(); moveFinding(-1); }
  if (event.key.toLowerCase() === 'e' && currentFinding()) { event.preventDefault(); startEditing(); }
  if (event.key.toLowerCase() === 'a' && currentFinding()) { event.preventDefault(); resolveFinding('accepted'); }
  if (event.key.toLowerCase() === 'd' && currentFinding()) { event.preventDefault(); resolveFinding('dismissed'); }
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) toast('A fresh field guide is ready. Reload to update.'); });
    });
  } catch { /* App remains fully usable without installation support. */ }
}

async function initialize(): Promise<void> {
  applyStoredTheme(); captureReturnedLicense(); isStudio = cachedUnlock(); setStorageMode(isDemo);
  if (!isNotFound) {
    try {
      const saved = await loadState();
      if (saved) { documentState = saved.document; statuses = saved.statuses ?? {}; glossary = saved.glossary?.length ? saved.glossary : glossary; reviewHistory = saved.history ?? []; }
    } catch { /* IndexedDB may be unavailable in strict private browsing. */ }
    if (isDemo && !documentState) {
      documentState = parseCaptions(SAMPLE, 'garden-workshop-sample.srt');
      statuses = {}; reviewHistory = [];
      refreshFindings(); scheduleSave();
    }
  }
  refreshFindings(); routeShouldFocus = true; render();
  window.addEventListener('keydown', onKeyboard);
  window.addEventListener('pageshow', () => focusRoute());
  window.addEventListener('online', () => { document.querySelector<HTMLElement>('#offline-banner')?.setAttribute('hidden', ''); void verifyInBackground(); });
  window.addEventListener('offline', () => document.querySelector<HTMLElement>('#offline-banner')?.removeAttribute('hidden'));
  void registerServiceWorker(); void verifyInBackground();
  if (new URLSearchParams(window.location.search).get('studio') === '1') requestAnimationFrame(() => openDialog('studio-dialog'));
}

async function resetDemo(): Promise<void> {
  if (!isDemo) return;
  await clearState();
  glossary = [{ id: 'starter-biochar', preferred: 'biochar', variants: ['bio-char', 'bio char'] }];
  documentState = parseCaptions(SAMPLE, 'garden-workshop-sample.srt');
  statuses = {}; reviewHistory = []; selectedId = ''; showResolved = false; editing = false;
  refreshFindings(); scheduleSave(); routeShouldFocus = true; render(); toast('Demo reset to seven sample cues.');
}

async function startForReal(): Promise<void> {
  if (!isDemo) return;
  await clearState();
  window.location.assign('/');
}

function focusRoute(): void {
  routeShouldFocus = false;
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>('#page-title');
    heading?.focus({ preventScroll: true });
    const status = document.querySelector<HTMLElement>('#route-status');
    if (status && heading) status.textContent = heading.textContent?.trim() ?? '';
  });
}

async function verifyInBackground(): Promise<void> {
  if (!storedLicense()) return;
  const verdict = await verifyLicense();
  const inactiveChanged = licenseInactive !== !verdict.valid;
  if (verdict.reason !== 'offline' && (verdict.valid !== isStudio || inactiveChanged)) { isStudio = verdict.valid; licenseInactive = !verdict.valid; render(); if (!verdict.valid) toast('Studio license is no longer active. Free features are unchanged.', 'warning'); }
}

void initialize();
