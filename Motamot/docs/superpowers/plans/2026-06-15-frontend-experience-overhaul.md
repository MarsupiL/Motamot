# Motamot Frontend Experience Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the live-Groq, key-gated, 10-random-words flow with an offline-first, zero-setup sentence-first reveal that consumes a committed validated sentence bank, renders chalk write-on animation that never breaks words across lines, plays pre-generated French audio, and tracks per-lemma spaced repetition — all in a polished blackboard PWA.

**Architecture:** A pure `bank` selection service draws unseen sentence IDs from a shuffled bag in localStorage, biased toward the most-due lemmas from a pure `srs` (Leitner) service that also gates CEFR levels. A rewritten `useGameLoop` reducer selects a `BankSentence`, derives its ordered content tokens, advances on tap, then reveals the full sentence and exposes its audio filename. Presentation uses `motion` via `LazyMotion`+`domAnimation`+`m`, with each whole word wrapped in a non-breaking `inline-block` span and all animation gated behind `useReducedMotion` plus a CSS backstop. Images and font are bundled locally; audio resolves through `services/audio.ts` (owned by the audio plan).

**Tech Stack:** React 18.3, Vite 6, TypeScript 5.7 (strict, noUnusedLocals/Params), Tailwind CSS 3.4, vite-plugin-pwa 1.2, `motion` (LazyMotion + `m`), Vitest + @testing-library/react + jsdom for tests. pnpm. Build base `/Motamot/`.

---

## Conventions for every task in this plan

- **Working directory for pnpm/node/tsc:** `Motamot/motamot-app` (the app subdir of the umbrella git root `/Users/mathias.bonnet/Zivver`). All `pnpm`/`npx` commands below assume you `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app` first within a single compound command (do not leave a stray `cd` that triggers a permission prompt — chain with `&&`).
- **Committing:** the IDE polls `git status` on the huge umbrella repo and frequently holds `.git/index.lock`. NEVER run `git add -A` from the root. Stage only the exact files listed in each task with explicit paths relative to the git root (e.g. `Motamot/motamot-app/src/...`). If a commit fails with `index.lock` contention, wait 2s and retry the same `git add`/`git commit` up to 3 times. The post-checkout/post-commit hooks warn about missing git-lfs; that warning is harmless — ignore it.
- **After EVERY task:** run `pnpm exec tsc --noEmit` and `pnpm lint` from the app dir; both must exit 0 before you commit. (If `pnpm lint` fails because no `eslint.config.js` is checked in yet — see git status — that is a pre-existing environment gap, not introduced by this plan; note it and continue, but never let `tsc --noEmit` regress.)
- **Dependency on sibling plans:** This plan assumes `Motamot/motamot-app/src/data/sentenceBank.json` and `Motamot/motamot-app/src/types/bank.ts` already exist (produced by the bank-pipeline plan) and that `Motamot/motamot-app/src/services/audio.ts` exporting `getAudioUrl(filename: string): string` is provided by the audio plan. Where those are not yet present, the relevant task says exactly what minimal stub to create and which plan owns the real one.
- **Test fixture:** tasks that test bank-consuming logic import a small in-repo fixture, NOT the real bank, so tests stay deterministic and fast.

---

### Task 1: Add Vitest + @testing-library/react + jsdom test harness

The repo has no test framework. The bank-pipeline plan may have already added Vitest + a `test` script; make this task idempotent — only add what is missing and additionally ensure the React/jsdom testing deps and the jsdom environment exist.

**Files:**
- Modify: `Motamot/motamot-app/package.json`
- Create: `Motamot/motamot-app/vitest.config.ts`
- Create: `Motamot/motamot-app/src/test/setup.ts`
- Create: `Motamot/motamot-app/src/test/smoke.test.ts`

Steps:

- [ ] Check whether Vitest is already installed: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && cat package.json | grep -E '"(vitest|@testing-library/react|jsdom)"' || echo "MISSING"`. If all three already appear, skip the install command below but still create the config/setup files if absent.
- [ ] Install the testing deps (idempotent — pnpm no-ops if already present): `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm add -D vitest@^3.0.0 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.0 @testing-library/user-event@^14.5.0 jsdom@^25.0.0`
- [ ] Add the `test` script if missing. Edit `package.json` `scripts` block to include (alongside the existing dev/build/lint/preview/evaluate):
  ```json
    "test": "vitest run",
    "test:watch": "vitest",
  ```
- [ ] Create `Motamot/motamot-app/vitest.config.ts` with FULL content:
  ```ts
  /// <reference types="vitest/config" />
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  })
  ```
- [ ] Create `Motamot/motamot-app/src/test/setup.ts` with FULL content:
  ```ts
  import '@testing-library/jest-dom/vitest'
  import { afterEach } from 'vitest'
  import { cleanup } from '@testing-library/react'

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })
  ```
- [ ] Write a failing smoke test `Motamot/motamot-app/src/test/smoke.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'

  describe('test harness', () => {
    it('runs and has jsdom + localStorage', () => {
      localStorage.setItem('k', 'v')
      expect(localStorage.getItem('k')).toBe('v')
      expect(typeof document).toBe('object')
    })
  })
  ```
- [ ] Run it: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test`. Expected: 1 passed (the harness now works). If it errors that `vitest/config` types are missing, ensure `vitest` installed correctly, then re-run.
- [ ] Ensure `pnpm exec tsc --noEmit` stays clean (vitest.config.ts is excluded by `tsconfig.json` `include: ["src"]`, so it is not type-checked by the app build — acceptable).
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/package.json Motamot/motamot-app/pnpm-lock.yaml Motamot/motamot-app/vitest.config.ts Motamot/motamot-app/src/test/setup.ts Motamot/motamot-app/src/test/smoke.test.ts && git commit -m "test: add Vitest + Testing Library + jsdom harness

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 2: Add the shared bank/audio test fixture

A small deterministic `SentenceBank` fixture and a minimal `getAudioUrl` reference, so later tasks never import the real (large, regenerated) bank. Import the real types from `src/types/bank.ts` (bank-pipeline plan owns it). If `src/types/bank.ts` does not yet exist when you reach this task, create it from the SHARED DATA CONTRACT exactly (interfaces `SentenceBank`, `BankSentence`, `BankToken`) and add a one-line comment `// Canonical owner: bank-pipeline plan; created here as a fallback.` — the bank-pipeline plan's version must match field-for-field.

**Files:**
- Create (fallback only): `Motamot/motamot-app/src/types/bank.ts`
- Create: `Motamot/motamot-app/src/test/fixtures/bank.ts`
- Create: `Motamot/motamot-app/src/test/fixtures/bank.test.ts`

Steps:

