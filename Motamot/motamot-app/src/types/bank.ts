// src/types/bank.ts
// Shared data contract for the pre-generated, individually-validated sentence bank.
// Owned by the bank-pipeline plan; imported by the frontend and audio plans.
// Do NOT change field names or types without coordinating all three plans.

export type BankLevel = 'A1' | 'A2' | 'B1';

export type BankTokenType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'function';

export type BankGender = 'm' | 'f' | null;

export interface BankToken {
  /** Exact substring of the sentence text: text.slice(start, end) === surface */
  surface: string;
  lemma: string;
  type: BankTokenType;
  gender: BankGender;
  /** PNG filename in public/word-images/ (e.g. 'chat.png'), or null. */
  image: string | null;
  /** Short English gloss for content words; null for function words. */
  en: string | null;
  /** Char offset into text where surface begins. */
  start: number;
  /** Char offset into text where surface ends (exclusive). */
  end: number;
  /** Shown during the tap-through reveal. */
  isContent: boolean;
  /** A tracked learning lemma (spaced repetition unit). */
  isTarget: boolean;
}

export interface BankValidation {
  grammar: boolean;
  semantics: boolean;
  frenchOnly: boolean;
  simplicity: boolean;
  humor: boolean;
  safety: boolean;
}

export interface BankSentence {
  /** Stable ID — survives regeneration so localStorage 'seen' state persists. */
  id: string;
  text: string;
  level: BankLevel;
  /** Illustrated-noun lemmas this sentence was seeded from. */
  anchors: string[];
  theme: string;
  humorMechanism: string;
  /** Supabase MP3 filename, e.g. 'sentence-<id>.mp3'; null until the audio batch runs. */
  audio: string | null;
  tokens: BankToken[];
  validation: BankValidation;
}

export interface SentenceBank {
  schemaVersion: number;
  generatorModel: string;
  generatorVersion: string;
  validatorModel: string;
  validatorVersion: string;
  /** ISO 8601 timestamp. */
  generatedAt: string;
  sentences: BankSentence[];
}
