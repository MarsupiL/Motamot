# French Read-Aloud Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native-French read-aloud audio to Motamot by pre-generating one MP3 per validated bank sentence with Google Cloud TTS Chirp 3 HD, hosting them on a public Supabase `audio` bucket, exposing a tiny runtime URL helper (`src/services/audio.ts`), and caching the audio for offline replay via the PWA service worker.

**Architecture:** A one-time offline Node batch (`scripts/build-audio.mjs`) reads the committed `src/data/sentenceBank.json`, synthesizes any sentence still missing audio, uploads each clip to Supabase storage (service-role key), and writes the `audio` filename back into the bank JSON (committed). At runtime the React app never calls a TTS API — it reads `sentence.audio` and resolves a static public Supabase URL through `getAudioUrl(filename)`; the frontend plan owns the `<audio>` play control and uses `playbackRate = 0.75` (`preservesPitch`) for slow playback, so no second audio file is generated. Workbox `runtimeCaching` caches the audio URLs (`audio-cache`) for offline replay.

**Tech Stack:** Node 18+ ESM scripts, `@google-cloud/text-to-speech` (new devDependency), `@supabase/supabase-js` (already a dependency), Vitest in `node` environment for pure-helper unit tests, `vite-plugin-pwa` / Workbox for runtime caching, TypeScript 5.7 strict.

---

## Cross-plan coordination notes (read first)

- **Git root is `/Users/mathias.bonnet/Zivver`** (umbrella repo); the app lives in `Motamot/motamot-app/`. Run `pnpm` with the working directory at `Motamot/motamot-app`; stage files with their repo-relative paths, e.g. `Motamot/motamot-app/src/services/audio.ts`. **Never run `git add -A` from the root** — the IDE polls `git status` on this large repo and frequently holds `.git/index.lock`. If a commit fails with an `index.lock` error, wait ~2s and retry the exact same `git commit` (the staged index is unchanged). The post-checkout/post-commit hooks warn about missing git-lfs; that warning is harmless.
- **`src/data/sentenceBank.json` and `src/types/bank.ts` are owned by the BANK-PIPELINE plan.** This plan only *reads* `id`/`text` and *writes back* the `audio` field. If `sentenceBank.json` does not yet exist when you run `build-audio.mjs`, the script exits cleanly with a clear message — it does not create the bank. The Vitest unit tests in this plan use small inline fixtures and do **not** require the real bank to exist.
- **Vitest may be added by another plan.** Task 1 adds Vitest *idempotently*: it checks `package.json` for an existing `test` script / `vitest` devDependency and only adds what is missing. If another plan already added Vitest with a `jsdom` environment, this plan's tests still run because each `*.node.test.ts` file declares `// @vitest-environment node` at the top, overriding the global environment per-file.
- **`vite.config.ts` is edited by the FRONTEND plan too** (it adds `'json'` to `workbox.globPatterns`). This plan only **appends one new entry** to the existing `workbox.runtimeCaching` array (the audio rule). Touching different keys keeps the merge clean. If both plans land and a conflict appears in `runtimeCaching`, keep BOTH the frontend's `globPatterns` change AND this plan's appended `audio-cache` array entry.
- **`src/services/audio.ts` is OWNED BY THIS PLAN.** The frontend plan imports `getAudioUrl` from it. If the frontend lands first with a stub, this plan's Task 2 replaces that stub with the real implementation (same export signature `getAudioUrl(filename: string): string`).

---

### Task 1: Add Vitest (node environment) idempotently + a `test` script

**Files:**
- Modify: `Motamot/motamot-app/package.json`
- Create: `Motamot/motamot-app/vitest.config.ts`
- Create: `Motamot/motamot-app/src/services/__smoke__.node.test.ts` (temporary smoke test, deleted at end of task)

- [ ] Check whether Vitest is already present (another plan may have added it):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && node -e "const p=require('./package.json'); console.log('hasVitestDep=' + !!(p.devDependencies&&p.devDependencies.vitest)); console.log('hasTestScript=' + !!(p.scripts&&p.scripts.test));"
  ```
  Expected output on a fresh repo:
  ```
  hasVitestDep=false
  hasTestScript=false
  ```
  - If `hasVitestDep=true` AND `hasTestScript=true`, **skip the install and the package.json edits below** and go straight to creating `vitest.config.ts` (skip that too if it already exists), then the smoke test.

- [ ] If `hasVitestDep=false`, install Vitest as a devDependency (node env is built in; `jsdom` is only needed by the frontend plan's component tests, not here):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm add -D vitest@^3.2.4
  ```
  Expected: pnpm reports `+ vitest` added to devDependencies; `pnpm-lock.yaml` updated.

