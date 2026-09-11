import test from 'node:test';
import assert from 'node:assert/strict';
import { allWords, wordKey } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';
import translations from '../src/data/englishTranslations.json' with { type: 'json' };
import { translateSentence, translateWord } from '../src/services/translations.ts';

test('every vocabulary entry has a concise English gloss, with no missing or stale entries', () => {
  assert.deepEqual(Object.keys(translations.words).sort(), allWords.map(wordKey).sort());
  for (const word of allWords) {
    const english = translateWord(word);
    assert.equal(typeof english, 'string', wordKey(word));
    assert.equal(english, english.trim(), wordKey(word));
    assert.ok(english.length > 0 && english.length <= 70, wordKey(word));
    assert.doesNotMatch(english, /[<>\n]|TODO|translation missing/i, wordKey(word));
  }
});

test('each complete French sentence has an English translation tied to its exact text', () => {
  assert.deepEqual(Object.keys(translations.sentences).sort(), examples.map(e => e.text).sort());
  for (const example of examples) {
    const english = translateSentence(example.text);
    assert.equal(typeof english, 'string', example.id);
    assert.ok(english.length > 10 && english.length <= 250, example.id);
    assert.notEqual(english, example.text, example.id);
    assert.equal(english, english.trim(), example.id);
    assert.doesNotMatch(english, /[<>\n]|TODO|translation missing/i, example.id);
    assert.match(english, /[.!?]$/u, example.id);
  }
  assert.equal(translateSentence('A newly edited French sentence.'), undefined);
  assert.equal(translateSentence('constructor'), undefined);
});

test('English meanings distinguish parts of speech and common false friends', () => {
  const meanings = [
    ['noun', 'pouvoir', 'power'],
    ['verb', 'pouvoir', 'to be able to'],
    ['noun', 'mort', 'death'],
    ['adjective', 'mort', 'dead'],
    ['noun', 'librairie', 'bookshop'],
    ['noun', 'lecture', 'reading'],
    ['verb', 'attendre', 'to wait for'],
    ['adjective', 'actuel', 'current / present-day'],
    ['adverb', 'définitivement', 'permanently / for good'],
  ];
  for (const [type, word, english] of meanings) assert.equal(translateWord({ type, word }), english);
  assert.equal(translateWord({ type: 'noun', word: 'constructor' }), undefined);
});
