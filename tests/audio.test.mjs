import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { allWords, formatWordWithArticle } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';
import recordings from '../src/data/pronunciations.json' with { type: 'json' };
import { recordingFor } from '../src/services/recordings.ts';
import { createPronunciationPlayer } from '../src/services/speech.ts';

test('every displayed word and sentence has its own local MP3, without stale text or missing assets', () => {
  const texts = [...new Set([...allWords.map(formatWordWithArticle), ...examples.map(e => e.text)])].sort();
  assert.deepEqual(Object.keys(recordings).sort(), texts);
  assert.equal(new Set(Object.values(recordings)).size, texts.length);
  const directory = new URL('../public/audio/', import.meta.url);
  assert.deepEqual(readdirSync(directory).filter(name => name.endsWith('.mp3')).sort(), Object.values(recordings).sort());
  for (const text of texts) {
    const filename = recordings[text];
    assert.match(filename, /^[a-f0-9]{24}\.mp3$/);
    const data = readFileSync(new URL(filename, directory));
    assert.ok(data.length > 2000 && data.length < 300000, text);
    assert.equal(data[0], 0xff, text);
    assert.equal(data[1] & 0xe0, 0xe0, text);
    assert.equal(recordingFor(text, './'), `./audio/${filename}`);
    assert.equal(recordingFor(text, '/Motamot/'), `/Motamot/audio/${filename}`);
  }
  assert.equal(recordingFor('A newly edited sentence.', './'), undefined);
  assert.equal(recordingFor('constructor', './'), undefined);
});

function setup() {
  const elements = [];
  const states = [];
  const player = createPronunciationPlayer(() => {
    const { promise, resolve, reject } = Promise.withResolvers();
    const element = {
      paused: false,
      play() { return promise; },
      pause() { this.paused = true; this.onpause?.(); },
      removeAttribute(name) { delete this[name]; },
      load() {},
      resolve, reject,
    };
    elements.push(element);
    return element;
  }, state => states.push(state));
  return { player, elements, states };
}

test('stopping a loading recording releases it and ignores late playback and network errors', async () => {
  const { player, elements, states } = setup();
  player.play('./audio/word.mp3', false);
  const previous = elements[0];
  const latePlaying = previous.onplaying;
  player.stop();
  previous.reject(new Error('aborted request'));
  latePlaying();
  await Promise.resolve();
  assert.deepEqual(states, ['loading', 'idle']);
  assert.equal(previous.paused, true);
  assert.equal(previous.src, undefined);
});

test('switching words cancels the previous voice; slow mode retains pitch and stale events cannot stop the new word', async () => {
  const { player, elements, states } = setup();
  player.play('first.mp3', false);
  const first = elements[0];
  const lateEnd = first.onended;
  assert.equal(first.playbackRate, 1);
  player.play('second.mp3', true);
  const second = elements[1];
  second.onplaying();
  lateEnd();
  first.reject(new Error('interrupted'));
  await Promise.resolve();
  assert.equal(states.at(-1), 'playing');
  assert.equal(first.paused, true);
  assert.equal(second.paused, false);
  assert.equal(second.src, 'second.mp3');
  assert.equal(second.playbackRate, 0.8);
  assert.equal(second.preservesPitch, true);
  second.onended();
  assert.equal(states.at(-1), 'idle');
  assert.equal(second.paused, true);
});

test('a failed play can be retried, and disposal ignores later callbacks', async () => {
  const { player, elements, states } = setup();
  player.play('word.mp3', false);
  elements[0].reject(new Error('playback blocked'));
  await Promise.resolve();
  assert.equal(states.at(-1), 'error');
  player.play('word.mp3', false);
  elements[1].onplaying();
  assert.equal(states.at(-1), 'playing');
  const lateError = elements[1].onerror;
  player.dispose();
  const before = [...states];
  lateError();
  assert.deepEqual(states, before);
  assert.equal(elements[1].paused, true);
});
