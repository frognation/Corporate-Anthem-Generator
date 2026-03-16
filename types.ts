export interface WordUnit {
  text: string;
  pitch: number; // 0.5 to 2.0
}

export interface SongSegment {
  words: WordUnit[];
  rate: number;
}

export interface CompanySong {
  companyName: string;
  summary: string;
  lyrics: SongSegment[];
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}