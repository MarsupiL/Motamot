# Motamot — Quality & Experience Overhaul

**Date:** 2026-06-15
**Branch:** `feature/quality-and-experience-overhaul`
**Status:** Design approved, pending spec review

## Goal

Make Motamot a polished, public, zero-setup French learning PWA where:

1. Every sentence a learner sees is **grammatically and semantically correct** (the top priority).
2. Sentences carry **a pinch of humor**, kept light and learner-appropriate.
3. The interface feels **modern and slick** while deepening the **hand-written chalk on a dark-green blackboard** classroom feeling.
4. Each sentence is **read aloud in a proper native French accent**.

The app stays on static GitHub Pages (no backend) and must work offline as a PWA.

## The core decision: a pre-generated, individually-validated sentence bank

Because the app is going public and GitHub Pages is static, asking every visitor for their own Groq API key is a dealbreaker, and a live in-browser LLM cannot *guarantee* correctness anyway. Llama 3.3 70B at temperature is the exact source of the agreement/elision slips and "the rain makes a mistake" nonsense we are trying to escape.

Instead, we **generate the sentences once, offline, validate each one individually, and ship only the passing sentences as static JSON** bundled with the app. At runtime there is no LLM call, no API key, no network dependency — just instant, offline, individually-validated content. This is the only approach that gives a real *per-sentence* correctness guarantee on static hosting.

The same philosophy applies to the read-aloud audio: a finite bank means we can pre-generate one high-quality native French TTS clip per sentence, host the MP3s on Supabase (next to the existing images), and the app just plays a static URL — same polished voice for every visitor, cached for offline.

## Game mechanic: sentence-first reveal

The current "10 random unrelated words → AI scrambles to use them" flow is replaced by a tighter loop built around each validated sentence:

1. Pick a validated sentence (selection logic below).
2. Reveal its **content words one at a time** as the learner taps — each shown as large chalk handwriting with an image (when one exists) or a short English gloss, a part-of-speech / gender chip, written on letter-by-letter.
3. After the last word, the **full sentence "writes itself"** on the board with a hand-drawn underline.
4. The sentence is **read aloud** in a native French accent (auto, with a replay control and a slower-playback option).
5. Tap to advance to the next round.

The words tapped *are* the words in the sentence — the payoff is guaranteed to connect to what was just practiced. Rounds have a variable number of content words (~4–8).

### Designed for the no-image common case

Only 50 of 249 nouns have illustrations, and zero verbs/adjectives/adverbs do. So the reveal's spine is **typography**, not images: a big chalk word + a POS/gender chip + the write-on animation. Images are a garnish for the ~50 illustrated anchor nouns. The "Image non disponible" placeholder box is **never** shown mid-reveal — when there is no image, typography (and the English gloss) carries the moment.

## Components / architecture

### 1. Build-time: the sentence-bank pipeline (new, offline, committed artifact)

A new committed Node script `scripts/build-sentence-bank.mjs` (extending the existing `evaluate-sentences.mjs`) produces `src/data/sentenceBank.json`. The app build simply imports that JSON — it **never** generates during CI.

**Generation model:** Claude **Opus 4.8** (the Anthropic SDK is already a devDependency — zero new infra). Validation is a *separate* Claude Sonnet 4.6 call so nothing self-grades. (Fix the stale `claude-sonnet-4-6-20250514` ID in the existing script to `claude-sonnet-4-6`.)

**Image-seeded generation (not prompt-hinted):** for each request, pick 1–2 under-quota illustrated nouns from the 50-image set as **mandatory anchors** plus a theme and a comedic mechanism, generate several candidates at high creative effort, then **programmatically verify the anchor lemma actually appears** before accepting. A per-image quota (~15–25 sentences each) guarantees every illustrated noun gets coverage, so the illustrated reveal actually shows pictures rather than drifting toward imageless abstract nouns.

**Validation funnel (per candidate, in order):**
1. Image-seeded generation (mandatory anchors + theme + comedic mechanism, several candidates, 2 few-shot exemplars).
2. Cheap mechanical lint (no leftover English/Spanish stopwords, balanced apostrophes, sentence-final punctuation, per-CEFR word-count ceiling, capitalization).
3. **Two-stage dedup *before* paying for validation** — normalized exact-match, then near-dup via ~0.8 token-overlap within the anchor-lemma bucket.
4. Claude **correctness gate** — grammar / semantics / french-only / simplicity. Simplicity ceiling lowered from 25 words to **~8–12 (A1/A2), ~12–16 (B1)**. Recycle the `corrected_sentence` field on near-misses by re-validating the correction.
5. **NEW humor gate** (skeptical comedy-editor prompt — FAIL anything bland/neutre) and **NEW safety gate** (denylist: alcohol/drugs/tobacco, body-shaming, marital/in-law tropes, ethnic/national/religious/gender stereotypes, violence, bathroom humor; humor stays on self / pets / objects / weather), as a separate Claude call given only the sentence.
6. Require **all six axes PASS**.
7. Programmatic anchor-presence check + offline token-to-image mapping (confirm which surface token realizes the known anchor lemma); bake `{lemma, image, start, end}` into that token.
8. Append to JSONL + update manifest/coverage counters; checkpoint.

