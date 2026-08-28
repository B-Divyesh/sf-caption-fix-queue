import type { CaptionDocument, CaptionFormat, Cue } from './types';

const timePattern = /^(?:(\d+):)?([0-5]\d):([0-5]\d)([,.])(\d{3})$/;

export function parseTimestamp(value: string): number {
  const match = value.trim().match(timePattern);
  if (!match) throw new Error(`“${value.trim()}” is not a valid caption timestamp.`);
  return Number(match[1] ?? 0) * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1_000 + Number(match[5]);
}

function makeCueId(index: number, startMs: number): string {
  return `cue-${index + 1}-${startMs}`;
}

export function parseCaptions(raw: string, fileName = 'Untitled captions.srt'): CaptionDocument {
  const source = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!source.trim()) throw new Error('This file is empty. Choose an SRT or WebVTT file with at least one cue.');

  const extension = fileName.toLowerCase().split('.').pop();
  const hasVttHeader = /^WEBVTT(?:\s|$)/.test(source.trimStart());
  const format: CaptionFormat = hasVttHeader || extension === 'vtt' ? 'vtt' : 'srt';
  let body = source;
  if (hasVttHeader) body = source.trimStart().replace(/^WEBVTT[^\n]*\n?/, '');

  const blocks = body.split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const originalBlock of blocks) {
    const block = originalBlock.replace(/^\n+/, '').trimEnd();
    if (!block.trim() || /^(NOTE|STYLE|REGION)(?:\s|$)/.test(block.trimStart())) continue;
    const lines = block.split('\n');
    let timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) continue;
    if (timingIndex > 1) {
      throw new Error(`A cue near “${lines[0]?.slice(0, 38)}” has content before its timing line.`);
    }
    const identifier = timingIndex === 1 ? lines[0]?.trim() : undefined;
    const timing = lines[timingIndex]?.match(/^\s*(\S+)\s+-->\s+(\S+)(?:\s+(.*))?\s*$/);
    if (!timing) throw new Error(`Could not read timing line “${lines[timingIndex]?.trim()}”.`);
    const startMs = parseTimestamp(timing[1] ?? '');
    const endMs = parseTimestamp(timing[2] ?? '');
    if (endMs <= startMs) throw new Error(`A cue ending at ${timing[2]} does not end after it starts.`);
    const text = lines.slice(timingIndex + 1).join('\n');
    cues.push({
      id: makeCueId(cues.length, startMs),
      identifier: identifier || undefined,
      startMs,
      endMs,
      text,
      settings: timing[3]?.trim() || undefined
    });
  }

  if (!cues.length) throw new Error('No caption cues were found. Check that each cue has a “-->” timing line.');
  for (let index = 1; index < cues.length; index += 1) {
    const current = cues[index];
    const previous = cues[index - 1];
    if (current && previous && current.startMs < previous.startMs) {
      throw new Error(`Cue ${index + 1} starts before the cue above it. Put cues in time order and try again.`);
    }
  }

  const now = Date.now();
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: fileName.replace(/[^\p{L}\p{N}._ -]/gu, '_'),
    format,
    cues,
    importedAt: now,
    updatedAt: now
  };
}

export function formatTimestamp(ms: number, format: CaptionFormat): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  const millis = ms % 1_000;
  const divider = format === 'srt' ? ',' : '.';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${divider}${String(millis).padStart(3, '0')}`;
}

export function serializeCaptions(document: CaptionDocument): string {
  const blocks = document.cues.map((cue, index) => {
    const id = document.format === 'srt' ? String(index + 1) : cue.identifier;
    const timing = `${formatTimestamp(cue.startMs, document.format)} --> ${formatTimestamp(cue.endMs, document.format)}${cue.settings ? ` ${cue.settings}` : ''}`;
    return [id, timing, cue.text].filter((line) => line !== undefined && line !== '').join('\n');
  });
  return `${document.format === 'vtt' ? 'WEBVTT\n\n' : ''}${blocks.join('\n\n')}\n`;
}

export function plainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}