- [ ] If `hasTestScript=false`, add a `test` script to `package.json`. Change the `scripts` block from:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "evaluate": "node scripts/evaluate-sentences.mjs"
  },
  ```
  to:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "evaluate": "node scripts/evaluate-sentences.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  ```

- [ ] Create `Motamot/motamot-app/vitest.config.ts` ONLY IF it does not already exist (`ls vitest.config.ts` errors → create it). If it exists (another plan made it), do not overwrite — just confirm it has `globals: true`; otherwise create:
  ```ts
  /// <reference types="vitest/config" />
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
    test: {
      globals: true,
      // Default environment is 'node'; component-test files opt into jsdom
      // per-file with `// @vitest-environment jsdom`. Audio service tests
      // opt into node explicitly with `// @vitest-environment node`.
      environment: 'node',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  })
  ```

- [ ] Create a temporary smoke test to prove the runner works `Motamot/motamot-app/src/services/__smoke__.node.test.ts`:
  ```ts
  // @vitest-environment node
  import { describe, it, expect } from 'vitest'

  describe('vitest smoke', () => {
    it('runs in node environment', () => {
      expect(1 + 1).toBe(2)
      expect(typeof process.versions.node).toBe('string')
    })
  })
  ```

- [ ] Run it (expected PASS):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
  ```
  Expected: `✓ src/services/__smoke__.node.test.ts (1 test)` and `Test Files  1 passed`.

- [ ] Delete the smoke test (it has served its purpose):
  ```bash
  rm /Users/mathias.bonnet/Zivver/Motamot/motamot-app/src/services/__smoke__.node.test.ts
  ```

- [ ] Commit (stage exact files; retry once if `index.lock` contention):
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/package.json Motamot/motamot-app/pnpm-lock.yaml Motamot/motamot-app/vitest.config.ts && git commit -m "chore(audio): add Vitest node-env test runner and test script

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 2: `src/services/audio.ts` — pure `getAudioUrl` helper (TDD)

**Files:**
- Create test: `Motamot/motamot-app/src/services/audio.node.test.ts`
- Create: `Motamot/motamot-app/src/services/audio.ts`

This is the runtime contract the FRONTEND plan imports. `getAudioUrl(filename)` returns the public Supabase object URL for the `audio` bucket. The Supabase project ref is the same one already hard-coded in `src/services/supabase.ts` (`gvsbrkvrqjlptzlvbaax`); the public-object URL shape for Supabase Storage is `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<file>`. We hard-code the base (it is a public, non-secret URL, consistent with the existing anon-key file) so the helper stays pure and import-free — no `@supabase/supabase-js` client is needed at runtime for audio.

- [ ] Write the failing test `Motamot/motamot-app/src/services/audio.node.test.ts`:
  ```ts
  // @vitest-environment node
  import { describe, it, expect } from 'vitest'
  import { getAudioUrl, SUPABASE_AUDIO_BASE } from './audio'

  describe('getAudioUrl', () => {
    it('builds a public Supabase object URL for the audio bucket', () => {
      expect(getAudioUrl('sentence-abc123.mp3')).toBe(
        'https://gvsbrkvrqjlptzlvbaax.supabase.co/storage/v1/object/public/audio/sentence-abc123.mp3'
      )
    })

    it('exposes the base as `${SUPABASE_AUDIO_BASE}/${filename}`', () => {
      const filename = 'sentence-xyz.mp3'
      expect(getAudioUrl(filename)).toBe(`${SUPABASE_AUDIO_BASE}/${filename}`)
    })

    it('trims a leading slash on the filename so the URL never doubles slashes', () => {
      expect(getAudioUrl('/sentence-abc123.mp3')).toBe(
        'https://gvsbrkvrqjlptzlvbaax.supabase.co/storage/v1/object/public/audio/sentence-abc123.mp3'
      )
    })

    it('throws on an empty filename rather than returning the bare bucket URL', () => {
      expect(() => getAudioUrl('')).toThrow(/filename/i)
    })
  })
  ```