**Resumability:** stream each candidate+verdict to append-only JSONL (not in-memory), checkpoint after each batch (reuse the `generation-checkpoint.json` pattern), concurrency cap ~5–10 with exponential backoff. A crash at sentence 5,900 resumes rather than restarting.

**Calibration first:** run the harness at count≈200 to measure real per-axis PASS rate (now including humor+safety) and per-sentence cost, then extrapolate the full run before committing.

**Human safety net:** a one-time 100% human spot-read of the final finite bank before release — the only true safety net for a permanent, screenshot-able, child-accessible public bank. Add a lightweight "report this sentence" affordance (prefilled GitHub issue) feeding the next regeneration.

**Target size:** ~800–1,200 validated sentences for v1 (600 MVP floor; expandable past 1,500 via the append-only build). Lean encoding gzips to <100KB — bundle directly and SW-precache; no theme-splitting/lazy-load for v1.

**Bank JSON shape:**
```
{
  schemaVersion, generatorModel, generatorVersion,
  validatorModel, validatorVersion, generatedAt,
  sentences: [
    {
      id,                       // stable — survives regeneration so localStorage 'seen' state persists
      text,
      level: 'A1' | 'A2' | 'B1',
      anchors: ['chat'],
      theme,
      humorMechanism,
      audio: 'sentence-<id>.mp3',   // Supabase clip filename (null until audio batch runs)
      tokens: [
        {
          surface, lemma,
          type: 'noun'|'verb'|'adjective'|'adverb'|'function',
          gender: 'm'|'f'|null,
          image: 'chat.png'|null,
          en: 'cat'|null,
          start, end,            // char offsets into text
          isContent: bool,       // shown during tap-through
          isTarget: bool         // a tracked learning lemma
        }
      ],
      validation: { grammar, semantics, frenchOnly, simplicity, humor, safety }  // all true
    }
  ]
}
```
Tokens reference `text` by char offset; the reveal consumes `tokens` directly (which words to reveal, in order, with which image/gloss), so runtime needs **zero** lookup into `frenchWords.ts` and **zero** lemmatization. Dedupe `nouns[]` by lemma (first-with-image wins) and assert every referenced lemma resolves at build time.

### 2. Build-time: the audio batch (new, offline)

A new script `scripts/build-audio.mjs` generates one MP3 per sentence via **Google Cloud TTS Chirp 3 HD** (a native fr-FR voice, e.g. Charon/Kore), MP3 mono 24kHz ~64kbps (~50–120MB total for the bank), and uploads to a Supabase `audio` bucket. Writes the `audio` filename back into the bank JSON. ElevenLabs Multilingual v2 is the documented runner-up; OpenAI TTS is excluded (English-accented French).

### 3. Runtime: the React app

**Game state — `hooks/useGameLoop.ts` (rewritten):** select a bank sentence → derive its tap-through content tokens → cycle through them on tap → reveal the full sentence → trigger audio. No `isLoading`/`error`/key-gate states (no runtime LLM). Selection: draw from a shuffled bag of unseen sentence IDs, hard no-repeat within a session, reshuffle only when the pool is exhausted. Bias selection toward the learner's most-due target lemmas within their unlocked CEFR band.

**Spaced repetition (lemma is the learning unit):** track exposure **per-lemma** in localStorage (Leitner buckets: new / learning / known); require each beginner-relevant lemma to appear across 2–3+ distinct carrier sentences; optionally blank the target word in the final reveal for active recall. Gate new users into A1/A2, unlock B1 as known-lemma count grows. Invisible and automatic — no settings UI. This defeats both the "memorize whole strings" flashcard trap and repeat-staleness without a backend.

**Display — `components/GameBoard.tsx` + new reveal pieces:** integrate `motion` via `LazyMotion` + `domAnimation` + the `m` component (hits the ~6KB target). Per-letter write-on, with **each word wrapped in an `inline-block` / `white-space:nowrap` span so whole words never break across lines**. `AnimatePresence` eraser-sweep + chalk-dust transition between words (stable key per word). Hand-drawn SVG underline on the final sentence. All animation gated behind `useReducedMotion` (+ a CSS `prefers-reduced-motion` backstop) which renders the full sentence instantly.

**Audio — new `components/SentencePlayer` (or hook):** HTML5 `<audio>` playing the Supabase clip; auto-play after the sentence finishes writing; replay button; slower-playback toggle via `playbackRate = 0.75` (`preservesPitch` keeps it natural — no second audio file). Service-worker runtime cache (Workbox `CacheFirst`/stale-while-revalidate) on the audio URLs for offline replay.

**Images — `components/WordImage.tsx` + offline fix:** bundle the ~51 PNGs from `generated-images/` into `public/word-images/`, change `getImageUrl` to `${import.meta.env.BASE_URL}word-images/${name}`, **delete `services/supabase.ts`** and the `@supabase/supabase-js` dependency (images now local). `useImagePreloader` reworked to preload exactly the current round's known image tokens (not 3 random nouns).

