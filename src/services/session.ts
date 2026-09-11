import { createLesson, createLessonOrder, LESSON_SIZE } from './lessons.ts';
import type { Lesson, SentenceExample } from '../types';

interface VisitedLesson {
  lesson: Lesson;
  furthest: number;
}

export interface Session {
  remaining: SentenceExample[];
  visited: VisitedLesson[];
  lessonIndex: number;
  index: number;
}

export function createSession(random = Math.random): Session {
  const [first, ...remaining] = createLessonOrder(undefined, random);
  return { remaining, visited: [{ lesson: createLesson(first, random), furthest: 0 }], lessonIndex: 0, index: 0 };
}

export function nextInSession(session: Session, random = Math.random): Session {
  if (session.index < LESSON_SIZE) {
    const index = session.index + 1;
    // Backtracking changes the position, not the recorded discovery history.
    if (index <= session.visited[session.lessonIndex].furthest) return { ...session, index };
    return {
      ...session, index,
      visited: session.visited.map((entry, i) => i === session.lessonIndex
        ? { ...entry, furthest: index } : entry),
    };
  }
  if (session.lessonIndex + 1 < session.visited.length) {
    return { ...session, lessonIndex: session.lessonIndex + 1, index: 0 };
  }
  const order = session.remaining.length ? session.remaining
    : createLessonOrder(session.visited[session.lessonIndex].lesson.example.id, random);
  return {
    remaining: order.slice(1),
    visited: [...session.visited, { lesson: createLesson(order[0], random), furthest: 0 }],
    lessonIndex: session.lessonIndex + 1,
    index: 0,
  };
}

export function previousInSession(session: Session): Session {
  if (session.index > 0) return { ...session, index: session.index - 1 };
  if (session.lessonIndex > 0) return { ...session, lessonIndex: session.lessonIndex - 1, index: LESSON_SIZE };
  return session;
}

export function revisitWord(session: Session, index: number): Session {
  const { furthest } = session.visited[session.lessonIndex];
  return Number.isInteger(index) && index >= 0 && index < LESSON_SIZE && index <= furthest
    ? { ...session, index } : session;
}