- [ ] Run it (expected FAIL — module does not exist yet):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio.node.test.ts
  ```
  Expected: failure resolving `./audio` — `Failed to resolve import "./audio"` / `Cannot find module`.

- [ ] Create `Motamot/motamot-app/src/services/audio.ts`:
  ```ts
  /**
   * Runtime audio URL helper for Motamot.
   *
   * Audio clips are pre-generated offline (scripts/build-audio.mjs) and hosted
   * on the public Supabase Storage bucket `audio`. At runtime the app does NOT
   * call any TTS API — it only resolves a static public URL for a clip filename
   * stored on each bank sentence (`sentence.audio`).
   *
   * Slow playback is handled entirely client-side by the frontend's play control
   * via `audioElement.playbackRate = 0.75` with `audioElement.preservesPitch = true`
   * (kept natural). No separate slow-speed audio file is generated.
   */

  // Public, non-secret Supabase Storage base for the `audio` bucket.
  // Same project ref as src/services/supabase.ts (gvsbrkvrqjlptzlvbaax).
  // Public-object URL shape: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<file>
  export const SUPABASE_AUDIO_BASE =
    'https://gvsbrkvrqjlptzlvbaax.supabase.co/storage/v1/object/public/audio'

  /**
   * Resolve the public playback URL for an audio clip filename.
   * @param filename e.g. "sentence-abc123.mp3" (the value of BankSentence.audio)
   * @returns the absolute public Supabase URL for that clip
   */
  export function getAudioUrl(filename: string): string {
    const trimmed = filename.replace(/^\/+/, '')
    if (!trimmed) {
      throw new Error('getAudioUrl: a non-empty audio filename is required')
    }
    return `${SUPABASE_AUDIO_BASE}/${trimmed}`
  }
  ```

- [ ] Run the test (expected PASS):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio.node.test.ts
  ```
  Expected: `✓ src/services/audio.node.test.ts (4 tests)`, `Test Files  1 passed`.

- [ ] Type-check the new file (strict, no emit):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm exec tsc --noEmit
  ```
  Expected: no errors (exit 0). If the frontend plan has not yet landed and pre-existing files reference deleted modules, `tsc -b` could fail on *unrelated* files — restrict to this file's compile correctness by confirming no errors are reported for `src/services/audio.ts`.

- [ ] Commit:
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/services/audio.ts Motamot/motamot-app/src/services/audio.node.test.ts && git commit -m "feat(audio): add getAudioUrl runtime helper + unit tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 3: Audio pipeline pure helpers (filename derivation + skip logic) — TDD

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/audio-naming.mjs`
- Create test: `Motamot/motamot-app/src/services/audio-naming.node.test.ts`

We isolate the *pure* logic of the batch (filename derivation, which sentences still need audio, dedup against an "already uploaded" set) into a separate ESM module so it is unit-testable without any network/GCP/Supabase. The `.mjs` batch in Task 5 imports these helpers. Tests live under `src/` so Vitest's `include` glob (`src/**`) picks them up; they import the `.mjs` module by relative path.

- [ ] Write the failing test `Motamot/motamot-app/src/services/audio-naming.node.test.ts`:
  ```ts
  // @vitest-environment node
  import { describe, it, expect } from 'vitest'
  import {
    audioFilename,
    sentencesNeedingAudio,
  } from '../../scripts/lib/audio-naming.mjs'

  describe('audioFilename', () => {
    it('derives a stable filename from the sentence id', () => {
      expect(audioFilename('abc123')).toBe('sentence-abc123.mp3')
    })

    it('is deterministic for the same id', () => {
      expect(audioFilename('xyz')).toBe(audioFilename('xyz'))
    })

    it('rejects an empty id', () => {
      expect(() => audioFilename('')).toThrow(/id/i)
    })
  })

  describe('sentencesNeedingAudio', () => {
    const sentences = [
      { id: 'a', text: 'Le chat dort.', audio: null },
      { id: 'b', text: 'Le chien court.', audio: 'sentence-b.mp3' },
      { id: 'c', text: 'La fleur pousse.', audio: null },
    ]

    it('returns only sentences whose audio is null/missing and not in the existing set', () => {
      const existing = new Set() // nothing uploaded yet
      const result = sentencesNeedingAudio(sentences, existing)
      expect(result.map((s) => s.id)).toEqual(['a', 'c'])
    })

    it('skips a sentence already present in the existing-uploads set even if its bank audio is null', () => {
      const existing = new Set(['sentence-a.mp3']) // a was uploaded but JSON not yet written back
      const result = sentencesNeedingAudio(sentences, existing)
      expect(result.map((s) => s.id)).toEqual(['c'])
    })

    it('skips a sentence that already has an audio filename in the bank', () => {
      const existing = new Set()
      const result = sentencesNeedingAudio(sentences, existing)
      expect(result.find((s) => s.id === 'b')).toBeUndefined()
    })

    it('skips sentences with empty text (nothing to synthesize)', () => {
      const withEmpty = [...sentences, { id: 'd', text: '   ', audio: null }]
      const result = sentencesNeedingAudio(withEmpty, new Set())
      expect(result.map((s) => s.id)).toEqual(['a', 'c'])
    })
  })
  ```

