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
  seen: string[];
  completed: boolean;
}

export function createSession(random = Math.random, seen: readonly string[] = [], previousId?: string): Session {
  const [first, ...remaining] = createLessonOrder(previousId, random, seen);
  return {
    remaining, visited: first ? [{ lesson: createLesson(first, random), furthest: 0 }] : [],
    lessonIndex: 0, index: 0, seen: [...new Set(seen)], completed: !first,
  };
}

export function nextInSession(session: Session, random = Math.random, seenElsewhere: readonly string[] = []): Session {
  if (session.completed) return session;
  let seen = seenElsewhere.some(text => !session.seen.includes(text))
    ? [...new Set([...session.seen, ...seenElsewhere])] : session.seen;
  if (session.index < LESSON_SIZE) {
    const index = session.index + 1;
    if (index === LESSON_SIZE) {
      const text = session.visited[session.lessonIndex].lesson.example.text;
      if (!seen.includes(text)) seen = [...seen, text];
    }
    // Backtracking changes the position, not the recorded discovery history.
    if (index <= session.visited[session.lessonIndex].furthest) return { ...session, index, seen };
    return {
      ...session, index, seen,
      visited: session.visited.map((entry, i) => i === session.lessonIndex
        ? { ...entry, furthest: index } : entry),
    };
  }
  if (session.lessonIndex + 1 < session.visited.length) {
    return { ...session, seen, lessonIndex: session.lessonIndex + 1, index: 0 };
  }
  const order = session.remaining.filter(example => !seen.includes(example.text));
  if (!order.length) return { ...session, seen, remaining: [], completed: true };
  return {
    remaining: order.slice(1),
    visited: [...session.visited, { lesson: createLesson(order[0], random), furthest: 0 }],
    lessonIndex: session.lessonIndex + 1,
    index: 0,
    seen,
    completed: false,
  };
}

export function previousInSession(session: Session): Session {
  if (session.completed) return session.visited.length ? { ...session, completed: false } : session;
  if (session.index > 0) return { ...session, index: session.index - 1 };
  if (session.lessonIndex > 0) return { ...session, lessonIndex: session.lessonIndex - 1, index: LESSON_SIZE };
  return session;
}

export function revisitWord(session: Session, index: number): Session {
  if (session.completed) return session;
  const { furthest } = session.visited[session.lessonIndex];
  return Number.isInteger(index) && index >= 0 && index < LESSON_SIZE && index <= furthest
    ? { ...session, index } : session;
}