**Removed:** `services/api.ts`, the Groq fetch + key gating, `Settings.tsx` + localStorage key helpers, the gear button + `showSettings` state, and the `GroqMessage`/`GroqChoice`/`GroqResponse` types. (User chose: delete entirely.)

### 4. Visual design

Keep **Playwrite FR Trad** chalk-cursive (user preference), bundled locally as woff2 so first offline load doesn't reflow. Chalk text effect via stacked text-shadows (+ an optional SVG `feTurbulence` roughen on the single hero word only). Polish: chalk tray with sticks, ghost of the previous erased word, vignette over the existing grain, tap-dust feedback. The **final sentence is rendered in a higher-contrast, legible treatment (≥4.5:1 WCAG AA)** and stays selectable real text (not canvas) for screen readers.

## Data flow

```
BUILD TIME (offline, committed):
  build-sentence-bank.mjs → Claude Opus 4.8 (image-seeded gen)
    → 6-axis Claude validation → dedup → bake tokens
    → src/data/sentenceBank.json  (committed)
  build-audio.mjs → Google Chirp 3 HD → Supabase audio bucket
    → writes audio filenames back into sentenceBank.json
  [human spot-read of final bank]

RUNTIME (static, offline-capable):
  app imports sentenceBank.json (precached)
  useGameLoop: select unseen sentence (LRU + due-lemma bias)
    → reveal content tokens (image | gloss + chalk write-on)
    → write full sentence + underline
    → play Supabase MP3 (SW-cached) ± slow playback
  localStorage: seen sentence IDs + per-lemma Leitner buckets
```

## Error handling

- **Missing image:** show typography only (never a placeholder box).
- **Missing/failed audio:** silent degrade — show a disabled/absent play control; the visual reveal still completes. (Optional Web Speech API last-resort live fallback, quality permitting.)
- **Empty/exhausted unseen pool:** reshuffle the full bank and continue.
- **Bank fails to load:** should not happen (bundled + precached); if it does, a single static fallback sentence.
- **Build-script crash:** resume from JSONL checkpoint.

## Testing

- **Bank pipeline:** count≈200 calibration run reporting per-axis PASS rates and cost; assert every shipped sentence has all six validation axes true, every anchor lemma resolves, every token's char offsets are valid, and per-image quota is met. Schema validation on `sentenceBank.json`.
- **Token mapping:** unit tests that the baked offset spans exactly reconstruct `text` and that image/gloss tokens point at real assets.
- **Frontend:** the write-on never splits a word across lines (snapshot/visual check in-browser with Playwrite, since per-letter spans can break cursive joining — fall back to per-word opacity or a clip-path sweep if joining breaks); reduced-motion renders instantly; offline cold-load shows images + plays cached audio; no-repeat-within-session holds.
- **Accessibility:** final sentence contrast ≥4.5:1; sentence is selectable text; audio control keyboard-reachable.
- Type-check (`tsc --noEmit`, strict) and `pnpm lint` clean after each change.

## Risks to watch

1. **Yield collapse** — correctness + A2/B1 + real-scene + funny + safe is a narrow space; surviving candidates may be 5–15% per generation. Instrument the funnel; do not lower the bar to hit a quota (600 funny > 1,200 filler).
2. **Bland-but-valid** sentences dominating if the humor gate is lenient — keep the comedy-editor gate ruthless; confirm via human spot-read.
3. **Permanent unsafe content** in a public child-accessible bank with no runtime kill switch — safety gate + 100% human spot-read are mandatory; add a "report sentence" affordance.
4. **Cursive glyph joining** may break when Playwrite letters are split into per-letter spans — test in-browser; fall back to per-word reveal / clip-path sweep.
5. **Legibility/contrast** of thin cursive + chalk shadow on dark green — render the sentence at AA contrast, bundle the woff2 locally.
6. **motion bundle bloat** — use `LazyMotion` + `domAnimation` + `m`, stable keys for clean `AnimatePresence` exits.
7. **Bank rot** — stamp schema/generator/validator versions and keep stable sentence IDs so localStorage survives regeneration and a validator upgrade can re-audit.

## Out of scope for v1

- Live LLM generation of novel sentences (deleted; the bank is the product).
- Theme-splitting / lazy-loading the bank (bundle is small enough).
- Full SM-2 spaced repetition (Leitner is enough offline).
- Multi-voice / user-selectable TTS voice.
- Accounts / cross-device sync (localStorage only).

## Decisions locked by the user

- Generation: pre-generated, individually-validated static bank. ✓
- Mechanic: sentence-first reveal. ✓
- Font: keep Playwrite FR Trad. ✓
- Animation feel: approved (per-letter write-on, eraser-sweep + dust, underline, chalk tray); whole words must not break across lines. ✓
- Voice: pre-generated native French TTS on Supabase. ✓
- Groq/API-key path: **delete entirely.** ✓
- Bank size: **~800–1,200 sentences.** ✓
- Generation model: **Claude Opus 4.8** (separate Sonnet 4.6 validator). ✓
- TTS: **Google Cloud TTS Chirp 3 HD**, fr-FR, MP3; client-side slow playback. ✓
- New feature branch; nothing pushed without approval. ✓
