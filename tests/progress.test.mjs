import test from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../src/data/sentences.ts';
import { createLessonOrder, LESSON_SIZE } from '../src/services/lessons.ts';
import { createSession, nextInSession, previousInSession, revisitWord } from '../src/services/session.ts';
import { clearSeen, PROGRESS_KEY, readSeen, saveSeen } from '../src/services/progress.ts';

const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const storage = () => {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
};
const reachSentence = (session, random) => {
  for (let i = 0; i < LESSON_SIZE; i++) session = nextInSession(session, random);
  return session;
};

test('leaving during the vocabulary does not mark an unread sentence as seen', () => {
  const random = seeded(10);
  const original = createSession(random);
  let session = original;
  for (let i = 0; i < LESSON_SIZE - 1; i++) session = nextInSession(session, random);
  assert.equal(session.seen, original.seen);
  assert.deepEqual(session.seen, []);
  session = nextInSession(session, random);
  assert.deepEqual(original.seen, []);
  assert.deepEqual(session.seen, [original.visited[0].lesson.example.text]);
  session = nextInSession(previousInSession(session), random);
  assert.equal(session.seen.length, 1);
});

test('360 separate visits never repeat a seen sentence and the final visit is complete', () => {
  const saved = storage();
  const random = seeded(123);
  const encountered = new Set();
  for (let i = 0; i < examples.length; i++) {
    let session = createSession(random, readSeen(saved));
    assert.equal(session.completed, false);
    const text = session.visited[0].lesson.example.text;
    assert.equal(encountered.has(text), false, text);
    encountered.add(text);
    session = reachSentence(session, random);
    assert.equal(saveSeen(saved, session.seen), true);
  }
  assert.equal(encountered.size, 360);
  const complete = createSession(random, readSeen(saved));
  assert.equal(complete.completed, true);
  assert.equal(complete.visited.length, 0);
  assert.equal(nextInSession(complete), complete);
  assert.equal(previousInSession(complete), complete);
  assert.equal(revisitWord(complete, 0), complete);
});

test('review starts a new collection only after an explicit history reset', () => {
  const saved = storage();
  saveSeen(saved, examples.map(example => example.text));
  assert.equal(createSession(Math.random, readSeen(saved)).completed, true);
  assert.equal(clearSeen(saved), true);
  const restarted = createSession(seeded(5), readSeen(saved), examples[0].id);
  assert.equal(restarted.completed, false);
  assert.deepEqual(restarted.seen, []);
  assert.notEqual(restarted.visited[0].lesson.example.id, examples[0].id);
});

test('malformed, outdated and unavailable storage cannot prevent learning', () => {
  const saved = storage();
  for (const bad of ['{broken', 'null', '[]', '{"version":2,"seen":[]}']) {
    saved.setItem(PROGRESS_KEY, bad);
    assert.deepEqual(readSeen(saved), []);
  }
  const text = examples[0].text;
  saved.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, seen: [text, text, null, 42, 'A removed sentence.'] }));
  assert.deepEqual(readSeen(saved), [text]);
  const blocked = {
    getItem() { throw new Error('Storage disabled'); },
    setItem() { throw new Error('Quota exceeded'); },
    removeItem() { throw new Error('Storage disabled'); },
  };
  assert.deepEqual(readSeen(blocked), []);
  assert.equal(saveSeen(blocked, [text]), false);
  assert.equal(clearSeen(blocked), false);
  assert.equal(saveSeen(undefined, [text]), false);
  assert.equal(createSession(seeded(1), readSeen(blocked)).completed, false);
});

test('stale progress writers merge discoveries, and newly selected lessons skip them', () => {
  const saved = storage();
  saveSeen(saved, [examples[0].text]);
  saveSeen(saved, [examples[1].text]);
  assert.deepEqual(readSeen(saved), [examples[0].text, examples[1].text]);
  const random = seeded(19);
  let session = reachSentence(createSession(random), random);
  const nextText = session.remaining[0].text;
  session = nextInSession(session, random, [nextText]);
  assert.notEqual(session.visited[1].lesson.example.text, nextText);
  assert.ok(session.seen.includes(nextText));
});

test('unseen topics alternate whenever another topic remains available', () => {
  assert.equal(new Set(examples.map(example => example.topic)).size, 12);
  assert.equal(examples.filter(example => /mon frère/i.test(example.text)).length, 0);
  for (let seed = 0; seed < 30; seed++) {
    const order = createLessonOrder(undefined, seeded(seed), examples.slice(0, 20).map(e => e.text));
    assert.equal(order.length, examples.length - 20);
    assert.notEqual(order[0].topic, examples[19].topic);
    for (let i = 1; i < order.length; i++) {
      if (order[i].topic === order[i - 1].topic) {
        assert.ok(order.slice(i).every(e => e.topic === order[i].topic));
      }
    }
  }
});
