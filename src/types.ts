export type CaptionFormat = 'srt' | 'vtt';

export interface Cue {
  id: string;
  identifier?: string;
  startMs: number;
  endMs: number;
  text: string;
  settings?: string;
}

export interface CaptionDocument {
  id: string;
  name: string;
  format: CaptionFormat;
  cues: Cue[];
  vttHeader?: string;
  metadataBlocks?: string[];
  importedAt: number;
  updatedAt: number;
}

export type FindingKind = 'repeat' | 'blank' | 'character' | 'speed' | 'speaker' | 'glossary';
export type FindingStatus = 'open' | 'accepted' | 'dismissed' | 'repaired';

export interface Finding {
  id: string;
  kind: FindingKind;
  cueId: string;
  title: string;
  explanation: string;
  evidence: string;
  suggestion?: string;
  severity: 'check' | 'important';
  status: FindingStatus;
}

export interface GlossaryEntry {
  id: string;
  preferred: string;
  variants: string[];
}

export interface ReviewRecord {
  id: string;
  documentName: string;
  cueId: string;
  findingKind: FindingKind;
  action: Exclude<FindingStatus, 'open'>;
  at: number;
}

export interface SavedState {
  document?: CaptionDocument;
  statuses: Record<string, FindingStatus>;
  glossary: GlossaryEntry[];
  history: ReviewRecord[];
  savedAt: number;
}
