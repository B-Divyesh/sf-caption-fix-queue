import { describe, expect, it } from 'vitest';
import { removeAdjacentRepeatPreservingMarkup, runChecks } from '../src/checks';
import { parseCaptions } from '../src/parser';

describe('explainable checks', () => {
  it('finds repeat, blank, unsafe character, speed, speaker, and glossary issues', () => {
    const document = parseCaptions(`1\n00:00:01,000 --> 00:00:03,000\nWe we use bio-char.\n\n2\n00:00:03,100 --> 00:00:05,000\nMARA: Hello.\n\n3\n00:00:05,100 --> 00:00:05,500\nMARRA: This sentence is deliberately much too long for its very short display duration.\n\n4\n00:00:06,000 --> 00:00:07,000\nHidden​ mark.\n\n5\n00:00:07,100 --> 00:00:08,000\n`, 'issues.srt');
    const findings = runChecks(document, [{ id: 'bio', preferred: 'biochar', variants: ['bio-char'] }]);
    expect(new Set(findings.map((finding) => finding.kind))).toEqual(new Set(['repeat', 'blank', 'character', 'speed', 'speaker', 'glossary']));
    expect(findings.every((finding) => finding.explanation && finding.evidence)).toBe(true);
  });

  it('carries saved resolution status by stable finding id', () => {
    const document = parseCaptions('1\n00:00:01,000 --> 00:00:03,000\nYes yes.', 'repeat.srt');
    const first = runChecks(document, [])[0];
    expect(first).toBeDefined();
    const second = runChecks(document, [], { [first!.id]: 'accepted' })[0];
    expect(second?.status).toBe('accepted');
  });

  it('keeps WebVTT voice markup and original capitalization in a repeat suggestion', () => {
    const source = '<v MARA>Hello hello</v>';
    expect(removeAdjacentRepeatPreservingMarkup(source, 'hello')).toBe('<v MARA>Hello</v>');
    const document = parseCaptions(`WEBVTT\n\nintro\n00:00.000 --> 00:02.000 line:90%\n${source}`, 'voice.vtt');
    expect(runChecks(document, []).find((finding) => finding.kind === 'repeat')?.suggestion).toBe('<v MARA>Hello</v>');
  });

  it('withholds a repeat suggestion when tags divide the repeated words', () => {
    expect(removeAdjacentRepeatPreservingMarkup('Hello <i>hello</i>', 'hello')).toBeUndefined();
  });
});