- [ ] Run it (expected FAIL — module does not exist):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio-naming.node.test.ts
  ```
  Expected: `Failed to resolve import "../../scripts/lib/audio-naming.mjs"`.

- [ ] Create `Motamot/motamot-app/scripts/lib/audio-naming.mjs`:
  ```js
  /**
   * Pure helpers for the offline audio batch (scripts/build-audio.mjs).
   * No I/O, no network — unit-tested in src/services/audio-naming.node.test.ts.
   */

  /**
   * Derive the stable MP3 filename for a sentence id.
   * The filename is tied to the bank's stable `id` so reruns are idempotent and
   * filenames survive bank regeneration (same as the runtime getAudioUrl contract).
   * @param {string} id BankSentence.id
   * @returns {string} e.g. "sentence-abc123.mp3"
   */
  export function audioFilename(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('audioFilename: a non-empty string id is required')
    }
    return `sentence-${id}.mp3`
  }

  /**
   * Given the bank's sentences and the set of filenames already present in the
   * Supabase bucket (or a local checkpoint), return the sentences that still
   * need synthesis+upload. Resumable: reruns only fill gaps.
   * @param {Array<{id:string,text:string,audio:(string|null)}>} sentences
   * @param {Set<string>} existingFilenames filenames already in the bucket
   * @returns {Array<{id:string,text:string,audio:(string|null)}>}
   */
  export function sentencesNeedingAudio(sentences, existingFilenames) {
    const existing = existingFilenames instanceof Set ? existingFilenames : new Set()
    return sentences.filter((s) => {
      if (!s || typeof s.text !== 'string' || s.text.trim() === '') return false
      if (s.audio) return false // already recorded in the bank
      if (existing.has(audioFilename(s.id))) return false // already uploaded
      return true
    })
  }
  ```

- [ ] Run the test (expected PASS):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio-naming.node.test.ts
  ```
  Expected: `✓ src/services/audio-naming.node.test.ts (8 tests)`, `Test Files  1 passed`.

- [ ] Commit:
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/audio-naming.mjs Motamot/motamot-app/src/services/audio-naming.node.test.ts && git commit -m "feat(audio): add pure audio filename + skip-logic helpers with tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 4: Install the Google Cloud TTS SDK + document env setup

**Files:**
- Modify: `Motamot/motamot-app/package.json`
- Create: `Motamot/motamot-app/scripts/AUDIO.md` (operator runbook)

`@supabase/supabase-js` is already a runtime dependency, so no Supabase install is needed. We only add the Google TTS SDK as a **devDependency** (it is offline tooling, never bundled into the app).

- [ ] Install the Google Cloud TTS Node SDK as a devDependency:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm add -D @google-cloud/text-to-speech@^6.0.1
  ```
  Expected: `+ @google-cloud/text-to-speech` added under devDependencies; `pnpm-lock.yaml` updated. (If pnpm reports a newer 6.x is current, accept it — the API used below, `client.synthesizeSpeech`, is stable across 5.x/6.x.)

- [ ] Create the operator runbook `Motamot/motamot-app/scripts/AUDIO.md`:
  ```md
  # Audio batch runbook (one-time, offline)

  `scripts/build-audio.mjs` pre-generates one native-French MP3 per validated bank
  sentence and uploads it to the public Supabase `audio` bucket. The web app never
  calls a TTS API — at runtime it only plays the static Supabase URL resolved by
  `src/services/audio.ts` (`getAudioUrl`).

  **Run this ONCE, locally, AFTER the sentence bank has been generated**
  (`src/data/sentenceBank.json` must exist with sentences). It is idempotent and
  resumable: rerun any time to fill only the gaps.

  ## Prerequisites

  1. A Google Cloud project with the **Cloud Text-to-Speech API** enabled, and a
     **service-account JSON key** downloaded.
  2. A Supabase **service-role key** (Project Settings → API → `service_role`
     secret). This is NOT the anon key — it bypasses Storage RLS so the batch can
     upload. Keep it secret; never commit it; never ship it to the browser.

  ## Environment variables

  ```bash
  # Path to the Google service-account JSON (used by @google-cloud/text-to-speech)
  export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/gcp-tts-service-account.json"

  # Supabase service-role key (server-side only — uploads bypass Storage RLS)
  export SUPABASE_SERVICE_KEY="eyJhbGciOi...the service_role secret..."

  # Optional overrides (defaults shown):
  export TTS_VOICE="fr-FR-Chirp3-HD-Charon"   # male; female alt: fr-FR-Chirp3-HD-Kore
  export TTS_SPEAKING_RATE="1.0"               # 1.0 = native pace; slow playback is client-side
  export AUDIO_CONCURRENCY="6"                 # parallel synth+upload (cap 5–10)
  ```

  ## Run

  ```bash
  cd Motamot/motamot-app
  node scripts/build-audio.mjs
  ```

  The script:
  1. Reads `src/data/sentenceBank.json` (exits cleanly if absent or empty).
  2. Lists existing objects in the Supabase `audio` bucket (creates it public if missing).
  3. Synthesizes + uploads only sentences with no audio yet (idempotent/resumable).
  4. Writes the `audio` filename back into `sentenceBank.json` and saves it.
  5. Checkpoints progress to `audio-checkpoint.json` after each batch.

  **Commit the modified `src/data/sentenceBank.json`** afterward (the `audio` fields
  are now populated). Do NOT commit `audio-checkpoint.json` (gitignored) or any key.

  ## Voice & format

  - Voice: Google Cloud TTS **Chirp 3 HD**, native `fr-FR`
    (`fr-FR-Chirp3-HD-Charon` male / `fr-FR-Chirp3-HD-Kore` female). Verify the voice
    is listed for your region before running: `gcloud ml speech ...` or the
    `client.listVoices({ languageCode: 'fr-FR' })` snippet at the bottom of
    `build-audio.mjs` (commented). Chirp 3 HD is the locked choice; **ElevenLabs
    Multilingual v2** is the documented swappable runner-up (replace `synthesizeOne`);
    **OpenAI TTS is excluded** — its French is English-accented.
  - Output: `MP3`, mono, 24000 Hz, ~64 kbps (set in `audioConfig`).

  ## Cost / size note

  For ~1000–1200 clips of short A1–B1 sentences: roughly **50–120 MB** total on
  Supabase storage. Google Cloud TTS Chirp 3 HD bills per character; the first
  1M characters/month of Chirp 3 HD are on the free tier and short sentences total
  well under that for a single ~1.2k-sentence run — expect **free to ~$7** one-time.
  **Verify current Chirp 3 HD fr-FR pricing + free-tier in the GCP console before
  running**, and run a small calibration first (see "Dry run").

  ## Dry run / calibration

  ```bash
  AUDIO_LIMIT=20 node scripts/build-audio.mjs   # synth+upload only the first 20 missing
  ```
  Listen to a few clips from the bucket, confirm the accent/pace, then run the full batch.
  ```

- [ ] Add a gitignore entry for the checkpoint so it never gets committed. Check the existing gitignore first:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && ([ -f .gitignore ] && grep -q "audio-checkpoint.json" .gitignore && echo "already-ignored" || (printf '\n# audio batch (offline) — local checkpoint, never commit\naudio-checkpoint.json\n' >> .gitignore && echo "added"))
  ```
  Expected: `added` (or `already-ignored` if a prior run added it).

