import { examples } from '../data/sentences.ts';

export const PROGRESS_KEY = 'motamot:seen-sentences:v1';
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const available = new Set(examples.map(example => example.text));

// Exact text makes a genuinely rewritten scene available again after an update.
const validTexts = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((text): text is string => typeof text === 'string' && available.has(text)))]
  : [];

export function browserStorage(): ProgressStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

export function readSeen(storage?: ProgressStorage): string[] {
  try {
    const saved = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? 'null');
    return saved?.version === 1 ? validTexts(saved.seen) : [];
  } catch { return []; }
}

export function saveSeen(storage: ProgressStorage | undefined, seen: readonly string[]): boolean {
  if (!storage) return false;
  try {
    // Merge a fresh read so another tab's completed lessons are not overwritten.
    const merged = validTexts([...readSeen(storage), ...seen]);
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, seen: merged }));
    return true;
  } catch { return false; }
}

export function clearSeen(storage?: ProgressStorage): boolean {
  if (!storage) return false;
  try { storage.removeItem(PROGRESS_KEY); return true; }
  catch { return false; }
}
