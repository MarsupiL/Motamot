import translations from '../data/englishTranslations.json' with { type: 'json' };
import { wordKey } from '../data/frenchWords.ts';
import type { Word } from '../types';

// Keep homonyms with different parts of speech separate, e.g. le pouvoir / pouvoir.
const words = new Map(Object.entries(translations.words));
// Exact French text prevents an edited sentence from retaining an outdated translation.
const sentences = new Map(Object.entries(translations.sentences));

export const translateWord = (word: Pick<Word, 'type' | 'word'>): string | undefined =>
  words.get(wordKey(word));

export const translateSentence = (text: string): string | undefined => sentences.get(text);