- [ ] Commit:
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/package.json Motamot/motamot-app/pnpm-lock.yaml Motamot/motamot-app/scripts/AUDIO.md Motamot/motamot-app/.gitignore && git commit -m "chore(audio): add Google TTS SDK devDep + audio batch runbook

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 5: `scripts/build-audio.mjs` — synthesize, upload, write back (idempotent/resumable)

**Files:**
- Create: `Motamot/motamot-app/scripts/build-audio.mjs`

This is offline tooling. The *pure* parts (`audioFilename`, `sentencesNeedingAudio`) are already unit-tested in Task 3 and are imported here, so this task is impl-only (no new unit test for the network-bound batch — its testable logic lives in `lib/audio-naming.mjs`). The script: loads the bank → ensures the public bucket exists → lists existing objects → computes the gap → synthesizes via Google Chirp 3 HD with a concurrency cap + exponential backoff → uploads via the Supabase service-role client → writes filenames back into the bank → checkpoints.

- [ ] Create `Motamot/motamot-app/scripts/build-audio.mjs`:
  ```js
  #!/usr/bin/env node

  /**
   * Offline audio batch for Motamot (ONE-TIME, run locally after the bank exists).
   *
   * Reads src/data/sentenceBank.json, synthesizes one native-French MP3 per
   * sentence still missing audio (Google Cloud TTS Chirp 3 HD), uploads each clip
   * to the public Supabase `audio` bucket, and writes the audio filename back into
   * the bank JSON. Idempotent & resumable: reruns only fill gaps.
   *
   * Env:
   *   GOOGLE_APPLICATION_CREDENTIALS  path to GCP service-account JSON (TTS)
   *   SUPABASE_SERVICE_KEY            Supabase service_role secret (uploads bypass RLS)
   *   TTS_VOICE                       default 'fr-FR-Chirp3-HD-Charon'
   *   TTS_SPEAKING_RATE               default '1.0'
   *   AUDIO_CONCURRENCY               default '6'
   *   AUDIO_LIMIT                     optional cap on how many to process this run
   *
   * Usage:
   *   cd Motamot/motamot-app && node scripts/build-audio.mjs
   *
   * See scripts/AUDIO.md for the full runbook.
   */

  import { readFile, writeFile } from 'node:fs/promises'
  import { existsSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  import path from 'node:path'
  import textToSpeech from '@google-cloud/text-to-speech'
  import { createClient } from '@supabase/supabase-js'
  import { audioFilename, sentencesNeedingAudio } from './lib/audio-naming.mjs'

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const BANK_PATH = path.resolve(__dirname, '../src/data/sentenceBank.json')
  const CHECKPOINT_PATH = path.resolve(__dirname, '../audio-checkpoint.json')

  // Same public project ref as src/services/supabase.ts / src/services/audio.ts
  const SUPABASE_URL = 'https://gvsbrkvrqjlptzlvbaax.supabase.co'
  const AUDIO_BUCKET = 'audio'

  const VOICE = process.env.TTS_VOICE || 'fr-FR-Chirp3-HD-Charon'
  const SPEAKING_RATE = parseFloat(process.env.TTS_SPEAKING_RATE || '1.0')
  const CONCURRENCY = Math.min(10, Math.max(1, parseInt(process.env.AUDIO_CONCURRENCY || '6', 10)))
  const LIMIT = process.env.AUDIO_LIMIT ? parseInt(process.env.AUDIO_LIMIT, 10) : Infinity

  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_KEY (service_role secret) is required.')
    process.exit(1)
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS (path to GCP service-account JSON) is required.')
    process.exit(1)
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  /** Synthesize one sentence to an MP3 Buffer with exponential backoff. */
  async function synthesizeOne(tts, text, attempt = 0) {
    try {
      const [response] = await tts.synthesizeSpeech({
        input: { text },
        voice: { languageCode: 'fr-FR', name: VOICE },
        audioConfig: {
          audioEncoding: 'MP3',
          sampleRateHertz: 24000,
          speakingRate: SPEAKING_RATE,
          // mono is the default for synthesizeSpeech; MP3 ~64kbps at 24kHz
        },
      })
      if (!response.audioContent) throw new Error('empty audioContent')
      return Buffer.from(response.audioContent)
    } catch (err) {
      if (attempt >= 5) throw err
      const backoff = Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500)
      console.warn(`  synth retry ${attempt + 1} in ${backoff}ms (${err.message})`)
      await sleep(backoff)
      return synthesizeOne(tts, text, attempt + 1)
    }
  }

  /** Upload one MP3 Buffer to the public audio bucket (upsert). */
  async function uploadOne(supabase, filename, buffer, attempt = 0) {
    const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(filename, buffer, {
      contentType: 'audio/mpeg',
      cacheControl: '31536000', // 1 year — clips are immutable per stable id
      upsert: true,
    })
    if (error) {
      if (attempt >= 5) throw error
      const backoff = Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500)
      console.warn(`  upload retry ${attempt + 1} in ${backoff}ms (${error.message})`)
      await sleep(backoff)
      return uploadOne(supabase, filename, buffer, attempt + 1)
    }
  }

  /** List every filename currently in the audio bucket (resume support). */
  async function listExisting(supabase) {
    const existing = new Set()
    const pageSize = 1000
    let offset = 0
    for (;;) {
      const { data, error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .list('', { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })
      if (error) {
        // Bucket may not exist yet on the very first run — treat as empty.
        if (/not found/i.test(error.message)) return existing
        throw error
      }
      if (!data || data.length === 0) break
      for (const obj of data) existing.add(obj.name)
      if (data.length < pageSize) break
      offset += pageSize
    }
    return existing
  }

  async function ensureBucket(supabase) {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (buckets && buckets.some((b) => b.name === AUDIO_BUCKET)) return
    const { error } = await supabase.storage.createBucket(AUDIO_BUCKET, {
      public: true,
      allowedMimeTypes: ['audio/mpeg'],
      fileSizeLimit: '5MB',
    })
    if (error && !/already exists/i.test(error.message)) throw error
    console.log(`Created public bucket '${AUDIO_BUCKET}'.`)
  }

  /** Run an async worker over items with a fixed concurrency. */
  async function pool(items, size, worker) {
    let index = 0
    const results = []
    const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
      while (index < items.length) {
        const i = index++
        results[i] = await worker(items[i], i)
      }
    })
    await Promise.all(runners)
    return results
  }

  async function main() {
    if (!existsSync(BANK_PATH)) {
      console.error(`No sentence bank at ${BANK_PATH}. Generate the bank first; nothing to do.`)
      process.exit(0)
    }
    const bank = JSON.parse(await readFile(BANK_PATH, 'utf8'))
    if (!Array.isArray(bank.sentences) || bank.sentences.length === 0) {
      console.error('Sentence bank has no sentences; nothing to do.')
      process.exit(0)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
    const ttsClient = new textToSpeech.TextToSpeechClient()

    await ensureBucket(supabase)
    const existing = await listExisting(supabase)
    console.log(`Bucket '${AUDIO_BUCKET}' already has ${existing.size} clip(s).`)

    let todo = sentencesNeedingAudio(bank.sentences, existing)
    if (Number.isFinite(LIMIT)) todo = todo.slice(0, LIMIT)
    console.log(`${todo.length} sentence(s) need audio (voice=${VOICE}, rate=${SPEAKING_RATE}, conc=${CONCURRENCY}).`)

    // Index by id so write-back is O(1).
    const byId = new Map(bank.sentences.map((s) => [s.id, s]))
    const checkpoint = existsSync(CHECKPOINT_PATH)
      ? JSON.parse(await readFile(CHECKPOINT_PATH, 'utf8'))
      : { done: [], failed: [] }
    const doneSet = new Set(checkpoint.done)

    let processed = 0
    let failures = 0
    await pool(todo, CONCURRENCY, async (s) => {
      const filename = audioFilename(s.id)
      try {
        const mp3 = await synthesizeOne(ttsClient, s.text)
        await uploadOne(supabase, filename, mp3)
        const target = byId.get(s.id)
        if (target) target.audio = filename // write back into the bank
        doneSet.add(s.id)
        processed++
        if (processed % 25 === 0) {
          // periodic checkpoint + bank flush so a crash loses at most ~25 clips
          checkpoint.done = [...doneSet]
          await writeFile(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2))
          await writeFile(BANK_PATH, JSON.stringify(bank, null, 2) + '\n')
          console.log(`  ...${processed}/${todo.length} done (checkpointed)`)
        }
      } catch (err) {
        failures++
        checkpoint.failed.push({ id: s.id, error: String(err.message || err) })
        console.error(`  FAILED ${s.id}: ${err.message || err}`)
      }
    })

    // Final flush.
    checkpoint.done = [...doneSet]
    await writeFile(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2))
    await writeFile(BANK_PATH, JSON.stringify(bank, null, 2) + '\n')

    const withAudio = bank.sentences.filter((s) => s.audio).length
    console.log(`\nDone. Processed ${processed}, failed ${failures}.`)
    console.log(`Bank now has audio for ${withAudio}/${bank.sentences.length} sentences.`)
    console.log('Next: commit the modified src/data/sentenceBank.json.')

    // --- To enumerate available fr-FR Chirp 3 HD voices, uncomment: ---
    // const [{ voices }] = await ttsClient.listVoices({ languageCode: 'fr-FR' })
    // console.log(voices.filter((v) => v.name.includes('Chirp3-HD')).map((v) => v.name))
  }

  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
  ```