- [ ] Verify whether the canonical types exist: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && test -f src/types/bank.ts && echo EXISTS || echo MISSING`. If MISSING, create `src/types/bank.ts` with FULL content (matching the contract exactly):
  ```ts
  // Canonical owner: bank-pipeline plan; created here as a fallback if absent.
  export interface SentenceBank {
    schemaVersion: number
    generatorModel: string
    generatorVersion: string
    validatorModel: string
    validatorVersion: string
    generatedAt: string
    sentences: BankSentence[]
  }

  export interface BankSentence {
    id: string
    text: string
    level: 'A1' | 'A2' | 'B1'
    anchors: string[]
    theme: string
    humorMechanism: string
    audio: string | null
    tokens: BankToken[]
    validation: {
      grammar: boolean
      semantics: boolean
      frenchOnly: boolean
      simplicity: boolean
      humor: boolean
      safety: boolean
    }
  }

  export interface BankToken {
    surface: string
    lemma: string
    type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'function'
    gender: 'm' | 'f' | null
    image: string | null
    en: string | null
    start: number
    end: number
    isContent: boolean
    isTarget: boolean
  }
  ```
- [ ] Create `Motamot/motamot-app/src/test/fixtures/bank.ts`. Char offsets must satisfy `text.slice(start,end) === surface`. FULL content:
  ```ts
  import type { SentenceBank } from '../../types/bank'

  // text: "Le chat mange une pomme rouge."
  //        0123456789...
  export const fixtureBank: SentenceBank = {
    schemaVersion: 1,
    generatorModel: 'claude-opus-4-8',
    generatorVersion: 'fixture',
    validatorModel: 'claude-sonnet-4-6',
    validatorVersion: 'fixture',
    generatedAt: '2026-06-15T00:00:00.000Z',
    sentences: [
      {
        id: 's-cat-apple',
        text: 'Le chat mange une pomme rouge.',
        level: 'A1',
        anchors: ['chat', 'pomme'],
        theme: 'animals',
        humorMechanism: 'absurd-snack',
        audio: 'sentence-s-cat-apple.mp3',
        tokens: [
          { surface: 'Le', lemma: 'le', type: 'function', gender: null, image: null, en: null, start: 0, end: 2, isContent: false, isTarget: false },
          { surface: 'chat', lemma: 'chat', type: 'noun', gender: 'm', image: 'chat.png', en: 'cat', start: 3, end: 7, isContent: true, isTarget: true },
          { surface: 'mange', lemma: 'manger', type: 'verb', gender: null, image: null, en: 'to eat', start: 8, end: 13, isContent: true, isTarget: true },
          { surface: 'une', lemma: 'une', type: 'function', gender: null, image: null, en: null, start: 14, end: 17, isContent: false, isTarget: false },
          { surface: 'pomme', lemma: 'pomme', type: 'noun', gender: 'f', image: 'pomme.png', en: 'apple', start: 18, end: 23, isContent: true, isTarget: true },
          { surface: 'rouge', lemma: 'rouge', type: 'adjective', gender: null, image: null, en: 'red', start: 24, end: 29, isContent: true, isTarget: true },
        ],
        validation: { grammar: true, semantics: true, frenchOnly: true, simplicity: true, humor: true, safety: true },
      },
      {
        id: 's-dog-star',
        text: 'Le chien regarde une étoile.',
        level: 'A2',
        anchors: ['chien', 'étoile'],
        theme: 'sky',
        humorMechanism: 'wistful-dog',
        audio: null,
        tokens: [
          { surface: 'Le', lemma: 'le', type: 'function', gender: null, image: null, en: null, start: 0, end: 2, isContent: false, isTarget: false },
          { surface: 'chien', lemma: 'chien', type: 'noun', gender: 'm', image: 'chien.png', en: 'dog', start: 3, end: 8, isContent: true, isTarget: true },
          { surface: 'regarde', lemma: 'regarder', type: 'verb', gender: null, image: null, en: 'to watch', start: 9, end: 16, isContent: true, isTarget: true },
          { surface: 'une', lemma: 'une', type: 'function', gender: null, image: null, en: null, start: 17, end: 20, isContent: false, isTarget: false },
          { surface: 'étoile', lemma: 'étoile', type: 'noun', gender: 'f', image: 'etoile.png', en: 'star', start: 21, end: 27, isContent: true, isTarget: true },
        ],
        validation: { grammar: true, semantics: true, frenchOnly: true, simplicity: true, humor: true, safety: true },
      },
      {
        id: 's-bird-tree',
        text: "L'oiseau chante.",
        level: 'B1',
        anchors: ['oiseau'],
        theme: 'nature',
        humorMechanism: 'opera-bird',
        audio: 'sentence-s-bird-tree.mp3',
        tokens: [
          { surface: "L'", lemma: 'le', type: 'function', gender: null, image: null, en: null, start: 0, end: 2, isContent: false, isTarget: false },
          { surface: 'oiseau', lemma: 'oiseau', type: 'noun', gender: 'm', image: 'oiseau.png', en: 'bird', start: 2, end: 8, isContent: true, isTarget: true },
          { surface: 'chante', lemma: 'chanter', type: 'verb', gender: null, image: null, en: 'to sing', start: 9, end: 15, isContent: true, isTarget: true },
        ],
        validation: { grammar: true, semantics: true, frenchOnly: true, simplicity: true, humor: true, safety: true },
      },
    ],
  }
  ```
- [ ] Write a fixture self-check test `Motamot/motamot-app/src/test/fixtures/bank.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { fixtureBank } from './bank'

  describe('fixtureBank integrity', () => {
    it('every token surface matches text.slice(start,end)', () => {
      for (const s of fixtureBank.sentences) {
        for (const t of s.tokens) {
          expect(s.text.slice(t.start, t.end)).toBe(t.surface)
        }
      }
    })
    it('has at least one sentence with null audio for hide-control tests', () => {
      expect(fixtureBank.sentences.some((s) => s.audio === null)).toBe(true)
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/test/fixtures/bank.test.ts`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/types/bank.ts Motamot/motamot-app/src/test/fixtures/bank.ts Motamot/motamot-app/src/test/fixtures/bank.test.ts && git commit -m "test: add SentenceBank fixture and integrity check

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 3: Delete the Groq/Settings/API-key path

Remove the entire live-LLM surface so nothing imports it before the rewrite tasks. We delete files and the obsolete types, and trim `App.tsx`/`useGameLoop.ts` just enough to keep the build compiling at each step. `useGameLoop` will be fully rewritten in Task 8; here we only sever its Groq/Settings imports with a temporary inert body so `tsc` passes between commits.

**Files:**
- Delete: `Motamot/motamot-app/src/services/api.ts`
- Delete: `Motamot/motamot-app/src/components/Settings.tsx`
- Modify: `Motamot/motamot-app/src/types/index.ts`
- Modify: `Motamot/motamot-app/src/App.tsx`
- Modify: `Motamot/motamot-app/src/hooks/useGameLoop.ts`

Steps:

- [ ] Delete the Groq service and Settings component: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && git rm src/services/api.ts src/components/Settings.tsx`
- [ ] Edit `src/types/index.ts` — remove the three Groq interfaces (`GroqMessage`, `GroqChoice`, `GroqResponse`), leaving the file as exactly:
  ```ts
  export type Gender = 'm' | 'f';

  export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb';

  export interface NounData {
    word: string;
    gender: Gender;
    image?: string;
  }

  export interface Word {
    word: string;
    type: WordType;
    gender?: Gender;
    image?: string;
  }
  ```
- [ ] Replace `src/hooks/useGameLoop.ts` with a temporary inert stub (full rewrite lands in Task 8) so nothing imports Groq/Settings:
  ```ts
  import { useState, useCallback } from 'react';

  // TEMPORARY inert stub — fully rewritten in Task 8 to consume the sentence bank.
  export function useGameLoop() {
    const [tick, setTick] = useState(0);
    const advance = useCallback(() => setTick((t) => t + 1), []);
    return { tick, advance };
  }
  ```
- [ ] Replace `src/App.tsx` with a temporary minimal composition (full rewrite in Task 14) that drops the gear button, `showSettings`, and `getStoredApiKey`:
  ```tsx
  import { useGameLoop } from './hooks/useGameLoop';
  import './index.css';

  function App() {
    const game = useGameLoop();

    return (
      <div
        className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blackboard-dark via-blackboard to-blackboard-light cursor-pointer select-none relative font-sans"
        onClick={game.advance}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTEiPjwvcmVjdD4KPC9zdmc+')]" />
        <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-blackboard-border rounded-sm shadow-inner pointer-events-none" />
        <span className="text-chalk z-10 font-cursive text-3xl">Motamot</span>
      </div>
    );
  }

  export default App;
  ```
- [ ] Confirm nothing else references the deleted symbols: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && grep -rn "services/api\|components/Settings\|getStoredApiKey\|GroqResponse\|GroqMessage\|GroqChoice\|generateSentence" src/ || echo "CLEAN"`. Expected: `CLEAN`.
- [ ] `pnpm exec tsc --noEmit` clean (note: `useImagePreloader.ts` and `WordImage.tsx`/`GameBoard.tsx`/`ProgressDots.tsx` are now unused by App but still type-check; they are reworked in later tasks).
- [ ] `pnpm test` still passes (smoke + fixture).
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/services/api.ts Motamot/motamot-app/src/components/Settings.tsx Motamot/motamot-app/src/types/index.ts Motamot/motamot-app/src/hooks/useGameLoop.ts Motamot/motamot-app/src/App.tsx && git commit -m "feat: remove Groq/Settings/API-key path

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 4: Bundle the 50 local PNGs and repoint getImageUrl offline

Copy the existing `generated-images/*.png` into `public/word-images/`, replace `services/supabase.ts` with a local image resolver (no Supabase client for images), and add `json` to the Workbox glob so the bundled bank is precached.

**Files:**
- Create: `Motamot/motamot-app/public/word-images/*.png` (50 files, copied)
- Modify: `Motamot/motamot-app/src/services/supabase.ts`
- Modify: `Motamot/motamot-app/vite.config.ts`
- Create: `Motamot/motamot-app/src/services/images.test.ts`

Steps:

- [ ] Copy the images: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && mkdir -p public/word-images && cp generated-images/*.png public/word-images/ && ls public/word-images | wc -l`. Expected output: `50`.
- [ ] Write a failing test for the new resolver `Motamot/motamot-app/src/services/images.test.ts` (it imports `getImageUrl` from `supabase` — which still uses Supabase, so this asserts the NEW local behavior and fails first):
  ```ts
  import { describe, it, expect } from 'vitest'
  import { getImageUrl } from './supabase'

  describe('getImageUrl (local)', () => {
    it('returns a BASE_URL-relative path under word-images/', () => {
      const url = getImageUrl('chat.png')
      expect(url).toBe('/word-images/chat.png')
    })
  })
  ```
  > Note: under Vitest, `import.meta.env.BASE_URL` defaults to `'/'`. In production builds Vite injects `/Motamot/`, so runtime URLs become `/Motamot/word-images/chat.png` automatically.
- [ ] Run it: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/images.test.ts`. Expected: FAIL (current `getImageUrl` returns a Supabase URL).
- [ ] Replace `src/services/supabase.ts` ENTIRELY with the local resolver (remove `createClient`, the Supabase URL/key, the `supabase` export, and the `images` bucket — keep only the image helpers the app needs). Rename of the file is unnecessary; keep the path so other imports stay valid until they are updated in Task 5.
  ```ts
  /**
   * Resolve a bundled word image to its served URL.
   * Images live in public/word-images/ and are precached by the service worker.
   */
  export const getImageUrl = (imageName: string): string => {
    return `${import.meta.env.BASE_URL}word-images/${imageName}`;
  };

  /** Preload one image; resolves on load, rejects on error. */
  export const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  /** Preload multiple images, swallowing individual failures. */
  export const preloadImages = async (urls: string[]): Promise<void> => {
    await Promise.allSettled(urls.map(preloadImage));
  };
  ```
- [ ] Run the test again: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/images.test.ts`. Expected: PASS.
- [ ] Add `json` to the Workbox glob in `vite.config.ts`. Change:
  ```ts
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  ```
  to:
  ```ts
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
  ```
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Verify the production build precaches images + (eventually) the bank without error: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm build` (expect success; the generated `dist/sw.js` precache manifest should reference `word-images/*.png`).
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/public/word-images Motamot/motamot-app/src/services/supabase.ts Motamot/motamot-app/vite.config.ts Motamot/motamot-app/src/services/images.test.ts && git commit -m "feat: bundle word images locally and precache JSON

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 5: WordImage — local images, never show a placeholder

Update `WordImage` to use the local resolver and to render NOTHING when there is no image or on load error (the "Image non disponible" box must never appear mid-reveal). Keep the wooden-frame chrome only when an image is actually rendering.

**Files:**
- Modify: `Motamot/motamot-app/src/components/WordImage.tsx`
- Create: `Motamot/motamot-app/src/components/WordImage.test.tsx`

Steps:

- [ ] Write a failing test `Motamot/motamot-app/src/components/WordImage.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'
  import { WordImage } from './WordImage'

  describe('WordImage', () => {
    it('uses the local word-images path', () => {
      render(<WordImage image="chat.png" word="chat" />)
      const img = screen.getByAltText('chat') as HTMLImageElement
      expect(img.getAttribute('src')).toBe('/word-images/chat.png')
    })

    it('renders nothing (no placeholder text) when the image errors', () => {
      const { container } = render(<WordImage image="missing.png" word="missing" />)
      const img = screen.getByAltText('missing')
      fireEvent.error(img)
      expect(screen.queryByText('Image non disponible')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordImage.test.tsx`. Expected: the second test FAILS (current component still renders the "Image non disponible" placeholder and keeps the img).
- [ ] Replace `src/components/WordImage.tsx` ENTIRELY:
  ```tsx
  import { useState, useEffect } from 'react';
  import { getImageUrl } from '../services/supabase';

  interface WordImageProps {
    image: string;
    word: string;
  }

  export function WordImage({ image, word }: WordImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    useEffect(() => {
      setLoaded(false);
      setErrored(false);
    }, [image]);

    // Never show a placeholder box: on error, render nothing at all.
    if (errored) return null;

    return (
      <div className="animate-fade-in">
        <div className="relative p-3 md:p-4 lg:p-5 bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-2 md:inset-3 border-2 border-amber-500/50 rounded-sm pointer-events-none" />
          <div className="absolute inset-0 border-4 md:border-6 border-amber-950 rounded-sm pointer-events-none" />
          <div className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-l-2 border-amber-400/60 rounded-tl-sm" />
          <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-r-2 border-amber-400/60 rounded-tr-sm" />
          <div className="absolute bottom-1 left-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-l-2 border-amber-400/60 rounded-bl-sm" />
          <div className="absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-r-2 border-amber-400/60 rounded-br-sm" />

          <div className="p-2 md:p-3 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 shadow-inner">
            <div className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white">
              <img
                src={getImageUrl(image)}
                alt={word}
                className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```
- [ ] Run the tests again: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordImage.test.tsx`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/components/WordImage.tsx Motamot/motamot-app/src/components/WordImage.test.tsx && git commit -m "feat: WordImage uses local images and never shows a placeholder

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 6: Bundle Playwrite FR Trad locally as woff2

Download the Playwrite FR Trad woff2 file(s), self-host under `public/fonts/`, add `@font-face` in `index.css`, remove the Google Fonts `<link>` from `index.html`, and drop the now-unused gstatic/googleapis runtimeCaching (the font is local and SW-precached as a woff2).

**Files:**
- Create: `Motamot/motamot-app/public/fonts/playwrite-fr-trad.woff2`
- Modify: `Motamot/motamot-app/src/index.css`
- Modify: `Motamot/motamot-app/index.html`
- Modify: `Motamot/motamot-app/vite.config.ts`

Steps:

- [ ] Fetch the font CSS to find the woff2 source. Playwrite FR Trad is a variable weight (100..400) font. Download the woff2 referenced by `https://fonts.googleapis.com/css2?family=Playwrite+FR+Trad:wght@100..400&display=swap`:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && mkdir -p public/fonts && \
  CSS=$(curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "https://fonts.googleapis.com/css2?family=Playwrite+FR+Trad:wght@100..400&display=swap") && \
  URL=$(echo "$CSS" | grep -oE "https://fonts.gstatic.com/[^) ]+\.woff2" | head -1) && \
  echo "Downloading $URL" && curl -sL "$URL" -o public/fonts/playwrite-fr-trad.woff2 && \
  ls -la public/fonts/playwrite-fr-trad.woff2
  ```
  Expected: a `playwrite-fr-trad.woff2` of nonzero size (typically 30–80KB). If the variable-font URL fails, fall back to the single-weight `:wght@400` query and name the file the same.
- [ ] Add `@font-face` to the TOP of `src/index.css` (before the `@tailwind` lines) so it is available globally. Insert:
  ```css
  @font-face {
    font-family: 'Playwrite FR Trad';
    font-style: normal;
    font-weight: 100 400;
    font-display: swap;
    src: url('/fonts/playwrite-fr-trad.woff2') format('woff2');
  }
  ```
  > Use a root-relative `/fonts/...` URL: Vite rewrites public-asset URLs in CSS against `base` at build time, producing `/Motamot/fonts/...` in production.
- [ ] Remove the three font `<link>`/`<link rel=preconnect>` lines from `index.html` (lines that reference `fonts.googleapis.com` / `fonts.gstatic.com`). The `<head>` should no longer contain any `fonts.g*` reference. Verify: `grep -n "fonts.g" /Users/mathias.bonnet/Zivver/Motamot/motamot-app/index.html || echo "NO GOOGLE FONTS"`. Expected: `NO GOOGLE FONTS`.
- [ ] Remove the two `runtimeCaching` entries (googleapis + gstatic) from `vite.config.ts`, leaving `workbox` as just the glob (the woff2 is now precached via the `woff2` glob):
  ```ts
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        }
  ```
- [ ] Verify the font is precached and the build is clean: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm build`. Expect success; `dist/sw.js` precache manifest should reference `fonts/playwrite-fr-trad.woff2`.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/public/fonts Motamot/motamot-app/src/index.css Motamot/motamot-app/index.html Motamot/motamot-app/vite.config.ts && git commit -m "feat: bundle Playwrite FR Trad woff2 locally, drop Google Fonts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 7: Spaced-repetition service (per-lemma Leitner + CEFR gating) — `src/services/srs.ts`

Pure, injectable, fully unit-tested. Per-lemma Leitner buckets in localStorage, and a CEFR gate that starts at A1/A2 and unlocks B1 as known-lemma count grows.

**Files:**
- Create: `Motamot/motamot-app/src/services/srs.ts`
- Create: `Motamot/motamot-app/src/services/srs.test.ts`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/services/srs.test.ts`:
  ```ts
  import { describe, it, expect, beforeEach } from 'vitest'
  import {
    recordExposure,
    getBucket,
    knownLemmaCount,
    unlockedLevels,
    dueScore,
    SRS_STORAGE_KEY,
  } from './srs'

  beforeEach(() => localStorage.clear())

  describe('srs Leitner buckets', () => {
    it('new lemma starts as "new" with no entry', () => {
      expect(getBucket('chat')).toBe('new')
    })
    it('promotes new -> learning -> known across exposures', () => {
      recordExposure('chat')
      expect(getBucket('chat')).toBe('learning')
      recordExposure('chat')
      recordExposure('chat')
      expect(getBucket('chat')).toBe('known')
    })
    it('clamps at known and counts known lemmas', () => {
      for (let i = 0; i < 10; i++) recordExposure('chat')
      expect(getBucket('chat')).toBe('known')
      expect(knownLemmaCount()).toBe(1)
    })
    it('dueScore is higher for newer/less-seen lemmas', () => {
      recordExposure('vu') // learning
      expect(dueScore('jamais')).toBeGreaterThan(dueScore('vu'))
    })
    it('persists to localStorage under SRS_STORAGE_KEY', () => {
      recordExposure('chat')
      expect(localStorage.getItem(SRS_STORAGE_KEY)).toContain('chat')
    })
  })

  describe('CEFR gating', () => {
    it('starts with A1+A2 unlocked, B1 locked', () => {
      expect(unlockedLevels()).toEqual(['A1', 'A2'])
    })
    it('unlocks B1 once enough lemmas are known', () => {
      for (let n = 0; n < 30; n++) {
        const lemma = `lemma${n}`
        for (let i = 0; i < 3; i++) recordExposure(lemma)
      }
      expect(unlockedLevels()).toContain('B1')
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/srs.test.ts`. Expected: FAIL (module not found).
- [ ] Create `src/services/srs.ts` with FULL content:
  ```ts
  export type Bucket = 'new' | 'learning' | 'known'
  export type CefrLevel = 'A1' | 'A2' | 'B1'

  export const SRS_STORAGE_KEY = 'motamot_srs_v1'

  // Exposures needed to enter each bucket.
  const LEARNING_AT = 1
  const KNOWN_AT = 3
  // B1 unlocks once this many lemmas are "known".
  const B1_UNLOCK_KNOWN = 25

  interface LemmaState {
    seen: number // total exposures
    last: number // epoch ms of last exposure
  }
  type Store = Record<string, LemmaState>

  function read(): Store {
    try {
      const raw = localStorage.getItem(SRS_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Store) : {}
    } catch {
      return {}
    }
  }

  function write(store: Store): void {
    try {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(store))
    } catch {
      /* storage full / unavailable — degrade silently */
    }
  }

  function bucketFor(seen: number): Bucket {
    if (seen >= KNOWN_AT) return 'known'
    if (seen >= LEARNING_AT) return 'learning'
    return 'new'
  }

  export function getBucket(lemma: string): Bucket {
    const s = read()[lemma]
    return s ? bucketFor(s.seen) : 'new'
  }

  export function recordExposure(lemma: string, now: number = Date.now()): void {
    const store = read()
    const prev = store[lemma]
    store[lemma] = { seen: (prev?.seen ?? 0) + 1, last: now }
    write(store)
  }

  export function knownLemmaCount(): number {
    const store = read()
    return Object.values(store).filter((s) => bucketFor(s.seen) === 'known').length
  }

  /**
   * Higher = more due. Unseen lemmas score highest; among seen lemmas,
   * fewer exposures and older last-seen score higher.
   */
  export function dueScore(lemma: string, now: number = Date.now()): number {
    const s = read()[lemma]
    if (!s) return 1_000_000
    const ageMs = Math.max(0, now - s.last)
    const ageHours = ageMs / 3_600_000
    return (KNOWN_AT - Math.min(s.seen, KNOWN_AT)) * 1000 + ageHours
  }

  export function unlockedLevels(): CefrLevel[] {
    const base: CefrLevel[] = ['A1', 'A2']
    if (knownLemmaCount() >= B1_UNLOCK_KNOWN) base.push('B1')
    return base
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/srs.test.ts`. Expected: all passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/services/srs.ts Motamot/motamot-app/src/services/srs.test.ts && git commit -m "feat: add per-lemma Leitner SRS service with CEFR gating

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 8: Bank-access selection service — `src/services/bank.ts`

Imports `sentenceBank.json` typed as `SentenceBank`. Exposes a pure, testable `selectNextSentence` with injectable randomness + storage + clock that: draws from a shuffled bag of unseen IDs (localStorage `motamot_seen_ids`), enforces hard no-repeat within a session, reshuffles when exhausted, filters to unlocked CEFR levels, and biases the next pick toward the sentence containing the most-due target lemmas.

**Files:**
- Create: `Motamot/motamot-app/src/services/bank.ts`
- Create: `Motamot/motamot-app/src/services/bank.test.ts`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/services/bank.test.ts` (uses the fixture, never the real bank):
  ```ts
  import { describe, it, expect, beforeEach } from 'vitest'
  import { fixtureBank } from '../test/fixtures/bank'
  import {
    createSelector,
    SEEN_STORAGE_KEY,
    type Selector,
  } from './bank'

  // Deterministic RNG: returns a fixed sequence then 0.
  function seededRandom(seq: number[]): () => number {
    let i = 0
    return () => (i < seq.length ? seq[i++] : 0)
  }

  beforeEach(() => localStorage.clear())

  function makeSelector(extra?: Partial<Parameters<typeof createSelector>[0]>): Selector {
    return createSelector({
      bank: fixtureBank,
      random: seededRandom([0, 0, 0, 0, 0]),
      unlockedLevels: () => ['A1', 'A2', 'B1'],
      dueScore: () => 0,
      ...extra,
    })
  }

  describe('bank selector', () => {
    it('returns a sentence from the bank', () => {
      const sel = makeSelector()
      const s = sel.next()
      expect(fixtureBank.sentences.map((x) => x.id)).toContain(s.id)
    })

    it('never repeats within a session until pool exhausted', () => {
      const sel = makeSelector()
      const seen = new Set<string>()
      for (let i = 0; i < fixtureBank.sentences.length; i++) {
        const s = sel.next()
        expect(seen.has(s.id)).toBe(false)
        seen.add(s.id)
      }
      expect(seen.size).toBe(fixtureBank.sentences.length)
    })

    it('reshuffles and continues after exhaustion', () => {
      const sel = makeSelector()
      for (let i = 0; i < fixtureBank.sentences.length; i++) sel.next()
      const afterReshuffle = sel.next()
      expect(fixtureBank.sentences.map((x) => x.id)).toContain(afterReshuffle.id)
    })

    it('only serves sentences within unlocked levels', () => {
      const sel = makeSelector({ unlockedLevels: () => ['A1'] })
      for (let i = 0; i < 5; i++) {
        expect(sel.next().level).toBe('A1')
      }
    })

    it('persists seen ids to localStorage', () => {
      const sel = makeSelector()
      const s = sel.next()
      expect(localStorage.getItem(SEEN_STORAGE_KEY)).toContain(s.id)
    })

    it('biases toward the sentence whose target lemmas are most due', () => {
      // Make "chat" extremely due; expect the s-cat-apple sentence first.
      const sel = makeSelector({
        unlockedLevels: () => ['A1', 'A2', 'B1'],
        dueScore: (lemma: string) => (lemma === 'chat' ? 9999 : 1),
      })
      expect(sel.next().id).toBe('s-cat-apple')
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/bank.test.ts`. Expected: FAIL (module not found).
- [ ] Create `src/services/bank.ts` with FULL content. The default export wires the real JSON + real SRS; `createSelector` is the injectable core for tests.
  ```ts
  import bankJson from '../data/sentenceBank.json'
  import type { SentenceBank, BankSentence } from '../types/bank'
  import { unlockedLevels as srsUnlocked, dueScore as srsDueScore } from './srs'

  export const SEEN_STORAGE_KEY = 'motamot_seen_ids'

  export interface SelectorDeps {
    bank: SentenceBank
    random: () => number
    unlockedLevels: () => string[]
    dueScore: (lemma: string) => number
    readSeen?: () => string[]
    writeSeen?: (ids: string[]) => void
  }

  export interface Selector {
    next: () => BankSentence
  }

  function defaultReadSeen(): string[] {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  function defaultWriteSeen(ids: string[]): void {
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* degrade silently */
    }
  }

  // Fisher-Yates using injected RNG.
  function shuffle<T>(arr: T[], random: () => number): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const tmp = out[i]
      out[i] = out[j]
      out[j] = tmp
    }
    return out
  }

  function sentenceDueScore(s: BankSentence, dueScore: (lemma: string) => number): number {
    const targets = s.tokens.filter((t) => t.isTarget)
    if (targets.length === 0) return 0
    return targets.reduce((sum, t) => sum + dueScore(t.lemma), 0) / targets.length
  }

  export function createSelector(deps: SelectorDeps): Selector {
    const { bank, random, unlockedLevels, dueScore } = deps
    const readSeen = deps.readSeen ?? defaultReadSeen
    const writeSeen = deps.writeSeen ?? defaultWriteSeen

    // Hard no-repeat within this Selector instance (the session).
    const sessionSeen = new Set<string>(readSeen())

    function eligiblePool(): BankSentence[] {
      const levels = new Set(unlockedLevels())
      return bank.sentences.filter((s) => levels.has(s.level))
    }

    function next(): BankSentence {
      let pool = eligiblePool().filter((s) => !sessionSeen.has(s.id))

      // Pool exhausted within unlocked levels: reshuffle (clear session memory).
      if (pool.length === 0) {
        sessionSeen.clear()
        writeSeen([])
        pool = eligiblePool()
      }

      // Fallback: if a level filter yields nothing at all, use the whole bank.
      if (pool.length === 0) pool = bank.sentences.slice()

      // Shuffle for variety, then bias toward the most-due sentence.
      const shuffled = shuffle(pool, random)
      let best = shuffled[0]
      let bestScore = sentenceDueScore(best, dueScore)
      for (let i = 1; i < shuffled.length; i++) {
        const score = sentenceDueScore(shuffled[i], dueScore)
        if (score > bestScore) {
          best = shuffled[i]
          bestScore = score
        }
      }

      sessionSeen.add(best.id)
      writeSeen(Array.from(sessionSeen))
      return best
    }

    return { next }
  }

  // App-wired selector using the real bank + real SRS.
  export function createDefaultSelector(): Selector {
    return createSelector({
      bank: bankJson as SentenceBank,
      random: Math.random,
      unlockedLevels: srsUnlocked,
      dueScore: srsDueScore,
    })
  }
  ```
  > If `src/data/sentenceBank.json` does not yet exist (bank-pipeline plan owns it), tests still pass because they use the fixture; but `tsc --noEmit` will fail on the import. In that case, temporarily create a minimal valid `src/data/sentenceBank.json` with `{"schemaVersion":1,"generatorModel":"claude-opus-4-8","generatorVersion":"stub","validatorModel":"claude-sonnet-4-6","validatorVersion":"stub","generatedAt":"2026-06-15T00:00:00.000Z","sentences":[]}` and note in the commit that the bank-pipeline plan replaces it. Do NOT commit a stub bank if the real one is present.
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/bank.test.ts`. Expected: all passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/services/bank.ts Motamot/motamot-app/src/services/bank.test.ts && git commit -m "feat: add bank selection service with no-repeat bag and due-lemma bias

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 9: Rewrite `useGameLoop` as a reducer-driven tap-through state machine

Select a bank sentence → derive ordered `isContent` tokens for tap-through → advance on tap → after the last content token, reveal the full sentence → expose the audio filename. No `isLoading`/`error`/key states. The reducer is a pure exported function so transitions can be unit-tested without React.

**Files:**
- Modify: `Motamot/motamot-app/src/hooks/useGameLoop.ts`
- Create: `Motamot/motamot-app/src/hooks/useGameLoop.test.ts`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/hooks/useGameLoop.test.ts` (tests the pure reducer + a small selector stub):
  ```ts
  import { describe, it, expect } from 'vitest'
  import { fixtureBank } from '../test/fixtures/bank'
  import { gameReducer, initGameState, contentTokens, type GameState } from './useGameLoop'

  const cat = fixtureBank.sentences[0] // 3 content tokens: chat, mange, rouge

  describe('contentTokens', () => {
    it('keeps only isContent tokens in text order', () => {
      const tokens = contentTokens(cat)
      expect(tokens.map((t) => t.surface)).toEqual(['chat', 'mange', 'pomme', 'rouge'])
    })
  })

  describe('gameReducer', () => {
    it('init starts on the first content token, not revealed', () => {
      const s = initGameState(cat)
      expect(s.phase).toBe('reveal-word')
      expect(s.index).toBe(0)
      expect(s.revealed).toBe(false)
    })

    it('advance walks through content tokens', () => {
      let s: GameState = initGameState(cat)
      s = gameReducer(s, { type: 'ADVANCE' })
      expect(s.index).toBe(1)
      s = gameReducer(s, { type: 'ADVANCE' })
      expect(s.index).toBe(2)
    })

    it('advancing past the last content token reveals the full sentence', () => {
      let s: GameState = initGameState(cat)
      const total = contentTokens(cat).length
      for (let i = 0; i < total - 1; i++) s = gameReducer(s, { type: 'ADVANCE' })
      // now on last token; one more advance reveals
      s = gameReducer(s, { type: 'ADVANCE' })
      expect(s.phase).toBe('reveal-sentence')
      expect(s.revealed).toBe(true)
    })

    it('LOAD replaces the sentence and resets to the first token', () => {
      let s: GameState = initGameState(cat)
      s = gameReducer(s, { type: 'ADVANCE' })
      const next = fixtureBank.sentences[1]
      s = gameReducer(s, { type: 'LOAD', sentence: next })
      expect(s.sentence.id).toBe(next.id)
      expect(s.index).toBe(0)
      expect(s.phase).toBe('reveal-word')
    })

    it('has no isLoading or error fields', () => {
      const s = initGameState(cat) as Record<string, unknown>
      expect('isLoading' in s).toBe(false)
      expect('error' in s).toBe(false)
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/hooks/useGameLoop.test.ts`. Expected: FAIL (the inert stub from Task 3 exports none of these).
- [ ] Replace `src/hooks/useGameLoop.ts` ENTIRELY:
  ```ts
  import { useReducer, useEffect, useMemo, useRef } from 'react'
  import type { BankSentence, BankToken } from '../types/bank'
  import { createDefaultSelector } from '../services/bank'
  import { recordExposure } from '../services/srs'

  export type GamePhase = 'reveal-word' | 'reveal-sentence'

  export interface GameState {
    sentence: BankSentence
    index: number // index into the content-token list
    phase: GamePhase
    revealed: boolean // full sentence shown
  }

  export type GameAction =
    | { type: 'ADVANCE' }
    | { type: 'LOAD'; sentence: BankSentence }

  /** Ordered list of tap-through tokens (isContent) for a sentence. */
  export function contentTokens(sentence: BankSentence): BankToken[] {
    return sentence.tokens.filter((t) => t.isContent)
  }

  export function initGameState(sentence: BankSentence): GameState {
    return { sentence, index: 0, phase: 'reveal-word', revealed: false }
  }

  export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'LOAD':
        return initGameState(action.sentence)
      case 'ADVANCE': {
        if (state.phase === 'reveal-sentence') return state // App issues LOAD to move on
        const tokens = contentTokens(state.sentence)
        const isLast = state.index >= tokens.length - 1
        if (isLast) {
          return { ...state, phase: 'reveal-sentence', revealed: true }
        }
        return { ...state, index: state.index + 1 }
      }
      default:
        return state
    }
  }

  export function useGameLoop() {
    // One selector per mount = one session (hard no-repeat within session).
    const selectorRef = useRef(createDefaultSelector())
    const [state, dispatch] = useReducer(gameReducer, undefined, () =>
      initGameState(selectorRef.current.next()),
    )

    const tokens = useMemo(() => contentTokens(state.sentence), [state.sentence])
    const currentToken = tokens[state.index] ?? null

    // Record SRS exposure for every target lemma once the sentence is revealed.
    useEffect(() => {
      if (state.revealed) {
        for (const t of state.sentence.tokens) {
          if (t.isTarget) recordExposure(t.lemma)
        }
      }
    }, [state.revealed, state.sentence])

    const advance = () => {
      if (state.phase === 'reveal-sentence') {
        dispatch({ type: 'LOAD', sentence: selectorRef.current.next() })
      } else {
        dispatch({ type: 'ADVANCE' })
      }
    }

    return {
      sentence: state.sentence,
      tokens,
      currentToken,
      index: state.index,
      total: tokens.length,
      revealed: state.revealed,
      phase: state.phase,
      audio: state.sentence.audio,
      advance,
    }
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/hooks/useGameLoop.test.ts`. Expected: all passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/hooks/useGameLoop.ts Motamot/motamot-app/src/hooks/useGameLoop.test.ts && git commit -m "feat: rewrite useGameLoop as tap-through reducer over the bank

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 10: Install `motion`, add chalk CSS, and a POS/gender chip

Add `motion` (npm `motion`, imports from `motion/react`). Add the chalk text effect, word-no-break utility, eraser/dust + tap-dust keyframes, vignette, and the `prefers-reduced-motion` backstop to `index.css` / `tailwind.config.js`. Add a small, unit-tested `WordChip` for POS + gender color coding.

**Files:**
- Modify: `Motamot/motamot-app/package.json` (adds `motion` dep)
- Modify: `Motamot/motamot-app/src/index.css`
- Modify: `Motamot/motamot-app/tailwind.config.js`
- Create: `Motamot/motamot-app/src/components/WordChip.tsx`
- Create: `Motamot/motamot-app/src/components/WordChip.test.tsx`

Steps:

- [ ] Install motion: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm add motion@^11.15.0`
- [ ] Add chalk + animation CSS to `src/index.css` (append after the existing `.animate-fade-in` block):
  ```css
  /* Whole words never break across lines during the per-letter write-on. */
  .word-nowrap {
    display: inline-block;
    white-space: nowrap;
  }

  /* Stacked text-shadow chalk effect for the hero word + final sentence. */
  .chalk-text {
    color: #f7f7f2;
    text-shadow:
      0 0 1px rgba(247, 247, 242, 0.6),
      0 0 2px rgba(247, 247, 242, 0.35),
      1px 1px 0 rgba(0, 0, 0, 0.18);
  }

  /* Final sentence: higher-contrast, AA-legible treatment on dark green. */
  .chalk-sentence {
    color: #fdfdf8;
    text-shadow:
      0 0 1px rgba(255, 255, 255, 0.75),
      1px 1px 1px rgba(0, 0, 0, 0.25);
  }

  /* Ghost of the previously erased word. */
  .chalk-ghost {
    color: rgba(247, 247, 242, 0.14);
    text-shadow: none;
    filter: blur(0.5px);
  }

  /* Vignette over the existing grain. */
  .vignette::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 100%);
  }

  @keyframes tapDust {
    0% { opacity: 0.55; transform: scale(0.6); }
    100% { opacity: 0; transform: scale(1.6); }
  }
  .tap-dust {
    animation: tapDust 0.45s ease-out forwards;
  }

  /* Reduced-motion backstop: kill app animations, show content instantly. */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in,
    .tap-dust {
      animation: none !important;
    }
    .word-nowrap {
      opacity: 1 !important;
    }
  }
  ```
- [ ] Add color tokens for POS chips to `tailwind.config.js` `theme.extend.colors` (add a `pos` group alongside `blackboard`/`chalk`):
  ```js
        pos: {
          noun: '#7fd4a6',
          verb: '#f2c879',
          adjective: '#9bc0f2',
          adverb: '#e69bdc',
        },
  ```
- [ ] Write a failing test `Motamot/motamot-app/src/components/WordChip.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { WordChip } from './WordChip'

  describe('WordChip', () => {
    it('labels a masculine noun', () => {
      render(<WordChip type="noun" gender="m" />)
      expect(screen.getByText(/nom/i)).toBeInTheDocument()
      expect(screen.getByText(/masculin/i)).toBeInTheDocument()
    })
    it('labels a verb with no gender', () => {
      render(<WordChip type="verb" gender={null} />)
      expect(screen.getByText(/verbe/i)).toBeInTheDocument()
      expect(screen.queryByText(/masculin|féminin/i)).toBeNull()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordChip.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/WordChip.tsx`:
  ```tsx
  import type { BankToken } from '../types/bank'

  interface WordChipProps {
    type: BankToken['type']
    gender: BankToken['gender']
  }

  const POS_LABEL: Record<BankToken['type'], string> = {
    noun: 'nom',
    verb: 'verbe',
    adjective: 'adjectif',
    adverb: 'adverbe',
    function: 'mot-outil',
  }

  const POS_COLOR: Record<BankToken['type'], string> = {
    noun: 'text-pos-noun border-pos-noun',
    verb: 'text-pos-verb border-pos-verb',
    adjective: 'text-pos-adjective border-pos-adjective',
    adverb: 'text-pos-adverb border-pos-adverb',
    function: 'text-chalk-dim border-chalk-subtle',
  }

  export function WordChip({ type, gender }: WordChipProps) {
    const genderLabel = gender === 'm' ? 'masculin' : gender === 'f' ? 'féminin' : null
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs md:text-sm font-sans uppercase tracking-wide ${POS_COLOR[type]}`}
      >
        <span>{POS_LABEL[type]}</span>
        {genderLabel && <span className="opacity-80">· {genderLabel}</span>}
      </span>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordChip.test.tsx`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/package.json Motamot/motamot-app/pnpm-lock.yaml Motamot/motamot-app/src/index.css Motamot/motamot-app/tailwind.config.js Motamot/motamot-app/src/components/WordChip.tsx Motamot/motamot-app/src/components/WordChip.test.tsx && git commit -m "feat: add motion dep, chalk CSS, and POS/gender WordChip

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 11: `WriteOnWord` — per-letter write-on with word-level non-breaking spans + reduced-motion

A motion component that renders text split into whole-word `inline-block` spans (so words never break across lines) and animates each letter on. Gated behind `useReducedMotion` (renders instantly when reduced). Includes the cursive-joining fallback as a prop so we can switch to per-word opacity if Playwrite letter-joining breaks in-browser.

**Files:**
- Create: `Motamot/motamot-app/src/components/WriteOnWord.tsx`
- Create: `Motamot/motamot-app/src/components/WriteOnWord.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/components/WriteOnWord.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render } from '@testing-library/react'
  import { LazyMotion, domAnimation } from 'motion/react'
  import { WriteOnWord } from './WriteOnWord'

  function renderWO(text: string) {
    return render(
      <LazyMotion features={domAnimation}>
        <WriteOnWord text={text} />
      </LazyMotion>,
    )
  }

  describe('WriteOnWord', () => {
    it('wraps each word in a word-nowrap span', () => {
      const { container } = renderWO('le chat noir')
      const words = container.querySelectorAll('.word-nowrap')
      expect(words.length).toBe(3)
    })
    it('renders the full text content (accessible)', () => {
      const { container } = renderWO('une pomme')
      expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe('une pomme')
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WriteOnWord.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/WriteOnWord.tsx`:
  ```tsx
  import { m, useReducedMotion } from 'motion/react'

  interface WriteOnWordProps {
    text: string
    className?: string
    /** Fallback for cursive joining: animate whole words, not letters. */
    perWord?: boolean
  }

  const letterVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: i * 0.04, duration: 0.18, ease: 'easeOut' as const },
    }),
  }

  const wordVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: i * 0.12, duration: 0.22, ease: 'easeOut' as const },
    }),
  }

  export function WriteOnWord({ text, className, perWord = false }: WriteOnWordProps) {
    const reduce = useReducedMotion()
    const words = text.split(' ')

    // Reduced motion: render plain, instant, fully visible text.
    if (reduce) {
      return (
        <span className={className}>
          {words.map((w, i) => (
            <span key={i} className="word-nowrap">
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      )
    }

    let letterIndex = 0
    return (
      <span className={className} aria-label={text}>
        {words.map((word, wi) => (
          <m.span
            key={wi}
            className="word-nowrap"
            initial="hidden"
            animate="visible"
            custom={wi}
            variants={perWord ? wordVariants : undefined}
            aria-hidden
          >
            {perWord
              ? word
              : Array.from(word).map((ch, ci) => (
                  <m.span
                    key={ci}
                    style={{ display: 'inline-block' }}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    custom={letterIndex++}
                  >
                    {ch}
                  </m.span>
                ))}
            {wi < words.length - 1 ? ' ' : ''}
          </m.span>
        ))}
      </span>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WriteOnWord.test.tsx`. Expected: 2 passed.
- [ ] **In-browser cursive-joining verification (manual gate, recorded as a checkbox):** `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm dev`, open the app with Playwrite FR Trad applied to a multi-letter word (e.g. `chat`). Confirm the cursive letters still join visually. If per-letter spans break joining, set `perWord` to `true` wherever `WriteOnWord` is used in Task 12/13 (per-word opacity sweep) and note it in that task's commit. Document the observed result in the commit body.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/components/WriteOnWord.tsx Motamot/motamot-app/src/components/WriteOnWord.test.tsx && git commit -m "feat: add WriteOnWord with non-breaking words and reduced-motion backstop

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 12: Reveal UI — `WordReveal` (hero word + chip + image/gloss) and `SentenceReveal` (write-on + SVG underline)

`WordReveal`: big chalk word with the article+noun chunk for nouns and infinitive for verbs during tap-through, a `WordChip`, and EITHER the image (when `token.image`) OR the English gloss (`token.en`) — never both, never a placeholder. `SentenceReveal`: the full sentence as selectable real text via `WriteOnWord` with a hand-drawn SVG underline, AA contrast, wrapped in `AnimatePresence` for the eraser-sweep transition keyed per word.

**Files:**
- Create: `Motamot/motamot-app/src/components/WordReveal.tsx`
- Create: `Motamot/motamot-app/src/components/WordReveal.test.tsx`
- Create: `Motamot/motamot-app/src/components/SentenceReveal.tsx`
- Create: `Motamot/motamot-app/src/components/SentenceReveal.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/components/WordReveal.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { LazyMotion, domAnimation } from 'motion/react'
  import { WordReveal } from './WordReveal'
  import { fixtureBank } from '../test/fixtures/bank'

  const tokens = fixtureBank.sentences[0].tokens
  const chat = tokens.find((t) => t.lemma === 'chat')!
  const manger = tokens.find((t) => t.lemma === 'manger')!
  const rouge = tokens.find((t) => t.lemma === 'rouge')!

  function renderReveal(token: typeof chat) {
    return render(
      <LazyMotion features={domAnimation}>
        <WordReveal token={token} />
      </LazyMotion>,
    )
  }

  describe('WordReveal', () => {
    it('shows the article + noun chunk for a masculine noun with an image', () => {
      renderReveal(chat)
      expect(screen.getByLabelText('un chat')).toBeInTheDocument()
      expect(screen.getByAltText('chat')).toBeInTheDocument()
    })
    it('shows the verb surface and no image when none', () => {
      renderReveal(manger)
      expect(screen.queryByRole('img')).toBeNull()
    })
    it('shows the English gloss when there is no image', () => {
      renderReveal(rouge)
      expect(screen.getByText('red')).toBeInTheDocument()
      expect(screen.queryByRole('img')).toBeNull()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordReveal.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/WordReveal.tsx`:
  ```tsx
  import type { BankToken } from '../types/bank'
  import { WordChip } from './WordChip'
  import { WordImage } from './WordImage'
  import { WriteOnWord } from './WriteOnWord'

  interface WordRevealProps {
    token: BankToken
    /** Set true if Playwrite per-letter joining broke in-browser (Task 11). */
    perWord?: boolean
  }

  /** Display form during tap-through: article+noun for nouns, surface otherwise. */
  function displayForm(token: BankToken): string {
    if (token.type === 'noun' && token.gender) {
      const article = token.gender === 'm' ? 'un' : 'une'
      return `${article} ${token.lemma}`
    }
    return token.surface
  }

  export function WordReveal({ token, perWord }: WordRevealProps) {
    const form = displayForm(token)
    return (
      <div className="flex flex-col items-center gap-4 md:gap-6">
        <WriteOnWord
          key={token.lemma}
          text={form}
          perWord={perWord}
          className="chalk-text font-cursive text-4xl md:text-6xl lg:text-7xl tracking-wide text-center max-w-[90vw]"
        />
        <WordChip type={token.type} gender={token.gender} />
        {token.image ? (
          <WordImage image={token.image} word={token.lemma} />
        ) : token.en ? (
          <span className="font-sans text-lg md:text-2xl text-chalk-dim italic">{token.en}</span>
        ) : null}
      </div>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/WordReveal.test.tsx`. Expected: 3 passed.
- [ ] Write the failing test `Motamot/motamot-app/src/components/SentenceReveal.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { LazyMotion, domAnimation } from 'motion/react'
  import { SentenceReveal } from './SentenceReveal'

  describe('SentenceReveal', () => {
    it('renders the full sentence as selectable text', () => {
      render(
        <LazyMotion features={domAnimation}>
          <SentenceReveal text="Le chat mange une pomme rouge." />
        </LazyMotion>,
      )
      // Accessible to a screen reader as one label / present in DOM text.
      expect(screen.getByLabelText('Le chat mange une pomme rouge.')).toBeInTheDocument()
    })
    it('draws an SVG underline', () => {
      const { container } = render(
        <LazyMotion features={domAnimation}>
          <SentenceReveal text="Le chat." />
        </LazyMotion>,
      )
      expect(container.querySelector('svg')).not.toBeNull()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/SentenceReveal.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/SentenceReveal.tsx`:
  ```tsx
  import { m, useReducedMotion } from 'motion/react'
  import { WriteOnWord } from './WriteOnWord'

  interface SentenceRevealProps {
    text: string
    perWord?: boolean
  }

  export function SentenceReveal({ text, perWord }: SentenceRevealProps) {
    const reduce = useReducedMotion()
    return (
      <div className="flex flex-col items-center gap-3 md:gap-4 select-text">
        <WriteOnWord
          text={text}
          perWord={perWord}
          className="chalk-sentence font-cursive text-2xl md:text-4xl lg:text-5xl !leading-[2] text-center max-w-[85vw]"
        />
        {/* Hand-drawn underline: a slightly wavy stroke that draws on. */}
        <svg
          className="w-[60vw] max-w-[640px] h-4"
          viewBox="0 0 640 16"
          fill="none"
          aria-hidden
          preserveAspectRatio="none"
        >
          <m.path
            d="M2 9 C 120 3, 240 14, 360 8 S 600 4, 638 10"
            stroke="#fdfdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/SentenceReveal.test.tsx`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/components/WordReveal.tsx Motamot/motamot-app/src/components/WordReveal.test.tsx Motamot/motamot-app/src/components/SentenceReveal.tsx Motamot/motamot-app/src/components/SentenceReveal.test.tsx && git commit -m "feat: add WordReveal and SentenceReveal with SVG underline

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 13: Audio play control with 0.75x slow toggle — `SentencePlayer`

A keyboard-reachable play/replay control wired to `getAudioUrl(filename)` from `src/services/audio.ts` (owned by the AUDIO plan), plus a slow-playback toggle that sets `audio.playbackRate = 0.75` with `preservesPitch`. When `audio` is `null`, the control is hidden entirely.

**Files:**
- Create (stub only if missing): `Motamot/motamot-app/src/services/audio.ts`
- Create: `Motamot/motamot-app/src/components/SentencePlayer.tsx`
- Create: `Motamot/motamot-app/src/components/SentencePlayer.test.tsx`

Steps:

- [ ] Check whether the audio service exists: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && test -f src/services/audio.ts && echo EXISTS || echo MISSING`. If MISSING, create a MINIMAL stub `src/services/audio.ts` (the AUDIO plan owns the real implementation — note this in the commit):
  ```ts
  // MINIMAL STUB — canonical owner: audio plan. Resolves a Supabase 'audio'
  // bucket public URL for a sentence MP3 filename. Replaced by the audio plan.
  const AUDIO_BASE =
    'https://gvsbrkvrqjlptzlvbaax.supabase.co/storage/v1/object/public/audio/'

  export const getAudioUrl = (filename: string): string => `${AUDIO_BASE}${filename}`
  ```
- [ ] Write the failing test `Motamot/motamot-app/src/components/SentencePlayer.test.tsx`:
  ```tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import { SentencePlayer } from './SentencePlayer'

  beforeEach(() => {
    // jsdom has no real audio engine; stub play().
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  describe('SentencePlayer', () => {
    it('renders nothing when filename is null', () => {
      const { container } = render(<SentencePlayer filename={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders play + slow controls when a filename is given', () => {
      render(<SentencePlayer filename="sentence-x.mp3" />)
      expect(screen.getByRole('button', { name: /écouter|rejouer/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ralenti|lent|0\.75/i })).toBeInTheDocument()
    })

    it('toggling slow sets playbackRate to 0.75', async () => {
      const user = userEvent.setup()
      const { container } = render(<SentencePlayer filename="sentence-x.mp3" />)
      const audio = container.querySelector('audio') as HTMLAudioElement
      await user.click(screen.getByRole('button', { name: /ralenti|lent|0\.75/i }))
      expect(audio.playbackRate).toBe(0.75)
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/SentencePlayer.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/SentencePlayer.tsx`:
  ```tsx
  import { useEffect, useRef, useState } from 'react'
  import { getAudioUrl } from '../services/audio'

  interface SentencePlayerProps {
    filename: string | null
    /** Auto-play once when true (e.g. right after the sentence finishes writing). */
    autoPlay?: boolean
  }

  // preservesPitch is supported but not in the standard lib DOM types.
  type PitchAudio = HTMLAudioElement & {
    preservesPitch?: boolean
    mozPreservesPitch?: boolean
    webkitPreservesPitch?: boolean
  }

  export function SentencePlayer({ filename, autoPlay = false }: SentencePlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [slow, setSlow] = useState(false)
    const [playedOnce, setPlayedOnce] = useState(false)

    function applyRate(el: PitchAudio, isSlow: boolean) {
      el.preservesPitch = true
      el.mozPreservesPitch = true
      el.webkitPreservesPitch = true
      el.playbackRate = isSlow ? 0.75 : 1
    }

    const play = () => {
      const el = audioRef.current as PitchAudio | null
      if (!el) return
      applyRate(el, slow)
      el.currentTime = 0
      void el.play().catch(() => {
        /* autoplay/network blocked — silent degrade */
      })
    }

    const toggleSlow = () => {
      const next = !slow
      setSlow(next)
      const el = audioRef.current as PitchAudio | null
      if (el) applyRate(el, next)
    }

    useEffect(() => {
      if (autoPlay && filename && !playedOnce) {
        setPlayedOnce(true)
        play()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, filename])

    if (!filename) return null

    return (
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <audio ref={audioRef} src={getAudioUrl(filename)} preload="auto" />
        <button
          type="button"
          onClick={play}
          aria-label={playedOnce ? 'Rejouer' : 'Écouter'}
          className="rounded-full border border-chalk-subtle px-4 py-2 text-chalk hover:border-chalk hover:text-white transition-colors font-sans"
        >
          {playedOnce ? '↻ Rejouer' : '▶ Écouter'}
        </button>
        <button
          type="button"
          onClick={toggleSlow}
          aria-pressed={slow}
          aria-label="Lecture ralentie 0.75x"
          className={`rounded-full border px-4 py-2 transition-colors font-sans ${
            slow
              ? 'border-chalk text-white'
              : 'border-chalk-subtle text-chalk-dim hover:border-chalk hover:text-chalk'
          }`}
        >
          🐢 Ralenti
        </button>
      </div>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/SentencePlayer.test.tsx`. Expected: 3 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit (note the stub ownership if you created it): `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/services/audio.ts Motamot/motamot-app/src/components/SentencePlayer.tsx Motamot/motamot-app/src/components/SentencePlayer.test.tsx && git commit -m "feat: add SentencePlayer with 0.75x slow toggle (audio service stub)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 14: Rework `useImagePreloader` for the current round and `ProgressDots` for variable count

`useImagePreloader` preloads exactly the current round's known image tokens (the bank tokens with an `image`), not 3 random nouns. `ProgressDots` already takes `{current,total}`; add a guard so a `total` of 0 renders nothing and confirm variable totals work.

**Files:**
- Modify: `Motamot/motamot-app/src/hooks/useImagePreloader.ts`
- Create: `Motamot/motamot-app/src/hooks/useImagePreloader.test.ts`
- Modify: `Motamot/motamot-app/src/components/ProgressDots.tsx`
- Create: `Motamot/motamot-app/src/components/ProgressDots.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/hooks/useImagePreloader.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { imageUrlsForSentence } from './useImagePreloader'
  import { fixtureBank } from '../test/fixtures/bank'

  describe('imageUrlsForSentence', () => {
    it('returns local URLs only for tokens that have an image', () => {
      const urls = imageUrlsForSentence(fixtureBank.sentences[0])
      expect(urls).toEqual(['/word-images/chat.png', '/word-images/pomme.png'])
    })
    it('returns an empty array when the sentence has no image tokens', () => {
      const noImg = { ...fixtureBank.sentences[2], tokens: fixtureBank.sentences[2].tokens.map((t) => ({ ...t, image: null })) }
      expect(imageUrlsForSentence(noImg)).toEqual([])
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/hooks/useImagePreloader.test.ts`. Expected: FAIL (export missing).
- [ ] Replace `src/hooks/useImagePreloader.ts` ENTIRELY:
  ```ts
  import { useEffect, useRef } from 'react'
  import { getImageUrl, preloadImages } from '../services/supabase'
  import type { BankSentence } from '../types/bank'

  /** Local URLs for the current round's tokens that actually have an image. */
  export function imageUrlsForSentence(sentence: BankSentence): string[] {
    return sentence.tokens
      .filter((t) => t.image)
      .map((t) => getImageUrl(t.image as string))
  }

  export function useImagePreloader(sentence: BankSentence) {
    const preloaded = useRef<Set<string>>(new Set())

    useEffect(() => {
      const urls = imageUrlsForSentence(sentence).filter((u) => !preloaded.current.has(u))
      if (urls.length === 0) return
      urls.forEach((u) => preloaded.current.add(u))
      void preloadImages(urls)
    }, [sentence])
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/hooks/useImagePreloader.test.ts`. Expected: 2 passed.
- [ ] Write the failing test `Motamot/motamot-app/src/components/ProgressDots.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render } from '@testing-library/react'
  import { ProgressDots } from './ProgressDots'

  describe('ProgressDots', () => {
    it('renders one dot per total (variable per round)', () => {
      const { container } = render(<ProgressDots current={2} total={5} />)
      expect(container.querySelectorAll('span').length).toBe(5)
    })
    it('renders nothing when total is 0', () => {
      const { container } = render(<ProgressDots current={0} total={0} />)
      expect(container.firstChild).toBeNull()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/ProgressDots.test.tsx`. Expected: the second test FAILS (current component renders an empty flex `div`, not null).
- [ ] Edit `src/components/ProgressDots.tsx` — add the zero guard at the top of the component body, before the `return`:
  ```tsx
  export function ProgressDots({ current, total }: ProgressDotsProps) {
    if (total <= 0) return null;
    return (
  ```
  (Leave the rest of the component unchanged.)
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/ProgressDots.test.tsx`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/hooks/useImagePreloader.ts Motamot/motamot-app/src/hooks/useImagePreloader.test.ts Motamot/motamot-app/src/components/ProgressDots.tsx Motamot/motamot-app/src/components/ProgressDots.test.tsx && git commit -m "feat: preload current-round images; ProgressDots handles variable/zero total

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 15: Rewrite `GameBoard` for the sentence-first reveal

Compose the tap-through (`WordReveal` for the current content token, keyed per word for `AnimatePresence` eraser-sweep + chalk-dust) and the final reveal (`SentenceReveal` + `SentencePlayer` autoplay) with a ghost of the previous word. No `isLoading`/`error` props.

**Files:**
- Modify: `Motamot/motamot-app/src/components/GameBoard.tsx`
- Create: `Motamot/motamot-app/src/components/GameBoard.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/components/GameBoard.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { LazyMotion, domAnimation } from 'motion/react'
  import { GameBoard } from './GameBoard'
  import { fixtureBank } from '../test/fixtures/bank'

  const sentence = fixtureBank.sentences[0]

  function renderBoard(props: Partial<Parameters<typeof GameBoard>[0]> = {}) {
    return render(
      <LazyMotion features={domAnimation}>
        <GameBoard
          sentence={sentence}
          currentToken={sentence.tokens.find((t) => t.lemma === 'chat')!}
          revealed={false}
          {...props}
        />
      </LazyMotion>,
    )
  }

  describe('GameBoard', () => {
    it('shows the current word during tap-through', () => {
      renderBoard()
      expect(screen.getByLabelText('un chat')).toBeInTheDocument()
    })
    it('shows the full sentence and play control when revealed', () => {
      renderBoard({ revealed: true })
      expect(screen.getByLabelText(sentence.text)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /écouter|rejouer/i })).toBeInTheDocument()
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/GameBoard.test.tsx`. Expected: FAIL (current GameBoard has the old props/shape).
- [ ] Replace `src/components/GameBoard.tsx` ENTIRELY:
  ```tsx
  import { AnimatePresence, m } from 'motion/react'
  import type { BankSentence, BankToken } from '../types/bank'
  import { WordReveal } from './WordReveal'
  import { SentenceReveal } from './SentenceReveal'
  import { SentencePlayer } from './SentencePlayer'

  interface GameBoardProps {
    sentence: BankSentence
    currentToken: BankToken | null
    revealed: boolean
    /** Set true if Playwrite per-letter joining broke in-browser (Task 11). */
    perWord?: boolean
  }

  export function GameBoard({ sentence, currentToken, revealed, perWord }: GameBoardProps) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 w-full">
        {revealed ? (
          <m.div
            key="sentence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <SentenceReveal text={sentence.text} perWord={perWord} />
            <SentencePlayer filename={sentence.audio} autoPlay />
          </m.div>
        ) : (
          <AnimatePresence mode="wait">
            {currentToken && (
              <m.div
                key={currentToken.start /* stable per word */}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04, filter: 'blur(3px)' }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <WordReveal token={currentToken} perWord={perWord} />
              </m.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/GameBoard.test.tsx`. Expected: 2 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/components/GameBoard.tsx Motamot/motamot-app/src/components/GameBoard.test.tsx && git commit -m "feat: rewrite GameBoard for sentence-first reveal with eraser-sweep

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 16: "Report this sentence" button — prefilled GitHub issue

Per the spec's bank-rot mitigation: a small affordance on the revealed sentence that opens a prefilled GitHub issue containing the sentence id and text.

**Files:**
- Create: `Motamot/motamot-app/src/components/ReportButton.tsx`
- Create: `Motamot/motamot-app/src/components/ReportButton.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/components/ReportButton.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { ReportButton } from './ReportButton'

  describe('ReportButton', () => {
    it('links to a prefilled GitHub issue with id and text', () => {
      render(<ReportButton id="s-cat-apple" text="Le chat mange une pomme rouge." />)
      const link = screen.getByRole('link', { name: /signaler/i }) as HTMLAnchorElement
      const href = link.href
      expect(href).toContain('/issues/new')
      expect(decodeURIComponent(href)).toContain('s-cat-apple')
      expect(decodeURIComponent(href)).toContain('Le chat mange une pomme rouge.')
      expect(link.target).toBe('_blank')
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/ReportButton.test.tsx`. Expected: FAIL (module not found).
- [ ] Create `src/components/ReportButton.tsx`:
  ```tsx
  interface ReportButtonProps {
    id: string
    text: string
  }

  // Public repo that hosts Motamot issues.
  const REPO = 'mathiasbonnet/Motamot'

  export function ReportButton({ id, text }: ReportButtonProps) {
    const title = `Sentence report: ${id}`
    const body = `**Sentence id:** ${id}\n**Text:** ${text}\n\n**What's wrong?** (grammar / meaning / not funny / unsafe / audio)\n\n`
    const href = `https://github.com/${REPO}/issues/new?labels=sentence-report&title=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}`
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="font-sans text-xs text-chalk-faint underline hover:text-chalk-dim transition-colors"
      >
        Signaler cette phrase
      </a>
    )
  }
  ```
  > Confirm the `REPO` slug matches the actual public repository before release; adjust if the GitHub Pages deploy lives under a different owner/name.
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/ReportButton.test.tsx`. Expected: 1 passed.
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/components/ReportButton.tsx Motamot/motamot-app/src/components/ReportButton.test.tsx && git commit -m "feat: add report-this-sentence prefilled GitHub issue button

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 17: Wire it all in `App.tsx`

Compose `useGameLoop` + `useImagePreloader` + `GameBoard` + `ProgressDots` + `ReportButton`. Tap anywhere advances. Chalk tray + sticks, vignette, ghost-of-previous word, tap-dust feedback. No Settings/gear, no loading/error.

**Files:**
- Modify: `Motamot/motamot-app/src/App.tsx`
- Create: `Motamot/motamot-app/src/App.test.tsx`

Steps:

- [ ] Write the failing test `Motamot/motamot-app/src/App.test.tsx`:
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import App from './App'

  describe('App', () => {
    it('renders a chalk word on first load (no settings gear)', () => {
      render(<App />)
      expect(screen.queryByTitle(/paramètres|api/i)).toBeNull()
      expect(document.querySelector('.chalk-text')).not.toBeNull()
    })
    it('advances through the round on tap and eventually reveals a sentence', async () => {
      const user = userEvent.setup()
      const { container } = render(<App />)
      // Tap up to 12 times to clear any round (max ~8 content words).
      for (let i = 0; i < 12; i++) {
        await user.click(container.firstChild as HTMLElement)
      }
      // Either a chalk-sentence has appeared, or we are mid-round again after LOAD.
      expect(container.querySelector('.chalk-text, .chalk-sentence')).not.toBeNull()
    })
  })
  ```
  > This test imports the REAL `useGameLoop`, which imports the REAL `src/data/sentenceBank.json`. Because this plan executes AFTER the bank-pipeline plan, the committed bank exists and contains hundreds of sentences, so both assertions run for real. (Defensive fallback only if you are running this plan standalone against the empty stub from Task 8: `selector.next()` returns `undefined`, so guard that second assertion with `it.skipIf(bank.sentences.length === 0)` — never weaken the first assertion.)
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/App.test.tsx`. Expected: FAIL (App is still the Task 3 placeholder).
- [ ] Replace `src/App.tsx` ENTIRELY:
  ```tsx
  import { useState } from 'react'
  import { LazyMotion, domAnimation } from 'motion/react'
  import { useGameLoop } from './hooks/useGameLoop'
  import { useImagePreloader } from './hooks/useImagePreloader'
  import { GameBoard } from './components/GameBoard'
  import { ProgressDots } from './components/ProgressDots'
  import { ReportButton } from './components/ReportButton'
  import './index.css'

  // Flip to true only if in-browser testing (Task 11) shows Playwrite letter
  // joining breaks with per-letter spans; switches reveals to a per-word sweep.
  const PER_WORD_FALLBACK = false

  interface Dust {
    id: number
    x: number
    y: number
  }

  function App() {
    const game = useGameLoop()
    const [dust, setDust] = useState<Dust[]>([])
    useImagePreloader(game.sentence)

    const handleClick = (e: React.MouseEvent) => {
      const id = Date.now()
      setDust((d) => [...d, { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => setDust((d) => d.filter((p) => p.id !== id)), 460)
      game.advance()
    }

    return (
      <LazyMotion features={domAnimation}>
        <div
          className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blackboard-dark via-blackboard to-blackboard-light cursor-pointer select-none relative font-sans vignette"
          onClick={handleClick}
        >
          {/* Grain texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTEiPjwvcmVjdD4KPC9zdmc+')]" />

          {/* Wooden frame */}
          <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-blackboard-border rounded-sm shadow-inner pointer-events-none" />

          {/* Chalk tray with sticks */}
          <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 w-[70vw] max-w-[720px] h-3 md:h-4 rounded-sm bg-gradient-to-b from-amber-900 to-amber-950 shadow-[0_2px_6px_rgba(0,0,0,0.5)] pointer-events-none">
            <span className="absolute -top-1 left-8 w-10 h-1.5 rounded-full bg-chalk/80 rotate-[-3deg]" />
            <span className="absolute -top-1 left-24 w-8 h-1.5 rounded-full bg-pos-verb/70 rotate-[2deg]" />
            <span className="absolute -top-1 right-12 w-9 h-1.5 rounded-full bg-pos-noun/70 rotate-[-1deg]" />
          </div>

          {/* Main reveal */}
          <div className="flex justify-center items-center flex-1 w-full px-8 z-10">
            <GameBoard
              sentence={game.sentence}
              currentToken={game.currentToken}
              revealed={game.revealed}
              perWord={PER_WORD_FALLBACK}
            />
          </div>

          {/* Progress + report (only mid-round shows dots; report shows on reveal) */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
            {!game.revealed && <ProgressDots current={game.index} total={game.total} />}
            {game.revealed && <ReportButton id={game.sentence.id} text={game.sentence.text} />}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm md:text-base text-chalk-faint z-10">
            {game.revealed ? 'Touchez pour continuer' : 'Touchez pour révéler le mot'}
          </div>

          {/* Tap-dust feedback */}
          {dust.map((p) => (
            <span
              key={p.id}
              className="tap-dust pointer-events-none absolute z-20 w-8 h-8 rounded-full bg-chalk/40"
              style={{ left: p.x - 16, top: p.y - 16 }}
            />
          ))}
        </div>
      </LazyMotion>
    )
  }

  export default App
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/App.test.tsx`. Expected: passed (or first assertion passed + second `it.skip` if only the stub bank exists).
- [ ] `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/App.tsx Motamot/motamot-app/src/App.test.tsx && git commit -m "feat: wire sentence-first reveal app shell with chalk tray and tap-dust

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

### Task 18: Accessibility + offline smoke verification and full-suite green

Final verification task: AA contrast assertion for the sentence treatment, full test suite green, full type-check + lint, production build precaches bank + images + audio runtime cache note, and manual offline cold-load check.

**Files:**
- Create: `Motamot/motamot-app/src/components/contrast.test.ts`
- Modify: `Motamot/motamot-app/vite.config.ts` (add audio runtimeCaching)

Steps:

- [ ] Add an audio runtime cache to `vite.config.ts` so offline replay works (the audio plan may also touch this — keep it idempotent; only add if absent). Re-add a `runtimeCaching` array inside `workbox` (it was removed in Task 6 for fonts), now scoped to the Supabase audio bucket:
  ```ts
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /\/storage\/v1\/object\/public\/audio\/.*\.mp3$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'motamot-audio-cache',
                expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
                rangeRequests: true,
              },
            },
          ],
        }
  ```
- [ ] Write `Motamot/motamot-app/src/components/contrast.test.ts` asserting the sentence text color vs the darkest blackboard background meets WCAG AA (≥4.5:1). Use the `#fdfdf8` from `.chalk-sentence` against `blackboard.dark` `#0d1f0d`:
  ```ts
  import { describe, it, expect } from 'vitest'

  function luminance(hex: string): number {
    const n = parseInt(hex.replace('#', ''), 16)
    const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }

  function contrastRatio(a: string, b: string): number {
    const la = luminance(a)
    const lb = luminance(b)
    const [hi, lo] = la > lb ? [la, lb] : [lb, la]
    return (hi + 0.05) / (lo + 0.05)
  }

  describe('final sentence contrast', () => {
    it('chalk-sentence text on blackboard-dark meets WCAG AA', () => {
      expect(contrastRatio('#fdfdf8', '#0d1f0d')).toBeGreaterThanOrEqual(4.5)
    })
  })
  ```
- [ ] Run: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/components/contrast.test.ts`. Expected: passed (this pair is well above 4.5:1; if a future color tweak drops below, raise the lightness of `--chalk-sentence` until it passes).
- [ ] Run the FULL suite: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test`. Expected: all test files passed.
- [ ] Full type-check + lint: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm exec tsc --noEmit && pnpm lint`. Expected: both exit 0.
- [ ] Production build: `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm build`. Expected: success; confirm `dist/sw.js` precache manifest includes `assets/*.js`, `word-images/*.png`, `fonts/playwrite-fr-trad.woff2`, and the bundled bank JSON (it is inlined into a JS chunk by Vite's `import` of the JSON, so the runtime needs no separate JSON fetch — the `json` glob covers any other emitted JSON like the PWA manifest).
- [ ] **Manual offline cold-load (recorded checkbox):** `cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm preview`, open the served URL, let the SW install, then go offline (DevTools → Network → Offline) and reload. Confirm: the chalk font renders without reflow, word images appear, tap-through works, the full sentence reveals, no-repeat-within-session holds across several rounds, and reduced-motion (DevTools → Rendering → Emulate prefers-reduced-motion) renders the sentence instantly. Cached audio replays offline only after it was played once online (CacheFirst). Document the result in the commit body.
- [ ] Commit: `cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/vite.config.ts Motamot/motamot-app/src/components/contrast.test.ts && git commit -m "test: add AA contrast check; cache audio for offline replay

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`

---

## Final state checklist

- [ ] No references remain to Groq, Settings, API keys, `services/api.ts`, or the Groq types.
- [ ] Images served from `public/word-images/`; `WordImage` never shows a placeholder.
- [ ] Playwrite FR Trad bundled as local woff2; no Google Fonts `<link>`.
- [ ] Bank JSON imported and precached; `json` in the Workbox glob.
- [ ] `useGameLoop` is a tap-through reducer with no `isLoading`/`error` states; SRS exposure recorded on reveal.
- [ ] `bank.ts` no-repeat-within-session + reshuffle + due-lemma bias, all unit-tested.
- [ ] `srs.ts` per-lemma Leitner + CEFR gate, all unit-tested.
- [ ] Per-letter write-on with whole words in non-breaking spans; reduced-motion + CSS backstop; cursive-joining fallback (`perWord`) verified in-browser.
- [ ] Final sentence is selectable real text at ≥4.5:1 AA contrast with an SVG underline.
- [ ] Audio play + 0.75x slow toggle, hidden when `audio` is null; offline replay cached.
- [ ] `ReportButton` opens a prefilled GitHub issue.
- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` all clean.
