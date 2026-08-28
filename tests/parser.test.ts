import { describe, expect, it } from 'vitest';
import { formatTimestamp, parseCaptions, parseTimestamp, serializeCaptions } from '../src/parser';

describe('caption parser', () => {
  it('parses and preserves SRT cues', () => {
    const document = parseCaptions(`1\r\n00:00:01,250 --> 00:00:03,500\r\nHello, world.\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,000\r\nSecond line.\r\n`, 'lesson.srt');
    expect(document.format).toBe('srt');
    expect(document.cues).toHaveLength(2);
    expect(document.cues[0]?.startMs).toBe(1250);
    expect(document.cues[0]?.text).toBe('Hello, world.');
    expect(serializeCaptions(document)).toContain('00:00:01,250 --> 00:00:03,500');
  });

  it('parses WebVTT identifiers and settings', () => {
    const document = parseCaptions(`WEBVTT - Workshop captions\n\nNOTE reviewed locally\n\nSTYLE\n::cue { color: white; }\n\nintro\n00:00:01.000 --> 00:00:03.000 align:start position:10%\n<v Mara>Hello\n`, 'lesson.vtt');
    expect(document.format).toBe('vtt');
    expect(document.cues[0]?.identifier).toBe('intro');
    expect(document.cues[0]?.settings).toBe('align:start position:10%');
    expect(serializeCaptions(document)).toContain('NOTE reviewed locally');
    expect(serializeCaptions(document)).toContain('::cue { color: white; }');
  });

  it('rejects empty, malformed, and reverse-timed captions with useful errors', () => {
    expect(() => parseCaptions('', 'empty.srt')).toThrow(/empty/i);
    expect(() => parseTimestamp('00:70:00,000')).toThrow(/valid caption timestamp/i);
    expect(() => parseCaptions('1\n00:00:04,000 --> 00:00:03,000\nNope', 'bad.srt')).toThrow(/does not end after/i);
  });

  it('formats both timestamp dialects', () => {
    expect(formatTimestamp(3_723_004, 'srt')).toBe('01:02:03,004');
    expect(formatTimestamp(3_723_004, 'vtt')).toBe('01:02:03.004');
    expect(parseTimestamp('02:03.004')).toBe(123_004);
  });
});