- [ ] Lint the new script to confirm it parses cleanly (ESLint covers `.mjs` via flat config; if the existing config does not include scripts, this is a no-op — confirm at least the file parses with node):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && node --check scripts/build-audio.mjs && echo "PARSE_OK"
  ```
  Expected: `PARSE_OK` (syntax valid).

- [ ] Re-run the pure-helper tests to confirm the import path from the batch still resolves the shared lib (regression guard):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio-naming.node.test.ts
  ```
  Expected: `✓ src/services/audio-naming.node.test.ts (8 tests)`.

- [ ] Commit:
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/build-audio.mjs && git commit -m "feat(audio): add offline build-audio batch (Chirp 3 HD -> Supabase, resumable)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 6: PWA offline caching — append an `audio-cache` runtimeCaching rule in `vite.config.ts`

**Files:**
- Modify: `Motamot/motamot-app/vite.config.ts`

**Coordination:** The FRONTEND plan edits the SAME file's `workbox.globPatterns` to add `'json'`. This task ONLY appends a new entry to `workbox.runtimeCaching` (after the existing `gstatic-fonts-cache` entry). Different keys → clean merge. If both land and git reports a conflict in `runtimeCaching`, keep BOTH the frontend's `globPatterns` `'json'` and this `audio-cache` array entry.

