export type Gender = 'm' | 'f';

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb';

export interface NounData {
  word: string;
  gender: Gender;
}

export interface Word {
  word: string;
  type: WordType;
  gender?: Gender;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChoice {
  message: {
    content: string;
  };
}

export interface GroqResponse {
  choices: GroqChoice[];
}
