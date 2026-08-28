import { plainText } from './parser';
import type { CaptionDocument, Finding, FindingStatus, GlossaryEntry } from './types';

function key(kind: string, cueId: string, marker: string): string {
  return `${kind}:${cueId}:${marker.toLocaleLowerCase()}`;
}

function words(value: string): string[] {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? [];
}

function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      current[j + 1] = Math.min((current[j] ?? 0) + 1, (previous[j + 1] ?? 0) + 1, (previous[j] ?? 0) + (a[i] === b[j] ? 0 : 1));
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] ?? 0;
}

function statusFor(id: string, statuses: Record<string, FindingStatus>): FindingStatus {
  return statuses[id] ?? 'open';
}

export function runChecks(document: CaptionDocument, glossary: GlossaryEntry[], statuses: Record<string, FindingStatus> = {}): Finding[] {
  const findings: Finding[] = [];
  const speakers = new Map<string, { raw: string; cueId: string }[]>();

  document.cues.forEach((cue, cueIndex) => {
    const text = plainText(cue.text);
    const cueWords = words(text);
    const adjacentRepeat = cueWords.find((word, index) => index > 0 && word.toLocaleLowerCase() === cueWords[index - 1]?.toLocaleLowerCase());
    if (adjacentRepeat) {
      const id = key('repeat', cue.id, adjacentRepeat);
      findings.push({ id, kind: 'repeat', cueId: cue.id, title: 'Possible repeated word', explanation: 'The same word appears twice in a row. This often comes from a transcription restart.', evidence: `“${adjacentRepeat} ${adjacentRepeat}”`, suggestion: text.replace(new RegExp(`\\b(${escapeRegExp(adjacentRepeat)})\\s+\\1\\b`, 'iu'), adjacentRepeat), severity: 'check', status: statusFor(id, statuses) });
    }
    const previous = document.cues[cueIndex - 1];
    if (previous && text.length > 3 && text.toLocaleLowerCase() === plainText(previous.text).toLocaleLowerCase()) {
      const id = key('repeat', cue.id, 'previous-cue');
      findings.push({ id, kind: 'repeat', cueId: cue.id, title: 'Cue repeats the previous cue', explanation: 'Two neighboring cues contain the same text. Confirm that the repeat is intentional.', evidence: `Also shown in cue ${cueIndex}`, severity: 'important', status: statusFor(id, statuses) });
    }

    if (!text || /^([♪♫\s]|<[^>]+>)*$/.test(cue.text)) {
      const id = key('blank', cue.id, 'empty');
      findings.push({ id, kind: 'blank', cueId: cue.id, title: 'Cue has no readable words', explanation: 'This timed cue contains only whitespace, markup, or music symbols.', evidence: `${((cue.endMs - cue.startMs) / 1000).toFixed(1)} seconds with no readable caption`, severity: 'important', status: statusFor(id, statuses) });
    }
    if (/\n\s*\n/.test(cue.text)) {
      const id = key('blank', cue.id, 'blank-line');
      findings.push({ id, kind: 'blank', cueId: cue.id, title: 'Blank line inside cue', explanation: 'An empty line can split or hide caption content in some players.', evidence: 'Two line breaks with no text between them', suggestion: cue.text.replace(/\n\s*\n/g, '\n'), severity: 'check', status: statusFor(id, statuses) });
    }

    const badCharacter = Array.from(cue.text).find((character) => character === '\uFFFD' || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\uE000-\uF8FF]/u.test(character));
    if (badCharacter) {
      const code = `U+${badCharacter.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;
      const id = key('character', cue.id, code);
      findings.push({ id, kind: 'character', cueId: cue.id, title: 'Hidden or unsupported character', explanation: 'This character can render as a box, disappear, or alter text direction in a caption player.', evidence: `${code} in this cue`, suggestion: cue.text.replaceAll(badCharacter, ''), severity: 'important', status: statusFor(id, statuses) });
    }

    const seconds = (cue.endMs - cue.startMs) / 1000;
    const characters = text.replace(/\s/g, '').length;
    const cps = seconds > 0 ? characters / seconds : 0;
    const longestLine = Math.max(0, ...cue.text.split('\n').map((line) => plainText(line).length));
    if (cps > 20 || longestLine > 42 || cue.text.split('\n').length > 2) {
      const id = key('speed', cue.id, 'reading-load');
      const evidence = [cps > 20 ? `${cps.toFixed(1)} characters/second (target ≤ 20)` : '', longestLine > 42 ? `${longestLine} characters on one line (target ≤ 42)` : '', cue.text.split('\n').length > 2 ? `${cue.text.split('\n').length} lines (target ≤ 2)` : ''].filter(Boolean).join(' · ');
      findings.push({ id, kind: 'speed', cueId: cue.id, title: 'High reading load', explanation: 'This cue may be difficult to read before it disappears. Timing and line length should be checked against the video.', evidence, severity: cps > 25 ? 'important' : 'check', status: statusFor(id, statuses) });
    }

    const speakerMatches = [...cue.text.matchAll(/(?:<v\s+([^>]+)>|^([\p{Lu}][\p{Lu}\p{N} .'-]{1,30}):)/gmu)];
    for (const match of speakerMatches) {
      const raw = (match[1] ?? match[2] ?? '').trim();
      const normalized = raw.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      if (normalized) speakers.set(normalized, [...(speakers.get(normalized) ?? []), { raw, cueId: cue.id }]);
    }

    for (const entry of glossary) {
      for (const variant of entry.variants) {
        if (!variant.trim()) continue;
        const match = text.match(new RegExp(`\\b${escapeRegExp(variant.trim())}\\b`, 'iu'));
        if (match && match[0].toLocaleLowerCase() !== entry.preferred.toLocaleLowerCase()) {
          const id = key('glossary', cue.id, `${entry.id}-${variant}`);
          findings.push({ id, kind: 'glossary', cueId: cue.id, title: 'Glossary mismatch', explanation: 'The caption uses a listed variant instead of your preferred spelling.', evidence: `“${match[0]}” → preferred “${entry.preferred}”`, suggestion: cue.text.replace(new RegExp(`\\b${escapeRegExp(match[0])}\\b`, 'giu'), entry.preferred), severity: 'check', status: statusFor(id, statuses) });
          break;
        }
      }
    }
  });

  const speakerGroups = [...speakers.entries()];
  for (let i = 0; i < speakerGroups.length; i += 1) {
    const first = speakerGroups[i];
    if (!first) continue;
    for (let j = i + 1; j < speakerGroups.length; j += 1) {
      const second = speakerGroups[j];
      if (!second) continue;
      if (first[0].length >= 3 && second[0].length >= 3 && levenshtein(first[0], second[0]) <= 2) {
        const occurrence = second[1][0];
        const canonical = first[1][0];
        if (!occurrence || !canonical) continue;
        const id = key('speaker', occurrence.cueId, `${first[0]}-${second[0]}`);
        findings.push({ id, kind: 'speaker', cueId: occurrence.cueId, title: 'Speaker name may be inconsistent', explanation: 'Two very similar speaker labels appear in this file. Confirm that they name the same person.', evidence: `“${canonical.raw}” and “${occurrence.raw}”`, severity: 'check', status: statusFor(id, statuses) });
      }
    }
  }

  return findings.sort((a, b) => {
    const status = Number(a.status !== 'open') - Number(b.status !== 'open');
    if (status) return status;
    return document.cues.findIndex((cue) => cue.id === a.cueId) - document.cues.findIndex((cue) => cue.id === b.cueId);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
