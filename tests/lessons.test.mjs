import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { allWords, wordKey, formatWordWithArticle } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';
import { createLesson, createLessonOrder, getExampleWord, formPattern, sentenceParts, LESSON_SIZE } from '../src/services/lessons.ts';

const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);

test('each complete sentence has usable vocabulary, accurate surface annotations and a short grammar note', () => {
  assert.equal(new Set(examples.map(e => e.id)).size, examples.length);
  assert.equal(new Set(examples.map(e => e.text)).size, examples.length);
  for (const example of examples) {
    assert.ok(example.words.length >= 3 && example.words.length <= LESSON_SIZE, example.id);
    assert.equal(new Set(example.words.map(wordKey)).size, example.words.length, example.id);
    assert.ok(example.text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length <= 25, example.id);
    assert.match(example.text, /^[A-ZÀ-ÜJ]/u);
    assert.match(example.text, /[.!?]$/u);
    assert.ok(example.note.length > 20, example.id);
    for (const target of example.words) {
      assert.ok(getExampleWord(target), example.id);
      assert.ok(formPattern(target.form).test(example.text), `${example.id}: ${target.form}`);
    }
    const parts = sentenceParts(example);
    assert.equal(parts.map(part => part.text).join(''), example.text, example.id);
    assert.ok(parts.some(part => part.highlighted), example.id);
  }
});

test('every lesson has ten distinct words and includes every word promised in its sentence', () => {
  for (let seed = 0; seed < 100; seed++) {
    for (const example of examples) {
      const lesson = createLesson(example, seeded(seed));
      const keys = lesson.words.map(wordKey);
      assert.equal(keys.length, LESSON_SIZE);
      assert.equal(new Set(keys).size, LESSON_SIZE);
      for (const target of example.words) assert.ok(keys.includes(wordKey(target)));
      assert.equal(lesson.example.text, example.text);
    }
  }
});

test('sentence cycles do not repeat until the whole collection is used, including the cycle boundary', () => {
  const random = seeded(1234);
  let previous;
  for (let i = 0; i < 100; i++) {
    const order = createLessonOrder(previous, random);
    assert.equal(order.length, examples.length);
    assert.equal(new Set(order.map(e => e.id)).size, examples.length);
    assert.notEqual(order[0].id, previous);
    previous = order.at(-1).id;
  }
});

test('all dictionary words remain eligible for the additional discovery words', () => {
  const seen = new Set();
  const random = seeded(901);
  for (let i = 0; i < 4000; i++) {
    for (const word of createLesson(examples[i % examples.length], random).words) seen.add(wordKey(word));
  }
  assert.equal(seen.size, allWords.length);
});

test('dictionary deduplication retains illustrations and all image references exist locally', () => {
  assert.equal(new Set(allWords.map(wordKey)).size, allWords.length);
  assert.equal(allWords.find(w => w.type === 'noun' && w.word === 'chat').image, 'chat.png');
  const illustrated = allWords.filter(w => w.image);
  assert.equal(illustrated.length, 50);
  for (const word of illustrated) assert.ok(existsSync(new URL(`../public/images/${word.image}`, import.meta.url)), word.word);
});

test('noun articles handle vowels, ligatures, mute h and aspirated h', () => {
  const expected = { eau: 'l’eau', œil: 'l’œil', œuvre: 'l’œuvre', homme: 'l’homme', hôtel: 'l’hôtel', héros: 'le héros', main: 'la main', lait: 'le lait' };
  for (const [lemma, display] of Object.entries(expected)) {
    assert.equal(formatWordWithArticle(allWords.find(w => w.type === 'noun' && w.word === lemma)), display);
  }
  assert.equal(formatWordWithArticle({ word: 'aller', type: 'verb' }), 'aller');
});

test('highlighting respects accented word boundaries and inflected forms', () => {
  assert.equal(formPattern('lit').test('qualité'), false);
  assert.equal(formPattern('été').test('répétée'), false);
  assert.equal(formPattern('eau').test('bateau'), false);
  assert.equal(formPattern('œuf').test('l’œuf'), true);
  assert.equal(formPattern('écris').test('J’écris'), true);
  for (const [id, form] of [['vieux', 'vieil'], ['froid', 'froides'], ['orange', 'orange'], ['marron', 'marron'], ['secret', 'oubliés']]) {
    const parts = sentenceParts(examples.find(e => e.id === id));
    assert.ok(parts.some(part => part.highlighted && part.text === form));
  }
});