- [ ] Read the current `vite.config.ts` to locate the exact `gstatic-fonts-cache` block (the last entry in `runtimeCaching`):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && grep -n "gstatic-fonts-cache\|runtimeCaching\|]" vite.config.ts | head -20
  ```
  Expected: shows the `gstatic-fonts-cache` block ends with a `}` then the `runtimeCaching` array closes with `]`.

- [ ] Apply this exact edit — replace the closing of the `gstatic-fonts-cache` entry (the existing text):
  ```ts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
  ```
  with (adds the `audio-cache` entry as a new array element — note the comma after the gstatic block):
  ```ts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Pre-generated native-French sentence audio hosted on the public
            // Supabase 'audio' bucket. Clips are immutable per stable sentence id,
            // so CacheFirst is ideal — first play caches, replays + offline are instant.
            urlPattern: /^https:\/\/gvsbrkvrqjlptzlvbaax\.supabase\.co\/storage\/v1\/object\/public\/audio\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 1500, // headroom above the ~1,200-clip bank
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              rangeRequests: true // <audio> may issue Range requests
            }
          }
        ]
  ```

- [ ] Confirm the config still parses / builds the SW (type-check the config and run a production build so vite-plugin-pwa validates the workbox config). If the frontend plan has not yet deleted `services/api.ts`/`Settings.tsx`, a full `pnpm build` may fail on those unrelated files — in that case validate just the config syntax with `tsc`:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm exec tsc --noEmit vite.config.ts 2>&1 | head -5; echo "---try build---"; pnpm build 2>&1 | tail -15
  ```
  Expected: `vite.config.ts` itself reports no type errors; if `pnpm build` succeeds it prints the generated `sw.js`/`workbox-*.js` line confirming the SW built. If `pnpm build` fails ONLY on files owned by the frontend plan (e.g. `src/services/api.ts`, `src/components/Settings.tsx`), that is expected pre-merge — the config change is still valid. Note this in your commit and re-verify `pnpm build` once the frontend plan has landed.

