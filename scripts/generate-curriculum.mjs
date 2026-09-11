// Maintenance only: commit the resulting plan so lesson vocabulary stays fixed across visits.
import { readFileSync, writeFileSync } from 'node:fs';
import { allWords, wordKey } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';

const minimumAppearances = 3;
const keys = allWords.map(wordKey).sort();
const counts = new Map(keys.map(key => [key, 0]));
const lessons = [...examples].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  .map(example => ({ id: example.id, keys: new Set(example.words.map(wordKey)) }));
for (const lesson of lessons) {
  for (const key of lesson.keys) {
    if (!counts.has(key)) throw new Error(`Unknown vocabulary: ${key}`);
    counts.set(key, counts.get(key) + 1);
  }
}

const requiredSlots = [...counts.values()].reduce((sum, count) => sum + Math.max(count, minimumAppearances), 0);
const lessonSize = Math.max(10, Math.ceil(requiredSlots / lessons.length), ...lessons.map(lesson => lesson.keys.size));
let cursor = 0;
const add = (lesson, key) => {
  lesson.keys.add(key);
  counts.set(key, counts.get(key) + 1);
};

// Fill the shortest eligible lessons, rotating ties to spread vocabulary through the plan.
for (let pass = 0; pass < minimumAppearances; pass++) {
  for (const key of keys) {
    if (counts.get(key) >= minimumAppearances) continue;
    let selected = -1;
    for (let offset = 0; offset < lessons.length; offset++) {
      const index = (cursor + offset) % lessons.length;
      const lesson = lessons[index];
      if (lesson.keys.size >= lessonSize || lesson.keys.has(key)) continue;
      if (selected === -1 || lesson.keys.size < lessons[selected].keys.size) selected = index;
    }
    if (selected === -1) throw new Error(`Cannot schedule ${key}; revise the plan before publishing.`);
    add(lessons[selected], key);
    cursor = (selected + 1) % lessons.length;
  }
}

// Use the few spare slots for the least-practised entries, never duplicates within a lesson.
for (const lesson of lessons) {
  while (lesson.keys.size < lessonSize) {
    const candidates = keys.filter(key => !lesson.keys.has(key));
    if (!candidates.length) throw new Error('Not enough distinct vocabulary for a lesson.');
    const key = candidates.reduce((best, key) => counts.get(key) < counts.get(best) ? key : best);
    add(lesson, key);
  }
}
if ([...counts.values()].some(count => count < minimumAppearances)) throw new Error('Incomplete vocabulary coverage.');

const plan = {
  version: 1,
  minimumAppearances,
  lessonSize,
  lessons: Object.fromEntries(lessons.map(lesson => [lesson.id, [...lesson.keys]])),
};
const output = new URL('../src/data/curriculum.json', import.meta.url);
const serialized = JSON.stringify(plan, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== serialized) throw new Error('Curriculum is stale; regenerate it after content changes.');
} else writeFileSync(output, serialized);
console.log(`${keys.length} entries, ${lessons.length} lessons × ${lessonSize} words; minimum ${Math.min(...counts.values())} appearances per entry.`);
