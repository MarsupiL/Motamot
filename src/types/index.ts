export type Gender = 'm' | 'f';

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition';

export interface NounData {
  word: string;
  gender: Gender;
  image?: string; // Bundled illustration filename
}

export interface Word {
  word: string;
  type: WordType;
  gender?: Gender;
  image?: string; // Bundled illustration filename
}

export interface SentenceWord {
  word: string;
  type: WordType;
  form: string;
}

export interface SentenceExample {
  id: string;
  topic: string;
  text: string;
  note?: string;
  words: SentenceWord[];
}

export interface Lesson {
  example: SentenceExample;
  words: Word[];
}