- [ ] Commit:
  ```bash
  cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/vite.config.ts && git commit -m "feat(audio): cache Supabase audio clips offline via Workbox audio-cache rule

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 7: Final verification — tests, types, lint, and post-merge integration check

**Files:**
- None (verification only).

- [ ] Run the full audio test suite (all this plan's pure tests):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test src/services/audio.node.test.ts src/services/audio-naming.node.test.ts
  ```
  Expected: `Test Files  2 passed`, `Tests  12 passed`.

- [ ] Type-check the files this plan owns:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm exec tsc --noEmit src/services/audio.ts && echo "TYPES_OK"
  ```
  Expected: `TYPES_OK`.

- [ ] Lint this plan's TS files (the `.mjs` batch is offline tooling; `.test.ts`/`audio.ts` are linted):
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm exec eslint src/services/audio.ts src/services/audio.node.test.ts src/services/audio-naming.node.test.ts && echo "LINT_OK"
  ```
  Expected: `LINT_OK` (no errors). If the global eslint flat config errors on Vitest globals, confirm `globals: true` in `vitest.config.ts` plus the explicit `import { describe, it, expect } from 'vitest'` in each test file resolves it (we import explicitly, so no global is required).

- [ ] **Post-merge integration check (run AFTER the frontend + bank plans have landed):** confirm a full production build succeeds and the SW includes the audio runtime route, and that the frontend imports `getAudioUrl` from this plan's file:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm build 2>&1 | tail -10 && grep -rn "getAudioUrl" src/ | grep -v "audio.ts\|audio.node.test.ts"
  ```
  Expected: build completes; the `grep` shows the frontend's play control importing `getAudioUrl` from `services/audio`. If the bank has been audio-batched, also confirm at least one sentence has a non-null `audio`:
  ```bash
  cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && node -e "const b=require('./src/data/sentenceBank.json'); console.log('withAudio=' + b.sentences.filter(s=>s.audio).length + '/' + b.sentences.length);" 2>/dev/null || echo "bank not present yet — run scripts/build-audio.mjs after bank generation"
  ```
  Expected: `withAudio=N/M` after the batch has been run, or the not-present message before it.

- [ ] No commit (verification only). If any check fails on files THIS plan owns, fix and re-commit per the relevant task; failures isolated to other plans' files are expected pre-merge.

---

## Summary of artifacts this plan creates/changes

| Path | Action | Owner |
|---|---|---|
| `Motamot/motamot-app/package.json` | Modify (Vitest + `test` script; `@google-cloud/text-to-speech` devDep) | this plan (idempotent w/ others) |
| `Motamot/motamot-app/vitest.config.ts` | Create (only if absent) | this plan (shared) |
| `Motamot/motamot-app/src/services/audio.ts` | Create (`getAudioUrl`, `SUPABASE_AUDIO_BASE`) | **this plan** (frontend imports) |
| `Motamot/motamot-app/src/services/audio.node.test.ts` | Create | this plan |
| `Motamot/motamot-app/scripts/lib/audio-naming.mjs` | Create (pure helpers) | this plan |
| `Motamot/motamot-app/src/services/audio-naming.node.test.ts` | Create | this plan |
| `Motamot/motamot-app/scripts/build-audio.mjs` | Create (offline batch) | this plan |
| `Motamot/motamot-app/scripts/AUDIO.md` | Create (runbook) | this plan |
| `Motamot/motamot-app/.gitignore` | Modify (ignore `audio-checkpoint.json`) | this plan |
| `Motamot/motamot-app/vite.config.ts` | Modify (append `audio-cache` runtimeCaching) | shared w/ frontend |
| `Motamot/motamot-app/src/data/sentenceBank.json` | Modify at RUN TIME (write back `audio`) | bank plan owns the file |
