import { allWords, wordKey } from '../data/frenchWords.ts';
import { examples } from '../data/sentences.ts';
import curriculum from '../data/curriculum.json' with { type: 'json' };
import type { Lesson, SentenceExample, SentenceWord, Word } from '../types';

export const LESSON_SIZE = curriculum.lessonSize;
const dictionary = new Map(allWords.map(word => [wordKey(word), word]));
// Fixed membership preserves whole-course coverage regardless of lesson order or reloads.
const plannedWords = new Map(Object.entries(curriculum.lessons).map(([id, keys]) => [id, keys.map(key => {
  const word = dictionary.get(key);
  if (!word) throw new Error(`Unknown curriculum vocabulary: ${key}`);
  return word;
})]));

export const shuffle = <T,>(items: readonly T[], random = Math.random): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getExampleWord = (target: SentenceWord): Word => {
  const word = dictionary.get(wordKey(target));
  if (!word) throw new Error(`Missing vocabulary: ${wordKey(target)}`);
  return word;
};

export const createLesson = (example: SentenceExample, random = Math.random): Lesson => {
  const words = plannedWords.get(example.id);
  if (!words) throw new Error(`Missing curriculum lesson: ${example.id}`);
  return { example, words: shuffle(words, random) };
};

export const createLessonOrder = (previousId?: string, random = Math.random, seen: readonly string[] = []): SentenceExample[] => {
  const excluded = new Set(seen);
  const order = shuffle(examples.filter(example => !excluded.has(example.text)), random);
  const previous = examples.find(example => previousId
    ? example.id === previousId : example.text === seen[seen.length - 1]);
  if (order[0]?.id === previous?.id && order.length > 1) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  let previousTopic = previous?.topic;
  for (let i = 0; i < order.length; i++) {
    if (order[i].topic === previousTopic) {
      const different = order.findIndex((example, j) => j > i && example.topic !== previousTopic && example.id !== previous?.id);
      if (different !== -1) [order[i], order[different]] = [order[different], order[i]];
    }
    previousTopic = order[i].topic;
  }
  return order;
};

// Exact, annotated French word forms, never stems or substring guesses.
const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const formPattern = (form: string): RegExp =>
  new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(form)}(?![\\p{L}\\p{M}])`, 'giu');

export const sentenceParts = (example: SentenceExample): { text: string; highlighted: boolean }[] => {
  const ranges = example.words.flatMap(word =>
    [...example.text.matchAll(formPattern(word.form))].map(match => ({ start: match.index!, end: match.index! + match[0].length }))
  ).sort((a, b) => a.start - b.start || b.end - a.end);
  const parts: { text: string; highlighted: boolean }[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) parts.push({ text: example.text.slice(cursor, range.start), highlighted: false });
    parts.push({ text: example.text.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  }
  if (cursor < example.text.length) parts.push({ text: example.text.slice(cursor), highlighted: false });
  return parts;
};
