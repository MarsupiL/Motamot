import test from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../src/data/sentences.ts';
import { LESSON_SIZE } from '../src/services/lessons.ts';
import { createSession, nextInSession, previousInSession, revisitWord } from '../src/services/session.ts';
import { createNavigationGesture } from '../src/services/gestures.ts';

const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const advance = (session, count, random) => {
  for (let i = 0; i < count; i++) session = nextInSession(session, random);
  return session;
};

test('back stops at the first word and navigates through words, sentences and previous lessons', () => {
  const random = seeded(7);
  let session = createSession(random);
  const firstLesson = session.visited[0].lesson;
  assert.equal(previousInSession(session), session);
  session = advance(session, LESSON_SIZE, random);
  assert.equal(session.index, LESSON_SIZE);
  assert.equal(previousInSession(session).index, LESSON_SIZE - 1);
  session = nextInSession(session, random);
  const secondLesson = session.visited[1].lesson;
  assert.equal(session.index, 0);
  assert.equal(session.lessonIndex, 1);
  session = previousInSession(session);
  assert.equal(session.index, LESSON_SIZE);
  assert.equal(session.lessonIndex, 0);
  assert.equal(session.visited[0].lesson, firstLesson);
  session = nextInSession(session, random);
  assert.equal(session.visited[1].lesson, secondLesson);
  assert.equal(session.visited.length, 2);
});

test('revisiting a word preserves discovery progress and rejects unseen or invalid word indices', () => {
  const random = seeded(9);
  const session = advance(createSession(random), 5, random);
  for (const index of [-1, 6, LESSON_SIZE, 1.5, NaN]) assert.equal(revisitWord(session, index), session);
  const revisited = revisitWord(session, 1);
  assert.equal(revisited.index, 1);
  assert.equal(revisited.visited[0].furthest, 5);
  const next = nextInSession(revisited, random);
  assert.equal(next.index, 2);
  assert.equal(next.visited[0].furthest, 5);
  assert.equal(next.visited, session.visited);
  assert.equal(session.index, 5);
});

test('backtracking preserves lesson order, and finishing the collection never starts an automatic repeat', () => {
  const random = seeded(12);
  let session = advance(createSession(random), examples.length * (LESSON_SIZE + 1), random);
  const visited = session.visited;
  const remaining = session.remaining;
  const ids = visited.map(entry => entry.lesson.example.id);
  assert.equal(new Set(ids.slice(0, examples.length)).size, examples.length);
  assert.equal(session.completed, true);
  assert.equal(session.seen.length, examples.length);
  assert.equal(nextInSession(session, random), session);
  session = previousInSession(session);
  assert.equal(session.completed, false);
  const steps = 2 * (LESSON_SIZE + 1);
  for (let i = 0; i < steps; i++) session = previousInSession(session);
  session = advance(session, steps, random);
  assert.equal(session.index, LESSON_SIZE);
  assert.equal(session.lessonIndex, examples.length - 1);
  assert.equal(session.remaining, remaining);
  assert.deepEqual(session.visited.map(entry => entry.lesson), visited.map(entry => entry.lesson));
});

const point = (clientX, clientY = 100, timeStamp = 0, pointerId = 1) => ({ pointerId, clientX, clientY, timeStamp });
const bounds = { left: 20, width: 300 };

test('taps navigate by the half of the content area, and swipes follow reading direction exactly once', () => {
  const gesture = createNavigationGesture();
  gesture.start(point(60));
  assert.equal(gesture.end(point(63, 103, 120), bounds), 'previous');
  gesture.start(point(260));
  assert.equal(gesture.end(point(260, 100, 120), bounds), 'next');
  gesture.start(point(260));
  assert.equal(gesture.end(point(100, 110, 400), bounds), 'next');
  assert.equal(gesture.end(point(100, 110, 400), bounds), undefined);
  gesture.start(point(70));
  assert.equal(gesture.end(point(250, 90, 500), bounds), 'previous');
});

test('vertical scrolling, diagonal drags, long presses and out-and-back motions do not turn the page', () => {
  const gesture = createNavigationGesture();
  gesture.start(point(260));
  gesture.move(point(260, 180, 120));
  assert.equal(gesture.end(point(260, 100, 240), bounds), undefined);
  gesture.start(point(260));
  assert.equal(gesture.end(point(200, 145, 250), bounds), undefined);
  gesture.start(point(260));
  assert.equal(gesture.end(point(240, 100, 150), bounds), undefined);
  gesture.start(point(260));
  assert.equal(gesture.end(point(260, 100, 800), bounds), undefined);
  gesture.start(point(260));
  gesture.move(point(100, 100, 120));
  assert.equal(gesture.end(point(260, 100, 240), bounds), undefined);
});

test('cancelling for a pinch, a control or a browser interruption prevents later navigation', () => {
  const gesture = createNavigationGesture();
  gesture.start(point(260));
  gesture.cancel();
  assert.equal(gesture.end(point(100, 100, 200), bounds), undefined);
  gesture.start(point(260));
  assert.equal(gesture.end(point(100, 100, 200, 2), bounds), undefined);
});

test('gestures snapshot coordinates without copying unrelated event properties', () => {
  const gesture = createNavigationGesture();
  const event = Object.create(point(260));
  Object.defineProperty(event, 'target', {
    enumerable: true,
    get() { throw new Error('The gesture must not copy the DOM target'); },
  });
  gesture.start(event);
  event.clientX = 60;
  assert.equal(gesture.end(point(260, 100, 120), bounds), 'next');
});
