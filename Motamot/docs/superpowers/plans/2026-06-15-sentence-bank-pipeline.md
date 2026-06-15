# Sentence-Bank Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline, resumable `scripts/build-sentence-bank.mjs` pipeline that image-seeds Claude Opus 4.8 generation, runs a six-axis validation funnel (mechanical lint, two-stage dedup, Claude Sonnet 4.6 correctness, humor, safety), bakes offset-accurate tokens, and assembles the committed `src/data/sentenceBank.json` that the frontend and audio plans consume.

**Architecture:** A pure-functional core (prompt construction, response parsing, mechanical lint, dedup, token-baking — all unit-tested with Vitest in a node environment) wrapped by an impure orchestration layer (Anthropic SDK calls, append-only JSONL streaming, checkpoint/resume, concurrency cap with exponential backoff). The shared TypeScript data contract lives in `src/types/bank.ts`; the script is `.mjs` (matches the existing `scripts/` convention) and imports word data by re-deriving it (frenchWords.ts is `.ts`, so the script reads the literal arrays via a small parser-free re-export module). The app build NEVER runs generation — it only imports the committed JSON.

**Tech Stack:** Node 20+ ESM, `@anthropic-ai/sdk` (^0.95.0, already a devDependency), Vitest (node environment, added in Task 2), TypeScript 5.7 strict for the type file only.

---

### Task 1: Create the shared data-contract type file `src/types/bank.ts`

This is the SHARED type file. The frontend and audio plans import from it. Own it exactly as specified in the contract.

**Files:**
- Create: `Motamot/motamot-app/src/types/bank.ts`

Steps:

- [ ] Create the file with the exact contract interfaces:

```ts
// src/types/bank.ts
// Shared data contract for the pre-generated, individually-validated sentence bank.
// Owned by the bank-pipeline plan; imported by the frontend and audio plans.
// Do NOT change field names or types without coordinating all three plans.

export type BankLevel = 'A1' | 'A2' | 'B1';

export type BankTokenType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'function';

export type BankGender = 'm' | 'f' | null;

export interface BankToken {
  /** Exact substring of the sentence text: text.slice(start, end) === surface */
  surface: string;
  lemma: string;
  type: BankTokenType;
  gender: BankGender;
  /** PNG filename in public/word-images/ (e.g. 'chat.png'), or null. */
  image: string | null;
  /** Short English gloss for content words; null for function words. */
  en: string | null;
  /** Char offset into text where surface begins. */
  start: number;
  /** Char offset into text where surface ends (exclusive). */
  end: number;
  /** Shown during the tap-through reveal. */
  isContent: boolean;
  /** A tracked learning lemma (spaced repetition unit). */
  isTarget: boolean;
}

export interface BankValidation {
  grammar: boolean;
  semantics: boolean;
  frenchOnly: boolean;
  simplicity: boolean;
  humor: boolean;
  safety: boolean;
}

export interface BankSentence {
  /** Stable ID — survives regeneration so localStorage 'seen' state persists. */
  id: string;
  text: string;
  level: BankLevel;
  /** Illustrated-noun lemmas this sentence was seeded from. */
  anchors: string[];
  theme: string;
  humorMechanism: string;
  /** Supabase MP3 filename, e.g. 'sentence-<id>.mp3'; null until the audio batch runs. */
  audio: string | null;
  tokens: BankToken[];
  validation: BankValidation;
}

export interface SentenceBank {
  schemaVersion: number;
  generatorModel: string;
  generatorVersion: string;
  validatorModel: string;
  validatorVersion: string;
  /** ISO 8601 timestamp. */
  generatedAt: string;
  sentences: BankSentence[];
}
```

- [ ] Type-check it (no test yet — this is a pure type module). From `Motamot/motamot-app`:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && npx tsc --noEmit src/types/bank.ts
```

Expected: no output (clean). (If `tsc` complains about `--noEmit` with a single file in this project config, the equivalent verification runs in Task 12's schema test; this command should still pass since the file has no imports.)

- [ ] Commit (stage only this file; never `git add -A` from the umbrella root). From git root `/Users/mathias.bonnet/Zivver`:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/src/types/bank.ts && git commit -m "feat(bank): add shared sentence-bank data contract types

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If `.git/index.lock` contention occurs (the IDE polls git status on this large repo), retry the commit once after 2 seconds.

---

### Task 2: Add Vitest (node environment) and a test script

No test framework exists yet. Add Vitest configured for a node environment (the pipeline is pure-node `.mjs`/`.ts`, no DOM).

**Files:**
- Modify: `Motamot/motamot-app/package.json`
- Create: `Motamot/motamot-app/vitest.config.ts`
- Create: `Motamot/motamot-app/scripts/lib/sanity.test.mjs` (throwaway sanity test, deleted at end of task)

Steps:

- [ ] Install Vitest as a devDependency. From `Motamot/motamot-app`:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm add -D vitest@^3.0.0
```

Expected: pnpm updates `package.json` and `pnpm-lock.yaml`, adds `vitest` under devDependencies.

- [ ] Add the `test` script. The current `scripts` block in `package.json` is:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "evaluate": "node scripts/evaluate-sentences.mjs"
  },
```

Replace it with (adds `test` and `bank` scripts; `evaluate` stays for now, removed in Task 7):

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "evaluate": "node scripts/evaluate-sentences.mjs",
    "bank": "node scripts/build-sentence-bank.mjs"
  },
```

- [ ] Create `vitest.config.ts`:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.mjs'],
    globals: false,
  },
});
```

- [ ] Write a throwaway sanity test to prove the harness runs. Create `scripts/lib/sanity.test.mjs`:

```js
import { describe, it, expect } from 'vitest';

describe('vitest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] Run it. From `Motamot/motamot-app`:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
```

Expected: `1 passed (1)` — Vitest discovers `scripts/lib/sanity.test.mjs` and passes.

- [ ] Delete the sanity test:

```bash
rm /Users/mathias.bonnet/Zivver/Motamot/motamot-app/scripts/lib/sanity.test.mjs
```

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/package.json Motamot/motamot-app/pnpm-lock.yaml Motamot/motamot-app/vitest.config.ts && git commit -m "build(bank): add Vitest (node env) and test/bank scripts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Build-time word data — derive the 50 illustrated-noun seed set

The script needs the illustrated nouns (lemma, gender, image) deduped by lemma (first-with-image wins). `frenchWords.ts` is TypeScript; the `.mjs` script cannot import it directly without a build step. Create a tiny pure-JS data module that re-exports the noun rows, then a pure `deriveAnchors` function with tests.

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/wordData.mjs`
- Create: `Motamot/motamot-app/scripts/lib/anchors.mjs`
- Create: `Motamot/motamot-app/scripts/lib/anchors.test.mjs`

Steps:

- [ ] Create `scripts/lib/wordData.mjs`. This mirrors the FIRST 50 image-bearing nouns from `src/data/frenchWords.ts` (lines 5–54) exactly, plus the verb/adjective/adverb lists used for POS classification in token-baking (Task 9). Keep it a plain JS literal — no TS:

```js
// scripts/lib/wordData.mjs
// Build-time mirror of src/data/frenchWords.ts.
// The 50 illustrated nouns (concrete, singular) are the generation anchors.
// Keep IN SYNC with src/data/frenchWords.ts if that file's first 50 nouns change.

/** @typedef {{ word: string, gender: 'm'|'f', image?: string }} NounRow */

/** The 50 image-bearing nouns, in file order. @type {NounRow[]} */
export const illustratedNouns = [
  { word: 'homme', gender: 'm', image: 'homme.png' },
  { word: 'enfant', gender: 'm', image: 'enfant.png' },
  { word: 'père', gender: 'm', image: 'pere.png' },
  { word: 'ami', gender: 'm', image: 'ami.png' },
  { word: 'chat', gender: 'm', image: 'chat.png' },
  { word: 'chien', gender: 'm', image: 'chien.png' },
  { word: 'oiseau', gender: 'm', image: 'oiseau.png' },
  { word: 'poisson', gender: 'm', image: 'poisson.png' },
  { word: 'cheval', gender: 'm', image: 'cheval.png' },
  { word: 'arbre', gender: 'm', image: 'arbre.png' },
  { word: 'jardin', gender: 'm', image: 'jardin.png' },
  { word: 'soleil', gender: 'm', image: 'soleil.png' },
  { word: 'ciel', gender: 'm', image: 'ciel.png' },
  { word: 'pain', gender: 'm', image: 'pain.png' },
  { word: 'café', gender: 'm', image: 'cafe.png' },
  { word: 'livre', gender: 'm', image: 'livre.png' },
  { word: 'bureau', gender: 'm', image: 'bureau.png' },
  { word: 'lit', gender: 'm', image: 'lit.png' },
  { word: 'train', gender: 'm', image: 'train.png' },
  { word: 'avion', gender: 'm', image: 'avion.png' },
  { word: 'bateau', gender: 'm', image: 'bateau.png' },
  { word: 'vélo', gender: 'm', image: 'velo.png' },
  { word: 'téléphone', gender: 'm', image: 'telephone.png' },
  { word: 'ordinateur', gender: 'm', image: 'ordinateur.png' },
  { word: 'chapeau', gender: 'm', image: 'chapeau.png' },
  { word: 'gâteau', gender: 'm', image: 'gateau.png' },
  { word: 'fromage', gender: 'm', image: 'fromage.png' },
  { word: 'œuf', gender: 'm', image: 'oeuf.png' },
  { word: 'fruit', gender: 'm', image: 'fruit.png' },
  { word: 'légume', gender: 'm', image: 'legume.png' },
  { word: 'femme', gender: 'f', image: 'femme.png' },
  { word: 'fille', gender: 'f', image: 'fille.png' },
  { word: 'mère', gender: 'f', image: 'mere.png' },
  { word: 'maison', gender: 'f', image: 'maison.png' },
  { word: 'voiture', gender: 'f', image: 'voiture.png' },
  { word: 'table', gender: 'f', image: 'table.png' },
  { word: 'chaise', gender: 'f', image: 'chaise.png' },
  { word: 'porte', gender: 'f', image: 'porte.png' },
  { word: 'fenêtre', gender: 'f', image: 'fenetre.png' },
  { word: 'fleur', gender: 'f', image: 'fleur.png' },
  { word: 'montagne', gender: 'f', image: 'montagne.png' },
  { word: 'mer', gender: 'f', image: 'mer.png' },
  { word: 'plage', gender: 'f', image: 'plage.png' },
  { word: 'lune', gender: 'f', image: 'lune.png' },
  { word: 'étoile', gender: 'f', image: 'etoile.png' },
  { word: 'pomme', gender: 'f', image: 'pomme.png' },
  { word: 'orange', gender: 'f', image: 'orange.png' },
  { word: 'banane', gender: 'f', image: 'banane.png' },
  { word: 'pizza', gender: 'f', image: 'pizza.png' },
  { word: 'guitare', gender: 'f', image: 'guitare.png' },
];

/**
 * Verb infinitives (subset of src/data/frenchWords.ts verbs) used to classify
 * surface tokens as 'verb' during token-baking. Conjugated forms are matched
 * by stem heuristics in tokens.mjs; this list is for exact-lemma fallbacks.
 * @type {string[]}
 */
export const verbInfinitives = [
  'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir',
  'venir', 'prendre', 'mettre', 'passer', 'devoir', 'parler', 'trouver', 'donner',
  'rester', 'penser', 'porter', 'demander', 'regarder', 'aimer', 'commencer', 'attendre',
  'entendre', 'chercher', 'sortir', 'partir', 'comprendre', 'montrer', 'tomber', 'perdre',
  'vivre', 'écrire', 'lire', 'apprendre', 'jouer', 'connaître', 'ouvrir', 'répondre',
  'manger', 'boire', 'dormir', 'courir', 'travailler', 'acheter', 'oublier', 'danser',
  'chanter', 'cuisiner', 'nettoyer', 'casser', 'fermer', 'sauter', 'voler', 'nager',
  'cacher', 'rêver', 'rire', 'pleurer', 'marcher', 'arriver', 'écouter', 'attraper',
];

/**
 * Adjective lemmas (subset). Surface tokens whose lowercased stem matches one
 * of these (with gender/number suffixes stripped) classify as 'adjective'.
 * @type {string[]}
 */
export const adjectiveLemmas = [
  'grand', 'petit', 'bon', 'mauvais', 'nouveau', 'vieux', 'jeune', 'beau', 'joli',
  'gros', 'long', 'court', 'haut', 'lourd', 'léger', 'doux', 'chaud', 'froid',
  'propre', 'sale', 'plein', 'vide', 'ouvert', 'fermé', 'clair', 'sombre',
  'blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris',
  'rapide', 'lent', 'calme', 'fatigué', 'content', 'triste', 'heureux', 'drôle',
  'sérieux', 'fou', 'intelligent', 'curieux', 'amusant', 'gentil', 'méchant',
  'magnifique', 'énorme', 'minuscule', 'bizarre', 'mouillé', 'sec', 'mignon',
];

/**
 * Adverb lemmas (subset). Exact lowercased match classifies as 'adverb'.
 * @type {string[]}
 */
export const adverbLemmas = [
  'très', 'bien', 'mal', 'vite', 'lentement', 'souvent', 'parfois', 'toujours',
  'jamais', 'encore', 'déjà', 'bientôt', 'maintenant', 'hier', 'demain',
  'aujourd’hui', "aujourd'hui", 'soudain', 'rapidement', 'doucement',
  'complètement', 'totalement', 'absolument', 'presque', 'assez', 'trop', 'peu',
  'beaucoup', 'énormément', 'vraiment', 'heureusement', 'malheureusement',
  'tranquillement', 'silencieusement', 'bruyamment', 'gentiment', 'tendrement',
  'ensemble', 'partout', 'ici', 'là', 'dehors', 'dedans', 'devant', 'derrière',
];
```

- [ ] Write the failing test first. Create `scripts/lib/anchors.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { deriveAnchors } from './anchors.mjs';
import { illustratedNouns } from './wordData.mjs';

describe('deriveAnchors', () => {
  it('returns exactly the 50 image-bearing nouns', () => {
    const anchors = deriveAnchors(illustratedNouns);
    expect(anchors).toHaveLength(50);
    expect(anchors.every((a) => typeof a.image === 'string' && a.image.endsWith('.png'))).toBe(true);
  });

  it('dedupes by lemma, first-with-image wins', () => {
    const input = [
      { word: 'chat', gender: 'm', image: 'chat.png' },
      { word: 'chat', gender: 'm', image: 'chat-dupe.png' },
      { word: 'mer', gender: 'f', image: 'mer.png' },
    ];
    const anchors = deriveAnchors(input);
    expect(anchors).toHaveLength(2);
    expect(anchors.find((a) => a.lemma === 'chat').image).toBe('chat.png');
  });

  it('drops nouns without an image', () => {
    const input = [
      { word: 'chat', gender: 'm', image: 'chat.png' },
      { word: 'temps', gender: 'm' },
    ];
    const anchors = deriveAnchors(input);
    expect(anchors.map((a) => a.lemma)).toEqual(['chat']);
  });

  it('shapes each anchor as { lemma, gender, image }', () => {
    const anchors = deriveAnchors([{ word: 'chien', gender: 'm', image: 'chien.png' }]);
    expect(anchors[0]).toEqual({ lemma: 'chien', gender: 'm', image: 'chien.png' });
  });
});
```

- [ ] Run it — expect FAIL (no `anchors.mjs` yet):

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/anchors.test.mjs
```

Expected: FAIL — `Failed to resolve import "./anchors.mjs"`.

- [ ] Create the implementation `scripts/lib/anchors.mjs`:

```js
// scripts/lib/anchors.mjs
/** @typedef {{ lemma: string, gender: 'm'|'f', image: string }} Anchor */

/**
 * Derive the seed set of illustrated-noun anchors.
 * Dedupes by lemma (first occurrence with an image wins); drops imageless nouns.
 * @param {{ word: string, gender: 'm'|'f', image?: string }[]} nouns
 * @returns {Anchor[]}
 */
export function deriveAnchors(nouns) {
  const seen = new Set();
  /** @type {Anchor[]} */
  const out = [];
  for (const n of nouns) {
    if (!n.image) continue;
    if (seen.has(n.word)) continue;
    seen.add(n.word);
    out.push({ lemma: n.word, gender: n.gender, image: n.image });
  }
  return out;
}

/**
 * Per-anchor quota target. With 50 anchors and ~20 sentences each that is
 * ~1000 sentences, inside the 800–1200 spec target.
 */
export const PER_ANCHOR_QUOTA = 20;
export const PER_ANCHOR_QUOTA_MIN = 15;
export const PER_ANCHOR_QUOTA_MAX = 25;
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/anchors.test.mjs
```

Expected: `4 passed`.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/wordData.mjs Motamot/motamot-app/scripts/lib/anchors.mjs Motamot/motamot-app/scripts/lib/anchors.test.mjs && git commit -m "feat(bank): derive illustrated-noun anchor seed set

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Generation module — image-seeded prompt construction + response parsing

Pure functions: build the French system prompt and user prompt (mandatory anchors + theme + comedic mechanism + 2 few-shot exemplars, requesting several candidates), and parse Claude's JSON-array response into candidate sentence objects. Unit-tested. The actual SDK call is a thin impure wrapper, also defined here.

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/generate.mjs`
- Create: `Motamot/motamot-app/scripts/lib/generate.test.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/generate.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import {
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
  parseGenerationResponse,
  GENERATOR_VERSION,
} from './generate.mjs';

const anchor = { lemma: 'chat', gender: 'm', image: 'chat.png' };

describe('buildGenerationSystemPrompt', () => {
  it('is in French and forbids non-French words', () => {
    const sys = buildGenerationSystemPrompt();
    expect(sys).toContain('FRANÇAIS');
    expect(sys).toMatch(/débutant/i);
  });
});

describe('buildGenerationUserPrompt', () => {
  it('names every mandatory anchor lemma', () => {
    const prompt = buildGenerationUserPrompt({
      anchors: [anchor, { lemma: 'mer', gender: 'f', image: 'mer.png' }],
      level: 'A2',
      theme: 'les animaux à la maison',
      humorMechanism: 'une exagération absurde',
      candidateCount: 6,
    });
    expect(prompt).toContain('chat');
    expect(prompt).toContain('mer');
    expect(prompt).toContain('A2');
    expect(prompt).toContain('les animaux à la maison');
    expect(prompt).toContain('une exagération absurde');
    expect(prompt).toContain('6');
  });

  it('includes the two few-shot exemplars', () => {
    const prompt = buildGenerationUserPrompt({
      anchors: [anchor],
      level: 'A1',
      theme: 't',
      humorMechanism: 'm',
      candidateCount: 5,
    });
    // Exemplars are quoted French sentences ending with punctuation.
    expect(prompt).toMatch(/EXEMPLES/i);
  });
});

describe('parseGenerationResponse', () => {
  it('parses a clean JSON array of strings', () => {
    const raw = '["Le chat dort sur la table.", "Mon chat mange une pizza."]';
    expect(parseGenerationResponse(raw)).toEqual([
      'Le chat dort sur la table.',
      'Mon chat mange une pizza.',
    ]);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n["Le chat rit."]\n```';
    expect(parseGenerationResponse(raw)).toEqual(['Le chat rit.']);
  });

  it('trims and drops empty entries', () => {
    const raw = '["  Le chat dort.  ", "", "   "]';
    expect(parseGenerationResponse(raw)).toEqual(['Le chat dort.']);
  });

  it('returns [] on unparseable text instead of throwing', () => {
    expect(parseGenerationResponse('not json at all')).toEqual([]);
  });

  it('exposes a stable generator version string', () => {
    expect(typeof GENERATOR_VERSION).toBe('string');
    expect(GENERATOR_VERSION.length).toBeGreaterThan(0);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/generate.test.mjs
```

Expected: FAIL — cannot resolve `./generate.mjs`.

- [ ] Create `scripts/lib/generate.mjs`. The model id is `claude-opus-4-8` (per the Anthropic SDK; generation uses Opus 4.8, NOT Groq). Adaptive thinking is enabled and `effort: high` for creative quality:

```js
// scripts/lib/generate.mjs
// Image-seeded sentence generation via Claude Opus 4.8 (@anthropic-ai/sdk).
// Pure functions (prompt build + parse) are unit-tested; generateCandidates is
// a thin impure SDK wrapper.

export const GENERATOR_MODEL = 'claude-opus-4-8';
export const GENERATOR_VERSION = 'gen-1';

/** @returns {string} The French system prompt for the comedic generator. */
export function buildGenerationSystemPrompt() {
  return `Tu es un professeur de français NATIF et un auteur de comédie. Tu écris des phrases COURTES, DRÔLES, LOGIQUES et grammaticalement PARFAITES pour des apprenants débutants.

RÈGLES ABSOLUES :
1. FRANÇAIS UNIQUEMENT — aucun mot anglais, espagnol ou autre langue. Pas d'emprunts non intégrés.
2. GRAMMAIRE PARFAITE — verbes correctement conjugués, accords en genre et en nombre, articles et prépositions corrects, élisions correctes (l', d', n', qu', j'...).
3. SENS LOGIQUE — la phrase décrit une situation possible et concrète dans le monde réel. Pas de non-sens (jamais « la pluie fait une erreur » ni « la table pense »).
4. HUMOUR LÉGER — la phrase doit faire sourire, jamais offenser. L'humour porte sur soi-même, les animaux, les objets, ou la météo.
5. SÉCURITÉ — aucun contenu sur l'alcool, les drogues, le tabac, le corps (moqueries), les belles-familles, les stéréotypes ethniques/nationaux/religieux/de genre, la violence ou l'humour de toilettes.
6. SIMPLICITÉ — vocabulaire courant ; phrase courte adaptée au niveau demandé.

Tu réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères (les phrases), sans texte autour, sans markdown.`;
}

/**
 * @param {{
 *   anchors: { lemma: string, gender: 'm'|'f', image: string }[],
 *   level: 'A1'|'A2'|'B1',
 *   theme: string,
 *   humorMechanism: string,
 *   candidateCount: number,
 * }} opts
 * @returns {string}
 */
export function buildGenerationUserPrompt(opts) {
  const { anchors, level, theme, humorMechanism, candidateCount } = opts;
  const anchorDetails = anchors
    .map((a) => `« ${a.lemma} » (nom ${a.gender === 'm' ? 'masculin' : 'féminin'}, à utiliser obligatoirement)`)
    .join('\n- ');

  const lengthHint =
    level === 'B1' ? 'entre 12 et 16 mots' : 'entre 6 et 12 mots';

  return `Écris ${candidateCount} phrases DIFFÉRENTES, niveau ${level}, ${lengthHint} chacune.

CHAQUE phrase doit contenir ce(s) mot(s) obligatoire(s) :
- ${anchorDetails}

THÈME : ${theme}
MÉCANISME COMIQUE : ${humorMechanism}

EXEMPLES de bonnes phrases (ne pas les réutiliser, t'en inspirer) :
- « Le chat dort dans la machine à laver, il pense que c'est son lit. »
- « Mon chien attend devant le four parce qu'il rêve de pizza. »

RÉPONDS uniquement avec un tableau JSON de ${candidateCount} chaînes. Exemple de format :
["phrase un.", "phrase deux."]`;
}

/**
 * Parse Claude's response into an array of trimmed, non-empty sentence strings.
 * Tolerant of markdown fences and surrounding prose; never throws.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseGenerationResponse(raw) {
  if (typeof raw !== 'string') return [];
  let text = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Find the first JSON array in the text.
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return [];
  const slice = text.slice(start, end + 1);
  let arr;
  try {
    arr = JSON.parse(slice);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Impure: call Claude Opus 4.8 to generate candidate sentences for one anchor set.
 * @param {import('@anthropic-ai/sdk').default} client
 * @param {Parameters<typeof buildGenerationUserPrompt>[0]} opts
 * @returns {Promise<string[]>}
 */
export async function generateCandidates(client, opts) {
  const response = await client.messages.create({
    model: GENERATOR_MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system: buildGenerationSystemPrompt(),
    messages: [{ role: 'user', content: buildGenerationUserPrompt(opts) }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return parseGenerationResponse(textBlock ? textBlock.text : '');
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/generate.test.mjs
```

Expected: `8 passed`.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/generate.mjs Motamot/motamot-app/scripts/lib/generate.test.mjs && git commit -m "feat(bank): image-seeded Opus 4.8 generation prompts + response parsing

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Mechanical lint stage (pure, unit-tested)

Cheap rejection of obviously-bad candidates before paying for any Claude validation: leftover EN/ES stopwords, unbalanced apostrophes, missing sentence-final punctuation, per-CEFR word-count ceiling, capitalization. Plus the anchor-presence check (the seeded anchor lemma must actually appear).

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/lint.mjs`
- Create: `Motamot/motamot-app/scripts/lib/lint.test.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/lint.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { countWords, mechanicalLint, anchorsPresent } from './lint.mjs';

describe('countWords', () => {
  it("counts apostrophe contractions as part of their word", () => {
    expect(countWords("Le chat n'aime pas l'eau.")).toBe(5);
  });
  it('counts hyphenated inversions as one word', () => {
    expect(countWords('As-tu vu le chien ?')).toBe(4);
  });
});

describe('mechanicalLint', () => {
  const ok = { level: 'A2' };
  it('passes a clean A2 sentence', () => {
    expect(mechanicalLint('Le chat dort sur la table.', ok).pass).toBe(true);
  });
  it('rejects leftover English stopwords', () => {
    const r = mechanicalLint('Le chat is sur la table.', ok);
    expect(r.pass).toBe(false);
    expect(r.reason).toContain('non-français');
  });
  it('rejects leftover Spanish stopwords', () => {
    expect(mechanicalLint('El chat dort.', ok).pass).toBe(false);
  });
  it('rejects unbalanced apostrophes (curly count mismatch is fine; we check straight pairs)', () => {
    // Trailing lone apostrophe with no following letter is suspicious.
    expect(mechanicalLint("Le chat l' .", ok).pass).toBe(false);
  });
  it('rejects missing sentence-final punctuation', () => {
    expect(mechanicalLint('Le chat dort sur la table', ok).pass).toBe(false);
  });
  it('accepts ! ? and . and … as final punctuation', () => {
    expect(mechanicalLint('Le chat dort !', ok).pass).toBe(true);
    expect(mechanicalLint('Le chat dort ?', ok).pass).toBe(true);
  });
  it('rejects a sentence that does not start with a capital letter', () => {
    expect(mechanicalLint('le chat dort.', ok).pass).toBe(false);
  });
  it('enforces the A2 word ceiling (12)', () => {
    const long = 'Le grand chat noir mange une pizza chaude avec son ami fatigué aujourd hui maintenant vite.';
    expect(mechanicalLint(long, { level: 'A2' }).pass).toBe(false);
  });
  it('allows up to 16 words for B1', () => {
    const s = 'Le chat curieux observe la pluie tomber doucement sur la fenêtre de la vieille maison.';
    expect(mechanicalLint(s, { level: 'B1' }).pass).toBe(true);
  });
});

describe('anchorsPresent', () => {
  it('detects the anchor lemma as a whole word', () => {
    expect(anchorsPresent('Le chat dort.', ['chat'])).toBe(true);
  });
  it('detects an anchor after an elision', () => {
    expect(anchorsPresent("J'observe l'oiseau.", ['oiseau'])).toBe(true);
  });
  it('detects a plural anchor', () => {
    expect(anchorsPresent('Les chats dorment.', ['chat'])).toBe(true);
  });
  it('fails when an anchor is absent', () => {
    expect(anchorsPresent('Le chien dort.', ['chat'])).toBe(false);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/lint.test.mjs
```

Expected: FAIL — cannot resolve `./lint.mjs`.

- [ ] Create `scripts/lib/lint.mjs`:

```js
// scripts/lib/lint.mjs
// Cheap, deterministic rejection before any paid Claude validation.

const WORD_CEILINGS = { A1: 12, A2: 12, B1: 16 };
const WORD_FLOORS = { A1: 4, A2: 4, B1: 6 };

// Common English / Spanish stopwords that signal non-French leakage.
// Matched as whole words, case-insensitive, after lowercasing.
const FOREIGN_STOPWORDS = new Set([
  // English
  'the', 'is', 'are', 'was', 'and', 'with', 'for', 'you', 'his', 'her', 'they',
  'this', 'that', 'cat', 'dog', 'house', 'because', 'about', 'very', 'always',
  'never', 'sun', 'tree', 'happy', 'sad', 'eat', 'sleep', 'love',
  // Spanish
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'con', 'por', 'para', 'que',
  'gato', 'perro', 'casa', 'pero', 'muy', 'siempre', 'nunca', 'sol', 'feliz',
]);

// French words that collide with the foreign list — never flag these.
const FRENCH_SAFE = new Set(['la', 'un', 'que', 'sol']);

/**
 * Count words. Apostrophe contractions (l', n', qu', j', d', etc.) stay attached
 * to the following word; hyphenated inversions (as-tu) count as one word.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  // Replace apostrophes (straight + curly) so "l'eau" -> "leau" (one token).
  const joined = text.replace(/[’']/g, '');
  const matches = joined.match(/[\p{L}]+(?:-[\p{L}]+)*/gu);
  return matches ? matches.length : 0;
}

/**
 * @param {string} text
 * @param {{ level: 'A1'|'A2'|'B1' }} opts
 * @returns {{ pass: boolean, reason: string|null }}
 */
export function mechanicalLint(text, opts) {
  const t = text.trim();
  if (t.length === 0) return fail('vide');

  // Capitalization: must start with an uppercase letter (or accented uppercase).
  const first = t[0];
  if (first.toLowerCase() === first.toUpperCase()) {
    // Non-letter start (digit, punctuation) is invalid.
    return fail('ne commence pas par une majuscule');
  }
  if (first !== first.toUpperCase()) return fail('ne commence pas par une majuscule');

  // Sentence-final punctuation: . ! ? … (allowing a trailing quote/space already trimmed).
  if (!/[.!?…]$/.test(t)) return fail('pas de ponctuation finale');

  // Balanced apostrophes: a lone apostrophe not directly followed by a letter is suspicious.
  if (/[’'](?![\p{L}])/u.test(t)) return fail('apostrophe non équilibrée');

  // Foreign stopwords.
  const words = (t.toLowerCase().match(/[\p{L}]+/gu) || []);
  for (const w of words) {
    if (FRENCH_SAFE.has(w)) continue;
    if (FOREIGN_STOPWORDS.has(w)) return fail(`mot non-français détecté: « ${w} »`);
  }

  // Word count window.
  const n = countWords(t);
  const ceil = WORD_CEILINGS[opts.level];
  const floor = WORD_FLOORS[opts.level];
  if (n > ceil) return fail(`trop de mots (${n} > ${ceil})`);
  if (n < floor) return fail(`trop peu de mots (${n} < ${floor})`);

  return { pass: true, reason: null };
}

function fail(reason) {
  return { pass: false, reason };
}

/**
 * Whether every anchor lemma appears in the text as a whole word, tolerating
 * elision (l'oiseau), plural -s, and capitalization.
 * @param {string} text
 * @param {string[]} anchors
 * @returns {boolean}
 */
export function anchorsPresent(text, anchors) {
  const lower = text.toLowerCase();
  return anchors.every((lemma) => {
    const l = lemma.toLowerCase();
    // Whole-word match allowing a preceding elision/word boundary and an optional plural s.
    const escaped = l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\p{L}])${escaped}s?(?![\\p{L}])`, 'u');
    return re.test(lower);
  });
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/lint.test.mjs
```

Expected: all tests pass. If the unbalanced-apostrophe test for `"Le chat l' ."` is brittle, confirm the regex `[’'](?![\p{L}])` matches the lone apostrophe followed by a space.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/lint.mjs Motamot/motamot-app/scripts/lib/lint.test.mjs && git commit -m "feat(bank): mechanical lint + anchor-presence check

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Two-stage dedup (pure, unit-tested)

Before paying for validation: (1) normalized exact-match against accepted+pending sentences, (2) near-dup detection via token-overlap (Jaccard) and Levenshtein ratio ~0.8, scoped to the candidate's anchor-lemma bucket.

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/dedup.mjs`
- Create: `Motamot/motamot-app/scripts/lib/dedup.test.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/dedup.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import {
  normalize,
  levenshtein,
  levenshteinRatio,
  tokenOverlap,
  isDuplicate,
} from './dedup.mjs';

describe('normalize', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normalize('  Le  CHAT, dort! ')).toBe('le chat dort');
  });
  it('treats elisions as separators', () => {
    expect(normalize("L'oiseau   chante.")).toBe('l oiseau chante');
  });
});

describe('levenshtein', () => {
  it('is 0 for identical strings', () => {
    expect(levenshtein('chat', 'chat')).toBe(0);
  });
  it('counts single edits', () => {
    expect(levenshtein('chat', 'chats')).toBe(1);
    expect(levenshtein('chat', 'chien')).toBe(3);
  });
});

describe('levenshteinRatio', () => {
  it('is 1 for identical, 0 for fully different lengths', () => {
    expect(levenshteinRatio('chat', 'chat')).toBe(1);
    expect(levenshteinRatio('', '')).toBe(1);
  });
});

describe('tokenOverlap', () => {
  it('computes Jaccard over normalized word sets', () => {
    expect(tokenOverlap('le chat dort', 'le chat mange')).toBeCloseTo(2 / 4, 5);
  });
});

describe('isDuplicate', () => {
  const bucket = ['Le chat dort sur la table.'];
  it('flags an exact normalized match', () => {
    expect(isDuplicate('le chat dort sur la table', bucket).duplicate).toBe(true);
  });
  it('flags a near-dup above the 0.8 threshold', () => {
    expect(isDuplicate('Le chat dort sur la table !', bucket).duplicate).toBe(true);
  });
  it('does not flag a clearly different sentence', () => {
    expect(isDuplicate('Le chien mange une pizza.', bucket).duplicate).toBe(false);
  });
  it('returns reason "exact" or "near" appropriately', () => {
    expect(isDuplicate('le chat dort sur la table', bucket).reason).toBe('exact');
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/dedup.test.mjs
```

Expected: FAIL — cannot resolve `./dedup.mjs`.

- [ ] Create `scripts/lib/dedup.mjs`:

```js
// scripts/lib/dedup.mjs
// Two-stage dedup run BEFORE any paid validation:
//  1. normalized exact match
//  2. near-dup via token-overlap (Jaccard) or Levenshtein ratio, threshold 0.8

export const NEAR_DUP_THRESHOLD = 0.8;

/**
 * Normalize for comparison: lowercase, strip punctuation (apostrophes -> space),
 * collapse whitespace.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classic Levenshtein edit distance.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Similarity in [0,1]: 1 - distance / maxLength.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Jaccard token overlap over normalized word sets.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function tokenOverlap(a, b) {
  const sa = new Set(normalize(a).split(' ').filter(Boolean));
  const sb = new Set(normalize(b).split(' ').filter(Boolean));
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Is `candidate` a duplicate of anything in `bucket` (sentences sharing the
 * candidate's anchor lemma)?
 * @param {string} candidate
 * @param {string[]} bucket
 * @returns {{ duplicate: boolean, reason: 'exact'|'near'|null, against: string|null }}
 */
export function isDuplicate(candidate, bucket) {
  const nc = normalize(candidate);
  for (const existing of bucket) {
    if (normalize(existing) === nc) {
      return { duplicate: true, reason: 'exact', against: existing };
    }
  }
  for (const existing of bucket) {
    const overlap = tokenOverlap(candidate, existing);
    const ratio = levenshteinRatio(normalize(candidate), normalize(existing));
    if (overlap >= NEAR_DUP_THRESHOLD || ratio >= NEAR_DUP_THRESHOLD) {
      return { duplicate: true, reason: 'near', against: existing };
    }
  }
  return { duplicate: false, reason: null, against: null };
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/dedup.test.mjs
```

Expected: all pass.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/dedup.mjs Motamot/motamot-app/scripts/lib/dedup.test.mjs && git commit -m "feat(bank): two-stage dedup (exact + near-dup) before validation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Claude correctness validator (Sonnet 4.6), with corrected-sentence recycling — and retire the old harness

Adapt `evaluate-sentences.mjs`'s evaluator. Fix the stale model id to `claude-sonnet-4-6`. Four axes: grammar / semantics / frenchOnly / simplicity. Recycle the `corrected_sentence` field by re-validating the correction once. Pure functions for prompt build + verdict parse; impure SDK wrapper. **Deletion ownership:** this plan owns ONLY the removal of the old offline harness it replaces — `scripts/evaluate-sentences.mjs` and the `evaluate` package script. The runtime Groq/Settings deletions (`src/services/api.ts`, `src/components/Settings.tsx`, the Groq types in `src/types/index.ts`) are owned exclusively by the **frontend plan, Task 3** — do NOT delete those here, to avoid both plans racing on the same files.

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/validateCorrectness.mjs`
- Create: `Motamot/motamot-app/scripts/lib/validateCorrectness.test.mjs`
- Modify: `Motamot/motamot-app/package.json` (remove `evaluate` script)
- Delete: `Motamot/motamot-app/scripts/evaluate-sentences.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/validateCorrectness.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import {
  buildCorrectnessPrompt,
  parseCorrectnessVerdict,
  VALIDATOR_MODEL,
  VALIDATOR_VERSION,
} from './validateCorrectness.mjs';

describe('VALIDATOR_MODEL', () => {
  it('is the corrected, non-stale Sonnet id', () => {
    expect(VALIDATOR_MODEL).toBe('claude-sonnet-4-6');
  });
  it('exposes a version string', () => {
    expect(typeof VALIDATOR_VERSION).toBe('string');
    expect(VALIDATOR_VERSION.length).toBeGreaterThan(0);
  });
});

describe('buildCorrectnessPrompt', () => {
  it('embeds the sentence and CEFR level and asks for the JSON axes', () => {
    const p = buildCorrectnessPrompt('Le chat dort.', 'A2');
    expect(p).toContain('Le chat dort.');
    expect(p).toContain('A2');
    expect(p).toContain('grammar');
    expect(p).toContain('corrected_sentence');
  });
});

describe('parseCorrectnessVerdict', () => {
  it('parses a passing verdict', () => {
    const raw = JSON.stringify({
      grammar: { pass: true, issues: null },
      semantics: { pass: true, issues: null },
      french_only: { pass: true, issues: null },
      simplicity: { pass: true, issues: null },
      overall_pass: true,
      corrected_sentence: null,
    });
    const v = parseCorrectnessVerdict(raw);
    expect(v.parseError).toBe(false);
    expect(v.axes).toEqual({ grammar: true, semantics: true, frenchOnly: true, simplicity: true });
    expect(v.overallPass).toBe(true);
    expect(v.correctedSentence).toBe(null);
  });

  it('extracts the corrected_sentence on failure', () => {
    const raw = JSON.stringify({
      grammar: { pass: false, issues: 'accord' },
      semantics: { pass: true },
      french_only: { pass: true },
      simplicity: { pass: true },
      overall_pass: false,
      corrected_sentence: 'Le chat dort bien.',
    });
    const v = parseCorrectnessVerdict(raw);
    expect(v.overallPass).toBe(false);
    expect(v.axes.grammar).toBe(false);
    expect(v.correctedSentence).toBe('Le chat dort bien.');
  });

  it('strips markdown fences', () => {
    const raw = '```json\n{"grammar":{"pass":true},"semantics":{"pass":true},"french_only":{"pass":true},"simplicity":{"pass":true},"overall_pass":true,"corrected_sentence":null}\n```';
    expect(parseCorrectnessVerdict(raw).overallPass).toBe(true);
  });

  it('flags a parse error on garbage', () => {
    expect(parseCorrectnessVerdict('not json').parseError).toBe(true);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/validateCorrectness.test.mjs
```

Expected: FAIL — cannot resolve `./validateCorrectness.mjs`.

- [ ] Create `scripts/lib/validateCorrectness.mjs` (validator is a SEPARATE Claude call from generation; model id FIXED to `claude-sonnet-4-6`):

```js
// scripts/lib/validateCorrectness.mjs
// Correctness gate — a SEPARATE Claude Sonnet 4.6 call (nothing self-grades).
// Axes: grammar / semantics / frenchOnly / simplicity. Recycles corrected_sentence.

export const VALIDATOR_MODEL = 'claude-sonnet-4-6';
export const VALIDATOR_VERSION = 'val-1';

/**
 * @param {string} sentence
 * @param {'A1'|'A2'|'B1'} level
 * @returns {string}
 */
export function buildCorrectnessPrompt(sentence, level) {
  const ceiling = level === 'B1' ? 16 : 12;
  return `Tu es un évaluateur rigoureux de phrases françaises pour apprenants débutants (niveau ${level}).

PHRASE : « ${sentence} »

Évalue chaque critère avec true (PASS) ou false (FAIL) :

1. grammar : grammaticalement correcte ? (conjugaison, accords genre/nombre, articles, prépositions, élisions)
2. semantics : décrit une situation logiquement possible et concrète ? (pas de non-sens comme « la pluie fait une erreur » ou « la table pense »)
3. french_only : tous les mots sont en français ? (pas d'emprunts non intégrés, pas d'anglais/espagnol)
4. simplicity : compréhensible pour un apprenant ${level} ? (vocabulaire courant, maximum ${ceiling} mots)

Réponds EXACTEMENT dans ce format JSON, sans markdown, sans backticks :
{
  "grammar": { "pass": true/false, "issues": "description si FAIL, sinon null" },
  "semantics": { "pass": true/false, "issues": "description si FAIL, sinon null" },
  "french_only": { "pass": true/false, "issues": "description si FAIL, sinon null" },
  "simplicity": { "pass": true/false, "issues": "description si FAIL, sinon null" },
  "overall_pass": true/false,
  "corrected_sentence": "phrase corrigée minimale si FAIL et corrigeable, sinon null"
}`;
}

/**
 * @param {string} raw
 * @returns {{
 *   parseError: boolean,
 *   axes: { grammar: boolean, semantics: boolean, frenchOnly: boolean, simplicity: boolean },
 *   overallPass: boolean,
 *   correctedSentence: string|null,
 * }}
 */
export function parseCorrectnessVerdict(raw) {
  const empty = {
    parseError: true,
    axes: { grammar: false, semantics: false, frenchOnly: false, simplicity: false },
    overallPass: false,
    correctedSentence: null,
  };
  if (typeof raw !== 'string') return empty;
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return empty;
  let obj;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    return empty;
  }
  const axis = (a) => Boolean(a && a.pass === true);
  return {
    parseError: false,
    axes: {
      grammar: axis(obj.grammar),
      semantics: axis(obj.semantics),
      frenchOnly: axis(obj.french_only),
      simplicity: axis(obj.simplicity),
    },
    overallPass: obj.overall_pass === true,
    correctedSentence:
      typeof obj.corrected_sentence === 'string' && obj.corrected_sentence.trim().length > 0
        ? obj.corrected_sentence.trim()
        : null,
  };
}

/**
 * Impure: validate one sentence. If it fails but yields a correction, re-validate
 * the correction ONCE and, if that passes, return it as the accepted text.
 * @param {import('@anthropic-ai/sdk').default} client
 * @param {string} sentence
 * @param {'A1'|'A2'|'B1'} level
 * @returns {Promise<{ acceptedText: string|null, axes: object, recycled: boolean }>}
 */
export async function validateCorrectness(client, sentence, level) {
  const callOnce = async (text) => {
    const resp = await client.messages.create({
      model: VALIDATOR_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildCorrectnessPrompt(text, level) }],
    });
    const block = resp.content.find((b) => b.type === 'text');
    return parseCorrectnessVerdict(block ? block.text : '');
  };

  const first = await callOnce(sentence);
  if (first.overallPass) {
    return { acceptedText: sentence, axes: first.axes, recycled: false };
  }
  if (first.correctedSentence) {
    const second = await callOnce(first.correctedSentence);
    if (second.overallPass) {
      return { acceptedText: first.correctedSentence, axes: second.axes, recycled: true };
    }
  }
  return { acceptedText: null, axes: first.axes, recycled: false };
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/validateCorrectness.test.mjs
```

Expected: all pass.

- [ ] Delete the obsolete Groq harness and remove the `evaluate` script. First delete the file:

```bash
rm /Users/mathias.bonnet/Zivver/Motamot/motamot-app/scripts/evaluate-sentences.mjs
```

- [ ] Remove the `evaluate` line from `package.json` scripts (it now points at a deleted file). The block after Task 2 is:

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "evaluate": "node scripts/evaluate-sentences.mjs",
    "bank": "node scripts/build-sentence-bank.mjs"
```

Replace with:

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "bank": "node scripts/build-sentence-bank.mjs"
```

- [ ] Verify the test suite still passes (nothing imports the deleted harness):

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
```

Expected: all suites pass.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/validateCorrectness.mjs Motamot/motamot-app/scripts/lib/validateCorrectness.test.mjs Motamot/motamot-app/package.json && git rm Motamot/motamot-app/scripts/evaluate-sentences.mjs && git commit -m "feat(bank): Sonnet 4.6 correctness validator (fixed model id) + recycle correction; drop Groq harness

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If the IDE holds `.git/index.lock`, retry the `git rm`/`git commit` once after a short pause.

---

### Task 8: Humor gate + safety gate (one separate Claude call, given only the sentence)

A skeptical comedy-editor PASS/FAIL and a denylist-based safety PASS/FAIL, run as a SEPARATE Claude call given ONLY the sentence (no anchors, no theme — so it judges the sentence on its own merits). Both axes returned from one call to save cost. Require all six axes true overall (the six-axis AND lives in the orchestrator, Task 10).

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/validateHumorSafety.mjs`
- Create: `Motamot/motamot-app/scripts/lib/validateHumorSafety.test.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/validateHumorSafety.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import {
  buildHumorSafetyPrompt,
  parseHumorSafetyVerdict,
  HUMOR_SAFETY_MODEL,
} from './validateHumorSafety.mjs';

describe('HUMOR_SAFETY_MODEL', () => {
  it('uses the Sonnet validator id', () => {
    expect(HUMOR_SAFETY_MODEL).toBe('claude-sonnet-4-6');
  });
});

describe('buildHumorSafetyPrompt', () => {
  it('contains the sentence and both gates and the denylist topics', () => {
    const p = buildHumorSafetyPrompt('Le chat dort dans le four.');
    expect(p).toContain('Le chat dort dans le four.');
    expect(p).toMatch(/humour/i);
    expect(p).toMatch(/sécurité|sûr/i);
    expect(p).toMatch(/alcool/i);
    expect(p).toContain('humor');
    expect(p).toContain('safety');
  });

  it('does NOT leak the anchor or theme (sentence-only)', () => {
    // The function takes only the sentence; ensure signature is single-arg.
    expect(buildHumorSafetyPrompt.length).toBe(1);
  });
});

describe('parseHumorSafetyVerdict', () => {
  it('parses both axes true', () => {
    const raw = JSON.stringify({ humor: { pass: true }, safety: { pass: true } });
    expect(parseHumorSafetyVerdict(raw)).toEqual({ parseError: false, humor: true, safety: true });
  });
  it('parses humor FAIL', () => {
    const raw = JSON.stringify({ humor: { pass: false, issues: 'bland' }, safety: { pass: true } });
    const v = parseHumorSafetyVerdict(raw);
    expect(v.humor).toBe(false);
    expect(v.safety).toBe(true);
  });
  it('parses safety FAIL', () => {
    const raw = JSON.stringify({ humor: { pass: true }, safety: { pass: false, issues: 'alcohol' } });
    expect(parseHumorSafetyVerdict(raw).safety).toBe(false);
  });
  it('flags parse error and fails both axes on garbage', () => {
    const v = parseHumorSafetyVerdict('xxx');
    expect(v.parseError).toBe(true);
    expect(v.humor).toBe(false);
    expect(v.safety).toBe(false);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/validateHumorSafety.test.mjs
```

Expected: FAIL — cannot resolve `./validateHumorSafety.mjs`.

- [ ] Create `scripts/lib/validateHumorSafety.mjs`:

```js
// scripts/lib/validateHumorSafety.mjs
// Two new gates in one separate Claude call, given ONLY the sentence:
//  - humor: a skeptical comedy editor; FAIL anything bland/neutre.
//  - safety: denylist from the spec.

export const HUMOR_SAFETY_MODEL = 'claude-sonnet-4-6';
export const HUMOR_SAFETY_VERSION = 'hs-1';

/**
 * @param {string} sentence
 * @returns {string}
 */
export function buildHumorSafetyPrompt(sentence) {
  return `Tu es un rédacteur en chef de comédie SCEPTIQUE et un modérateur de sécurité. On te donne UNE phrase française, sans contexte. Juge-la sur ses seuls mérites.

PHRASE : « ${sentence} »

GATE 1 — humor : la phrase est-elle réellement DRÔLE ? Sois impitoyable. FAIL toute phrase plate, neutre, purement descriptive ou seulement « mignonne ». PASS uniquement si elle provoque un sourire grâce à une idée comique claire (exagération, absurde logique, ironie, retournement).

GATE 2 — safety : la phrase est-elle SÛRE pour un public débutant, y compris des enfants ? FAIL si elle évoque : alcool, drogues, tabac ; moqueries sur le corps ; clichés sur la belle-famille ou le couple ; stéréotypes ethniques, nationaux, religieux ou de genre ; violence ; humour de toilettes. L'humour acceptable porte sur soi-même, les animaux, les objets, ou la météo.

Réponds EXACTEMENT dans ce format JSON, sans markdown, sans backticks :
{
  "humor": { "pass": true/false, "issues": "raison si FAIL, sinon null" },
  "safety": { "pass": true/false, "issues": "raison si FAIL, sinon null" }
}`;
}

/**
 * @param {string} raw
 * @returns {{ parseError: boolean, humor: boolean, safety: boolean }}
 */
export function parseHumorSafetyVerdict(raw) {
  const empty = { parseError: true, humor: false, safety: false };
  if (typeof raw !== 'string') return empty;
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return empty;
  let obj;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    return empty;
  }
  return {
    parseError: false,
    humor: Boolean(obj.humor && obj.humor.pass === true),
    safety: Boolean(obj.safety && obj.safety.pass === true),
  };
}

/**
 * Impure: run the combined humor+safety gate.
 * @param {import('@anthropic-ai/sdk').default} client
 * @param {string} sentence
 * @returns {Promise<{ humor: boolean, safety: boolean }>}
 */
export async function validateHumorSafety(client, sentence) {
  const resp = await client.messages.create({
    model: HUMOR_SAFETY_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildHumorSafetyPrompt(sentence) }],
  });
  const block = resp.content.find((b) => b.type === 'text');
  const v = parseHumorSafetyVerdict(block ? block.text : '');
  return { humor: v.humor, safety: v.safety };
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/validateHumorSafety.test.mjs
```

Expected: all pass.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/validateHumorSafety.mjs Motamot/motamot-app/scripts/lib/validateHumorSafety.test.mjs && git commit -m "feat(bank): humor + safety gates (one sentence-only Claude call)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Offline token-baking (pure, unit-tested — the trickiest part)

Given an accepted sentence + the known anchor lemma(s) + the anchor metadata, produce the `tokens[]` array: correct char offsets (`text.slice(start,end)===surface` for EVERY token), POS classification, gender/image/en resolution (image only for anchor illustrated nouns; en gloss for content tokens), and `isContent`/`isTarget` flags. Function words vs content words classified by a French function-word stoplist.

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/tokens.mjs`
- Create: `Motamot/motamot-app/scripts/lib/tokens.test.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/tokens.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { tokenize, bakeTokens, isFunctionWord, glossFor } from './tokens.mjs';

const anchorChat = { lemma: 'chat', gender: 'm', image: 'chat.png' };

describe('tokenize', () => {
  it('produces offset-accurate surface slices', () => {
    const text = "Le chat dort.";
    const toks = tokenize(text);
    for (const t of toks) {
      expect(text.slice(t.start, t.end)).toBe(t.surface);
    }
  });

  it('keeps elision contractions with their word ("l\'oiseau" -> one token)', () => {
    const text = "L'oiseau chante.";
    const toks = tokenize(text);
    expect(toks.map((t) => t.surface)).toEqual(["L'oiseau", 'chante']);
    expect(text.slice(toks[0].start, toks[0].end)).toBe("L'oiseau");
  });

  it('keeps hyphenated inversions as one token ("As-tu" -> one token)', () => {
    const toks = tokenize('As-tu faim ?');
    expect(toks[0].surface).toBe('As-tu');
  });

  it('excludes punctuation from token surfaces', () => {
    const toks = tokenize('Le chat dort !');
    expect(toks.map((t) => t.surface)).toEqual(['Le', 'chat', 'dort']);
  });
});

describe('isFunctionWord', () => {
  it('flags articles, prepositions, pronouns', () => {
    expect(isFunctionWord('le')).toBe(true);
    expect(isFunctionWord('dans')).toBe(true);
    expect(isFunctionWord('il')).toBe(true);
    expect(isFunctionWord("l'")).toBe(true);
  });
  it('does not flag content words', () => {
    expect(isFunctionWord('chat')).toBe(false);
    expect(isFunctionWord('dort')).toBe(false);
  });
});

describe('bakeTokens', () => {
  const text = 'Le chat dort sur la table.';

  it('every token offset reconstructs its surface', () => {
    const toks = bakeTokens(text, ['chat'], [anchorChat]);
    for (const t of toks) {
      expect(text.slice(t.start, t.end)).toBe(t.surface);
    }
  });

  it('assigns image + gender only to the anchor noun token', () => {
    const toks = bakeTokens(text, ['chat'], [anchorChat]);
    const chat = toks.find((t) => t.lemma === 'chat');
    expect(chat.image).toBe('chat.png');
    expect(chat.gender).toBe('m');
    expect(chat.type).toBe('noun');
    expect(chat.isTarget).toBe(true);
    const table = toks.find((t) => t.surface === 'table');
    expect(table.image).toBe(null);
  });

  it('marks function words isContent=false with null gloss', () => {
    const toks = bakeTokens(text, ['chat'], [anchorChat]);
    const le = toks.find((t) => t.surface === 'Le');
    expect(le.type).toBe('function');
    expect(le.isContent).toBe(false);
    expect(le.en).toBe(null);
  });

  it('marks content words isContent=true with a non-null gloss', () => {
    const toks = bakeTokens(text, ['chat'], [anchorChat]);
    const dort = toks.find((t) => t.surface === 'dort');
    expect(dort.isContent).toBe(true);
    expect(dort.type).toBe('verb');
    expect(typeof dort.en).toBe('string');
  });

  it('handles an anchor realized after an elision', () => {
    const t2 = "J'aime l'oiseau bleu.";
    const anchorOiseau = { lemma: 'oiseau', gender: 'm', image: 'oiseau.png' };
    const toks = bakeTokens(t2, ['oiseau'], [anchorOiseau]);
    const oiseau = toks.find((t) => t.lemma === 'oiseau');
    expect(oiseau).toBeDefined();
    expect(oiseau.image).toBe('oiseau.png');
    expect(t2.slice(oiseau.start, oiseau.end)).toBe(oiseau.surface);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/tokens.test.mjs
```

Expected: FAIL — cannot resolve `./tokens.mjs`.

- [ ] Create `scripts/lib/tokens.mjs`. The offset accuracy is enforced by tokenizing via a single regex `exec` loop that records `match.index`. POS classification: anchor lemma -> noun; else function-word stoplist -> function; else adverb/adjective/verb heuristics; else default to noun (content). Glosses come from a small embedded EN-gloss map for the content words likely to appear (anchors + common verbs/adjectives/adverbs); unknown content words get a placeholder-free best-effort gloss equal to the lemma (still non-null, so `isContent` tokens always have a gloss):

```js
// scripts/lib/tokens.mjs
// Offline token-baking. The hard guarantee: text.slice(start,end) === surface
// for every token. Tokenization uses a single regex exec loop so offsets are exact.

import { verbInfinitives, adjectiveLemmas, adverbLemmas, illustratedNouns } from './wordData.mjs';

// A French word token: letters, optionally preceded by an elision prefix
// (l' d' n' j' t' s' m' c' qu'), and optionally joined by hyphens (as-tu, est-ce).
// Apostrophe may be straight (') or curly (’).
const TOKEN_RE = /(?:[ldnjtsmcqu]['’])?[\p{L}]+(?:-[\p{L}]+)*/giu;

const FUNCTION_WORDS = new Set([
  // articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  // elided articles/pronouns (matched after stripping the apostrophe form below too)
  'l', 'd', 'j', 'n', 't', 's', 'm', 'c', 'qu',
  // pronouns
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'lui', 'leur', 'y', 'en', 'moi', 'toi', 'soi', 'eux',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leurs',
  'qui', 'que', 'quoi', 'dont', 'où',
  // prepositions
  'à', 'dans', 'sur', 'sous', 'par', 'pour', 'avec', 'sans', 'chez',
  'vers', 'entre', 'contre', 'devant', 'derrière', 'depuis', 'pendant',
  // conjunctions / particles
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'si', 'comme', 'quand',
  'parce', 'ne', 'pas', 'plus', 'est', 'ce',
]);

// Minimal EN-gloss map for common content words (anchors + frequent verbs/adj/adverbs).
// Unknown content words fall back to their own lemma (gloss is always non-null for content).
const GLOSS = {
  // anchor nouns (subset; full map filled from illustratedNouns below)
  dort: 'sleeps', dorment: 'sleep', mange: 'eats', mangent: 'eat',
  chante: 'sings', rit: 'laughs', danse: 'dances', court: 'runs',
  saute: 'jumps', vole: 'flies', nage: 'swims', tombe: 'falls',
  pense: 'thinks', rêve: 'dreams', attend: 'waits', observe: 'watches',
  regarde: 'watches', cache: 'hides', cherche: 'looks for',
  grand: 'big', petit: 'small', gros: 'fat', vieux: 'old', jeune: 'young',
  beau: 'handsome', joli: 'pretty', rouge: 'red', bleu: 'blue', vert: 'green',
  noir: 'black', blanc: 'white', drôle: 'funny', content: 'happy', triste: 'sad',
  fatigué: 'tired', chaud: 'hot', froid: 'cold', curieux: 'curious',
  très: 'very', vite: 'quickly', souvent: 'often', toujours: 'always',
  jamais: 'never', encore: 'again', doucement: 'gently', ensemble: 'together',
  maintenant: 'now', soudain: 'suddenly', vraiment: 'really',
};

// English glosses for the 50 anchor nouns, keyed by lemma.
const NOUN_GLOSS = {
  homme: 'man', enfant: 'child', père: 'father', ami: 'friend', chat: 'cat',
  chien: 'dog', oiseau: 'bird', poisson: 'fish', cheval: 'horse', arbre: 'tree',
  jardin: 'garden', soleil: 'sun', ciel: 'sky', pain: 'bread', café: 'coffee',
  livre: 'book', bureau: 'desk', lit: 'bed', train: 'train', avion: 'plane',
  bateau: 'boat', vélo: 'bicycle', téléphone: 'phone', ordinateur: 'computer',
  chapeau: 'hat', gâteau: 'cake', fromage: 'cheese', œuf: 'egg', fruit: 'fruit',
  légume: 'vegetable', femme: 'woman', fille: 'girl', mère: 'mother',
  maison: 'house', voiture: 'car', table: 'table', chaise: 'chair',
  porte: 'door', fenêtre: 'window', fleur: 'flower', montagne: 'mountain',
  mer: 'sea', plage: 'beach', lune: 'moon', étoile: 'star', pomme: 'apple',
  orange: 'orange', banane: 'banana', pizza: 'pizza', guitare: 'guitar',
};

/**
 * Strip a leading elision prefix and lowercase, for classification/lemma lookup.
 * "L'oiseau" -> "oiseau", "qu'il" -> "il", "chats" -> "chats".
 * @param {string} surface
 * @returns {string}
 */
function bare(surface) {
  return surface.replace(/^[ldnjtsmcqu]['’]/i, '').toLowerCase();
}

/**
 * Tokenize into offset-accurate word tokens (punctuation excluded).
 * @param {string} text
 * @returns {{ surface: string, start: number, end: number }[]}
 */
export function tokenize(text) {
  const out = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    out.push({ surface: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * @param {string} surface
 * @returns {boolean}
 */
export function isFunctionWord(surface) {
  const b = bare(surface);
  // The elision prefix itself (l', d', qu'...) — if bare() emptied it, it's a function word.
  if (b.length === 0) return true;
  // If the surface is JUST an elision token like "l'" with nothing after.
  if (/^[ldnjtsmcqu]['’]?$/i.test(surface)) return true;
  return FUNCTION_WORDS.has(b);
}

/**
 * Classify a content word's POS. anchorLemmas already handled by caller.
 * @param {string} bareWord lowercased, elision-stripped
 * @returns {'verb'|'adjective'|'adverb'|'noun'}
 */
function classifyContent(bareWord) {
  const singular = bareWord.replace(/s$/, '');
  if (adverbLemmas.includes(bareWord)) return 'adverb';
  if (bareWord.endsWith('ment')) return 'adverb';
  if (adjectiveLemmas.includes(bareWord) || adjectiveLemmas.includes(singular)) return 'adjective';
  if (verbInfinitives.includes(bareWord)) return 'verb';
  // Common conjugated verb endings.
  if (/(e|es|ent|ait|aient|é|és|ée|ées|ir|er|re|ons|ez|ait|is|it)$/.test(bareWord) && GLOSS[bareWord]) {
    return 'verb';
  }
  if (GLOSS[bareWord]) {
    // GLOSS holds verbs/adj/adverbs; default unknown GLOSS entries to verb only if not adj/adverb.
    return 'verb';
  }
  return 'noun';
}

/**
 * @param {string} bareWord
 * @param {'noun'|'verb'|'adjective'|'adverb'} type
 * @param {string} anchorLemma|null
 * @returns {string} a non-null English gloss
 */
export function glossFor(bareWord, type) {
  if (type === 'noun' && NOUN_GLOSS[bareWord]) return NOUN_GLOSS[bareWord];
  if (NOUN_GLOSS[bareWord]) return NOUN_GLOSS[bareWord];
  if (GLOSS[bareWord]) return GLOSS[bareWord];
  // Fallback: lemma itself (still non-null so isContent tokens always have a gloss).
  return bareWord;
}

/**
 * Bake the full tokens[] array.
 * @param {string} text accepted sentence
 * @param {string[]} anchorLemmas the seeded anchors realized in this sentence
 * @param {{ lemma: string, gender: 'm'|'f', image: string }[]} anchorMeta anchor metadata
 * @returns {import('../../src/types/bank').BankToken[]}
 */
export function bakeTokens(text, anchorLemmas, anchorMeta) {
  const anchorSet = new Set(anchorLemmas.map((l) => l.toLowerCase()));
  const metaByLemma = new Map(anchorMeta.map((a) => [a.lemma.toLowerCase(), a]));
  const raw = tokenize(text);

  return raw.map((tok) => {
    const b = bare(tok.surface);
    const fn = isFunctionWord(tok.surface);

    if (fn) {
      return {
        surface: tok.surface,
        lemma: b,
        type: 'function',
        gender: null,
        image: null,
        en: null,
        start: tok.start,
        end: tok.end,
        isContent: false,
        isTarget: false,
      };
    }

    // Content word. Check anchor match (allow plural -s).
    const singular = b.replace(/s$/, '');
    const matchedAnchorLemma = anchorSet.has(b)
      ? b
      : anchorSet.has(singular)
        ? singular
        : null;

    if (matchedAnchorLemma) {
      const meta = metaByLemma.get(matchedAnchorLemma);
      return {
        surface: tok.surface,
        lemma: matchedAnchorLemma,
        type: 'noun',
        gender: meta ? meta.gender : null,
        image: meta ? meta.image : null,
        en: glossFor(matchedAnchorLemma, 'noun'),
        start: tok.start,
        end: tok.end,
        isContent: true,
        isTarget: true,
      };
    }

    const type = classifyContent(b);
    return {
      surface: tok.surface,
      lemma: b,
      type,
      gender: null,
      image: null,
      en: glossFor(b, type),
      start: tok.start,
      end: tok.end,
      isContent: true,
      isTarget: false,
    };
  });
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/tokens.test.mjs
```

Expected: all pass. If the `dort`/verb classification test fails, confirm `dort` is in the `GLOSS` map (it is) so `classifyContent('dort')` returns `'verb'`.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/tokens.mjs Motamot/motamot-app/scripts/lib/tokens.test.mjs && git commit -m "feat(bank): offline offset-accurate token baking

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Resumable orchestration (JSONL stream, checkpoint, concurrency cap, backoff, manifest)

The driver `scripts/build-sentence-bank.mjs`: round-robins under-quota anchors, builds seed sets, generates candidates, runs the funnel (lint → anchor-presence → dedup → correctness → humor/safety → require all six axes → bake tokens → assign stable id), streams every candidate+verdict to append-only JSONL, checkpoints per batch, caps concurrency ~6 with exponential backoff on 429/5xx, and writes a manifest with per-image counts + model/prompt/validator versions. Pure helpers (id generation, theme/mechanism rotation, checkpoint merge) are unit-tested; the main loop is integration-run in calibration (Task 11).

**Files:**
- Create: `Motamot/motamot-app/scripts/lib/orchestration.mjs`
- Create: `Motamot/motamot-app/scripts/lib/orchestration.test.mjs`
- Create: `Motamot/motamot-app/scripts/build-sentence-bank.mjs`

Steps:

- [ ] Write the failing test first. Create `scripts/lib/orchestration.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import {
  stableId,
  pickTheme,
  pickMechanism,
  mergeCheckpoint,
  buildManifest,
  selectUnderQuotaAnchors,
  sixAxesPass,
} from './orchestration.mjs';

describe('stableId', () => {
  it('is deterministic for the same text', () => {
    expect(stableId('Le chat dort.')).toBe(stableId('Le chat dort.'));
  });
  it('differs for different text', () => {
    expect(stableId('Le chat dort.')).not.toBe(stableId('Le chien dort.'));
  });
  it('is a short hex string', () => {
    expect(stableId('x')).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe('pickTheme / pickMechanism', () => {
  it('rotate deterministically by index', () => {
    expect(pickTheme(0)).toBe(pickTheme(0));
    expect(typeof pickMechanism(3)).toBe('string');
  });
});

describe('selectUnderQuotaAnchors', () => {
  it('returns anchors below quota, lowest count first', () => {
    const anchors = [{ lemma: 'chat' }, { lemma: 'mer' }, { lemma: 'chien' }];
    const counts = { chat: 20, mer: 2, chien: 5 };
    const sel = selectUnderQuotaAnchors(anchors, counts, 20);
    expect(sel.map((a) => a.lemma)).toEqual(['mer', 'chien']);
  });
});

describe('sixAxesPass', () => {
  it('is true only when all six axes are true', () => {
    const ok = { grammar: true, semantics: true, frenchOnly: true, simplicity: true, humor: true, safety: true };
    expect(sixAxesPass(ok)).toBe(true);
    expect(sixAxesPass({ ...ok, humor: false })).toBe(false);
  });
});

describe('mergeCheckpoint', () => {
  it('merges per-anchor counts and accepted ids', () => {
    const a = { counts: { chat: 2 }, acceptedIds: ['a'] };
    const b = { counts: { chat: 1, mer: 3 }, acceptedIds: ['b'] };
    const m = mergeCheckpoint(a, b);
    expect(m.counts).toEqual({ chat: 3, mer: 3 });
    expect(m.acceptedIds.sort()).toEqual(['a', 'b']);
  });
});

describe('buildManifest', () => {
  it('records counts, totals and versions', () => {
    const man = buildManifest({
      counts: { chat: 18, mer: 22 },
      total: 40,
      generatorModel: 'claude-opus-4-8',
      generatorVersion: 'gen-1',
      validatorModel: 'claude-sonnet-4-6',
      validatorVersion: 'val-1',
    });
    expect(man.total).toBe(40);
    expect(man.perImageCounts.chat).toBe(18);
    expect(man.generatorModel).toBe('claude-opus-4-8');
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/orchestration.test.mjs
```

Expected: FAIL — cannot resolve `./orchestration.mjs`.

- [ ] Create `scripts/lib/orchestration.mjs` (pure helpers):

```js
// scripts/lib/orchestration.mjs
// Pure orchestration helpers. The impure loop lives in build-sentence-bank.mjs.

import { createHash } from 'node:crypto';

const THEMES = [
  'les animaux à la maison',
  'la cuisine et les repas',
  'le mauvais temps',
  'les objets du quotidien qui n’obéissent pas',
  'la vie de famille',
  'le jardin et la nature',
  'les transports',
  'le sommeil et les rêves',
  'la musique et les loisirs',
  'les petits accidents domestiques',
];

const MECHANISMS = [
  'une exagération absurde mais logique',
  'un objet ou un animal qui se comporte comme un humain',
  'une comparaison inattendue mais cohérente',
  'une situation embarrassante mais crédible',
  'un quiproquo simple',
  'une logique poussée à l’extrême',
];

/**
 * Stable 12-hex id from the sentence text. Survives regeneration: identical text
 * always yields the same id, so localStorage 'seen' state persists.
 * @param {string} text
 * @returns {string}
 */
export function stableId(text) {
  return createHash('sha256').update(text.normalize('NFC')).digest('hex').slice(0, 12);
}

/** @param {number} i @returns {string} */
export function pickTheme(i) {
  return THEMES[i % THEMES.length];
}

/** @param {number} i @returns {string} */
export function pickMechanism(i) {
  return MECHANISMS[i % MECHANISMS.length];
}

/**
 * Anchors strictly below quota, lowest count first (so coverage evens out).
 * @param {{ lemma: string }[]} anchors
 * @param {Record<string, number>} counts
 * @param {number} quota
 * @returns {{ lemma: string }[]}
 */
export function selectUnderQuotaAnchors(anchors, counts, quota) {
  return anchors
    .filter((a) => (counts[a.lemma] || 0) < quota)
    .sort((x, y) => (counts[x.lemma] || 0) - (counts[y.lemma] || 0));
}

/**
 * @param {{ grammar: boolean, semantics: boolean, frenchOnly: boolean, simplicity: boolean, humor: boolean, safety: boolean }} v
 * @returns {boolean}
 */
export function sixAxesPass(v) {
  return Boolean(
    v && v.grammar && v.semantics && v.frenchOnly && v.simplicity && v.humor && v.safety,
  );
}

/**
 * Merge two checkpoint fragments (counts add; acceptedIds union).
 * @param {{ counts: Record<string,number>, acceptedIds: string[] }} a
 * @param {{ counts: Record<string,number>, acceptedIds: string[] }} b
 */
export function mergeCheckpoint(a, b) {
  const counts = { ...a.counts };
  for (const [k, v] of Object.entries(b.counts)) counts[k] = (counts[k] || 0) + v;
  const acceptedIds = Array.from(new Set([...a.acceptedIds, ...b.acceptedIds]));
  return { counts, acceptedIds };
}

/**
 * @param {{ counts: Record<string,number>, total: number, generatorModel: string, generatorVersion: string, validatorModel: string, validatorVersion: string }} opts
 */
export function buildManifest(opts) {
  return {
    total: opts.total,
    perImageCounts: { ...opts.counts },
    generatorModel: opts.generatorModel,
    generatorVersion: opts.generatorVersion,
    validatorModel: opts.validatorModel,
    validatorVersion: opts.validatorVersion,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Run an array of async task factories with a concurrency cap.
 * @template T
 * @param {(() => Promise<T>)[]} factories
 * @param {number} concurrency
 * @returns {Promise<T[]>}
 */
export async function runWithConcurrency(factories, concurrency) {
  const results = new Array(factories.length);
  let next = 0;
  async function worker() {
    while (next < factories.length) {
      const i = next++;
      results[i] = await factories[i]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, factories.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Call `fn` with exponential backoff on 429/5xx-style errors.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ maxRetries?: number, baseMs?: number }} [opts]
 * @returns {Promise<T>}
 */
export async function withBackoff(fn, opts = {}) {
  const maxRetries = opts.maxRetries ?? 5;
  const baseMs = opts.baseMs ?? 1000;
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err && err.status;
      const retryable = status === 429 || (typeof status === 'number' && status >= 500) || err?.name === 'APIConnectionError';
      if (!retryable || attempt === maxRetries) throw err;
      const delay = Math.min(baseMs * 2 ** attempt + Math.random() * 500, 60000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/orchestration.test.mjs
```

Expected: all pass.

- [ ] Create the driver `scripts/build-sentence-bank.mjs`. It wires the pure modules + SDK. Supports `--count N` (calibration / capped runs), `--resume`, and an env-gated guard so the app build never triggers generation:

```js
#!/usr/bin/env node
// scripts/build-sentence-bank.mjs
// Offline, resumable sentence-bank builder. ONE-TIME batch — costs a few dollars.
// Requires ANTHROPIC_API_KEY. The app build NEVER runs this.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node scripts/build-sentence-bank.mjs [--count N] [--resume] [--calibrate]
//
// Outputs (in scripts/.bank-output/):
//   candidates.jsonl   append-only stream of every candidate + verdict
//   checkpoint.json    {counts, acceptedIds} merged after each batch
//   manifest.json      per-image counts + model/prompt/validator versions
//   accepted.json      array of fully-baked BankSentence objects
// Final assembly into src/data/sentenceBank.json is done by assemble step (Task 12).

import Anthropic from '@anthropic-ai/sdk';
import { mkdirSync, existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { illustratedNouns } from './lib/wordData.mjs';
import { deriveAnchors, PER_ANCHOR_QUOTA } from './lib/anchors.mjs';
import { generateCandidates, GENERATOR_MODEL, GENERATOR_VERSION } from './lib/generate.mjs';
import { mechanicalLint, anchorsPresent } from './lib/lint.mjs';
import { isDuplicate } from './lib/dedup.mjs';
import { validateCorrectness, VALIDATOR_MODEL, VALIDATOR_VERSION } from './lib/validateCorrectness.mjs';
import { validateHumorSafety } from './lib/validateHumorSafety.mjs';
import { bakeTokens } from './lib/tokens.mjs';
import {
  stableId, pickTheme, pickMechanism, selectUnderQuotaAnchors,
  sixAxesPass, mergeCheckpoint, buildManifest, runWithConcurrency, withBackoff,
} from './lib/orchestration.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '.bank-output');
const JSONL = join(OUT_DIR, 'candidates.jsonl');
const CHECKPOINT = join(OUT_DIR, 'checkpoint.json');
const MANIFEST = join(OUT_DIR, 'manifest.json');
const ACCEPTED = join(OUT_DIR, 'accepted.json');

const CONCURRENCY = 6;
const CANDIDATES_PER_CALL = 6;
const LEVELS = ['A1', 'A2', 'B1'];

function parseArgs(argv) {
  const a = { count: Infinity, resume: false, calibrate: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--count') a.count = parseInt(argv[++i], 10);
    else if (argv[i] === '--resume') a.resume = true;
    else if (argv[i] === '--calibrate') { a.calibrate = true; a.count = 200; }
  }
  return a;
}

function loadCheckpoint() {
  if (existsSync(CHECKPOINT)) return JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
  return { counts: {}, acceptedIds: [] };
}

function loadAccepted() {
  if (existsSync(ACCEPTED)) return JSON.parse(readFileSync(ACCEPTED, 'utf8'));
  return [];
}

function appendJsonl(record) {
  appendFileSync(JSONL, JSON.stringify(record) + '\n');
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY is required. This is a one-time offline batch.');
    process.exit(1);
  }
  const args = parseArgs(process.argv);
  mkdirSync(OUT_DIR, { recursive: true });

  const client = new Anthropic({ apiKey });
  const anchors = deriveAnchors(illustratedNouns);
  const anchorMeta = anchors;

  let checkpoint = args.resume ? loadCheckpoint() : { counts: {}, acceptedIds: [] };
  let accepted = args.resume ? loadAccepted() : [];
  if (!args.resume) {
    // Fresh run: truncate JSONL.
    writeFileSync(JSONL, '');
  }

  // Per-anchor bucket of accepted text (for dedup).
  const buckets = new Map();
  for (const s of accepted) {
    for (const lemma of s.anchors) {
      if (!buckets.has(lemma)) buckets.set(lemma, []);
      buckets.get(lemma).push(s.text);
    }
  }

  // Per-axis funnel stats for calibration reporting.
  const stats = {
    generated: 0, lintPass: 0, anchorPass: 0, dedupPass: 0,
    correctnessPass: 0, recycled: 0, humorPass: 0, safetyPass: 0, sixAxisPass: 0,
    correctnessCalls: 0, humorSafetyCalls: 0,
  };

  let batchIndex = 0;
  let totalAccepted = accepted.length;

  while (totalAccepted < args.count) {
    const under = selectUnderQuotaAnchors(anchors, checkpoint.counts, args.calibrate ? Infinity : PER_ANCHOR_QUOTA);
    if (under.length === 0 && !args.calibrate) {
      console.log('All anchors at quota.');
      break;
    }
    // One batch = CONCURRENCY anchor-seed jobs.
    const jobAnchors = (under.length ? under : anchors).slice(0, CONCURRENCY);
    const factories = jobAnchors.map((anchor, k) => async () => {
      const level = LEVELS[(batchIndex + k) % LEVELS.length];
      const theme = pickTheme(batchIndex + k);
      const mechanism = pickMechanism(batchIndex + k);
      const seed = [anchor];
      let candidates = [];
      try {
        candidates = await withBackoff(() =>
          generateCandidates(client, {
            anchors: seed,
            level,
            theme,
            humorMechanism: mechanism,
            candidateCount: CANDIDATES_PER_CALL,
          }),
        );
      } catch (err) {
        appendJsonl({ stage: 'generate', error: String(err), anchor: anchor.lemma });
        return [];
      }

      const localAccepted = [];
      for (const text of candidates) {
        stats.generated++;
        const lemmas = [anchor.lemma];

        const lint = mechanicalLint(text, { level });
        if (!lint.pass) { appendJsonl({ stage: 'lint', text, verdict: 'FAIL', reason: lint.reason }); continue; }
        stats.lintPass++;

        if (!anchorsPresent(text, lemmas)) { appendJsonl({ stage: 'anchor', text, verdict: 'FAIL' }); continue; }
        stats.anchorPass++;

        const bucket = buckets.get(anchor.lemma) || [];
        const dup = isDuplicate(text, bucket);
        if (dup.duplicate) { appendJsonl({ stage: 'dedup', text, verdict: 'FAIL', reason: dup.reason, against: dup.against }); continue; }
        stats.dedupPass++;

        let correctness;
        try {
          stats.correctnessCalls++;
          correctness = await withBackoff(() => validateCorrectness(client, text, level));
        } catch (err) {
          appendJsonl({ stage: 'correctness', text, error: String(err) }); continue;
        }
        if (!correctness.acceptedText) { appendJsonl({ stage: 'correctness', text, verdict: 'FAIL', axes: correctness.axes }); continue; }
        if (correctness.recycled) stats.recycled++;
        stats.correctnessPass++;
        const finalText = correctness.acceptedText;

        let hs;
        try {
          stats.humorSafetyCalls++;
          hs = await withBackoff(() => validateHumorSafety(client, finalText));
        } catch (err) {
          appendJsonl({ stage: 'humorSafety', text: finalText, error: String(err) }); continue;
        }
        if (hs.humor) stats.humorPass++;
        if (hs.safety) stats.safetyPass++;

        const validation = {
          grammar: correctness.axes.grammar,
          semantics: correctness.axes.semantics,
          frenchOnly: correctness.axes.frenchOnly,
          simplicity: correctness.axes.simplicity,
          humor: hs.humor,
          safety: hs.safety,
        };
        if (!sixAxesPass(validation)) {
          appendJsonl({ stage: 'sixAxis', text: finalText, verdict: 'FAIL', validation });
          continue;
        }
        stats.sixAxisPass++;

        // Re-check anchor presence in the (possibly corrected) final text.
        if (!anchorsPresent(finalText, lemmas)) { appendJsonl({ stage: 'anchor-final', text: finalText, verdict: 'FAIL' }); continue; }

        const tokens = bakeTokens(finalText, lemmas, anchorMeta);
        // Hard assertion: offsets must reconstruct surfaces.
        for (const t of tokens) {
          if (finalText.slice(t.start, t.end) !== t.surface) {
            appendJsonl({ stage: 'bake', text: finalText, verdict: 'FAIL', reason: 'offset mismatch' });
            throw new Error(`Token offset mismatch in: ${finalText}`);
          }
        }

        const id = stableId(finalText);
        const sentence = {
          id,
          text: finalText,
          level,
          anchors: lemmas,
          theme,
          humorMechanism: mechanism,
          audio: null,
          tokens,
          validation,
        };
        appendJsonl({ stage: 'accept', id, text: finalText });
        localAccepted.push(sentence);
      }
      return localAccepted;
    });

    const batchResults = await runWithConcurrency(factories, CONCURRENCY);
    const newSentences = batchResults.flat();

    // Merge into accepted + buckets + checkpoint.
    const batchCounts = {};
    for (const s of newSentences) {
      if (checkpoint.acceptedIds.includes(s.id)) continue; // de-dup by id across resume
      accepted.push(s);
      checkpoint.acceptedIds.push(s.id);
      for (const lemma of s.anchors) {
        batchCounts[lemma] = (batchCounts[lemma] || 0) + 1;
        if (!buckets.has(lemma)) buckets.set(lemma, []);
        buckets.get(lemma).push(s.text);
      }
    }
    checkpoint = mergeCheckpoint(checkpoint, { counts: batchCounts, acceptedIds: [] });
    totalAccepted = accepted.length;

    // Checkpoint after each batch.
    writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
    writeFileSync(ACCEPTED, JSON.stringify(accepted, null, 2));
    writeFileSync(MANIFEST, JSON.stringify(buildManifest({
      counts: checkpoint.counts,
      total: totalAccepted,
      generatorModel: GENERATOR_MODEL,
      generatorVersion: GENERATOR_VERSION,
      validatorModel: VALIDATOR_MODEL,
      validatorVersion: VALIDATOR_VERSION,
    }), null, 2));

    batchIndex++;
    console.log(`Batch ${batchIndex}: accepted ${totalAccepted} total (this batch +${newSentences.length})`);
  }

  // Calibration report.
  if (args.calibrate) {
    printCalibration(stats, totalAccepted);
  }
  console.log(`Done. ${totalAccepted} accepted sentences in ${ACCEPTED}.`);
}

function printCalibration(stats, total) {
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  // Anthropic pricing per 1M tokens (from claude-api skill): Opus 4.8 $5 in / $25 out; Sonnet 4.6 $3 in / $15 out.
  // Rough per-sentence cost estimate: generation amortized over CANDIDATES_PER_CALL,
  // plus one correctness call (sometimes two on recycle) + one humor/safety call.
  console.log('\n==== CALIBRATION ====');
  console.log(`Generated candidates:     ${stats.generated}`);
  console.log(`  passed lint:            ${stats.lintPass} (${pct(stats.lintPass, stats.generated)}%)`);
  console.log(`  passed anchor-presence: ${stats.anchorPass} (${pct(stats.anchorPass, stats.lintPass)}% of lint)`);
  console.log(`  passed dedup:           ${stats.dedupPass} (${pct(stats.dedupPass, stats.anchorPass)}% of anchor)`);
  console.log(`  passed correctness:     ${stats.correctnessPass} (${pct(stats.correctnessPass, stats.dedupPass)}% of dedup; recycled ${stats.recycled})`);
  console.log(`  humor PASS:             ${stats.humorPass} (${pct(stats.humorPass, stats.correctnessPass)}% of correctness)`);
  console.log(`  safety PASS:            ${stats.safetyPass} (${pct(stats.safetyPass, stats.correctnessPass)}% of correctness)`);
  console.log(`  ALL SIX axes PASS:      ${stats.sixAxisPass} (${pct(stats.sixAxisPass, stats.generated)}% of generated)`);
  console.log(`Accepted total:           ${total}`);
  console.log(`Claude calls: correctness=${stats.correctnessCalls} humorSafety=${stats.humorSafetyCalls}`);
  console.log('Estimate full-run cost by extrapolating call counts to ~1000 accepted sentences (see plan Task 11).');
  console.log('=====================\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
```

- [ ] Verify the full test suite still passes (the driver isn't imported by tests, only its helpers):

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
```

Expected: all suites pass.

- [ ] Add `scripts/.bank-output/` to `.gitignore` so intermediate JSONL/checkpoints are not committed (the final `sentenceBank.json` is committed in Task 12, not these). Check whether a `.gitignore` exists in `Motamot/motamot-app`:

```bash
ls -la /Users/mathias.bonnet/Zivver/Motamot/motamot-app/.gitignore
```

- [ ] Append the ignore rule. If `.gitignore` exists, add the line `scripts/.bank-output/` to it via Edit; if it does not exist, create it with:

```
# Sentence-bank pipeline intermediate output (not committed)
scripts/.bank-output/
```

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/lib/orchestration.mjs Motamot/motamot-app/scripts/lib/orchestration.test.mjs Motamot/motamot-app/scripts/build-sentence-bank.mjs Motamot/motamot-app/.gitignore && git commit -m "feat(bank): resumable orchestration driver (JSONL stream, checkpoint, backoff, manifest)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: count=200 CALIBRATION run (manual, gated on ANTHROPIC_API_KEY)

A documented manual step run BEFORE the full run, to measure per-axis PASS rate and per-sentence Claude cost, then extrapolate full-run cost. This is an operator action, not a unit test — but it has a concrete command and an extrapolation worksheet.

**Files:**
- (No new committed code; produces `scripts/.bank-output/manifest.json` and console report, both git-ignored.)

Steps:

- [ ] Run the calibration batch. From `Motamot/motamot-app`, with a real key (this costs a few cents — generation is Opus 4.8, validation is Sonnet 4.6):

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node scripts/build-sentence-bank.mjs --calibrate
```

Expected: batch progress lines, then a `==== CALIBRATION ====` block reporting:
- candidates generated, and the survivor count + percentage at each funnel stage (lint, anchor, dedup, correctness, humor, safety, all-six),
- the number of correctness and humor/safety Claude calls made,
- accepted total (capped at 200 in calibrate mode via `--count` defaulting to 200).

- [ ] Compute per-sentence cost and extrapolate. Use the call counts from the report and these per-1M-token prices (from the claude-api skill): Opus 4.8 = $5 input / $25 output; Sonnet 4.6 = $3 input / $15 output. Worksheet:
  - Generation: `(generated / CANDIDATES_PER_CALL)` Opus calls. Each call ≈ system+user prompt (~600 input tokens) + ~6 sentences output (~300 tokens) → ~`(600*5 + 300*25)/1e6 ≈ $0.0105` per call.
  - Correctness: `correctnessCalls` Sonnet calls, ~400 input + ~200 output → `(400*3 + 200*15)/1e6 ≈ $0.0042` each.
  - Humor/safety: `humorSafetyCalls` Sonnet calls, ~350 input + ~80 output → `(350*3 + 80*15)/1e6 ≈ $0.0022` each.
  - Per-accepted-sentence cost = (sum of the above) / `accepted total`.
  - Full-run estimate = per-accepted-sentence cost × ~1000 (target bank size).

- [ ] DECISION GATE: confirm the all-six PASS rate is healthy (spec warns yield may be 5–15%; do NOT lower the bar to hit quota) and the extrapolated full-run cost is acceptable (spec: "a few dollars"). Record the numbers in the PR description when the work is shipped. If yield is below ~5%, revisit the generation prompt (Task 4) or humor gate strictness (Task 8) before the full run — do not weaken validation.

- [ ] (No commit — calibration output is git-ignored. This task is a checkpoint, not a code change.)

---

### Task 12: Full run, assemble + schema-validate the final `src/data/sentenceBank.json`, commit it

After calibration passes the gate, run the full batch, then assemble `accepted.json` into the committed `sentenceBank.json` and run a schema-check test that asserts: every shipped sentence has all six validation axes true, every token offset is valid, every anchor lemma resolves to a real anchor + image, and the per-image quota floor is met.

**Files:**
- Create: `Motamot/motamot-app/scripts/assemble-bank.mjs`
- Create: `Motamot/motamot-app/scripts/lib/schemaCheck.mjs`
- Create: `Motamot/motamot-app/scripts/lib/schemaCheck.test.mjs`
- Create (generated, committed): `Motamot/motamot-app/src/data/sentenceBank.json`

Steps:

- [ ] Write the schema-check FAILING test first. Create `scripts/lib/schemaCheck.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { validateBank } from './schemaCheck.mjs';

const anchor = { lemma: 'chat', gender: 'm', image: 'chat.png' };

function goodBank() {
  const text = 'Le chat dort.';
  return {
    schemaVersion: 1,
    generatorModel: 'claude-opus-4-8',
    generatorVersion: 'gen-1',
    validatorModel: 'claude-sonnet-4-6',
    validatorVersion: 'val-1',
    generatedAt: new Date().toISOString(),
    sentences: [
      {
        id: 'abc123abc123',
        text,
        level: 'A1',
        anchors: ['chat'],
        theme: 't',
        humorMechanism: 'm',
        audio: null,
        tokens: [
          { surface: 'Le', lemma: 'le', type: 'function', gender: null, image: null, en: null, start: 0, end: 2, isContent: false, isTarget: false },
          { surface: 'chat', lemma: 'chat', type: 'noun', gender: 'm', image: 'chat.png', en: 'cat', start: 3, end: 7, isContent: true, isTarget: true },
          { surface: 'dort', lemma: 'dort', type: 'verb', gender: null, image: null, en: 'sleeps', start: 8, end: 12, isContent: true, isTarget: false },
        ],
        validation: { grammar: true, semantics: true, frenchOnly: true, simplicity: true, humor: true, safety: true },
      },
    ],
  };
}

describe('validateBank', () => {
  it('accepts a well-formed bank', () => {
    const r = validateBank(goodBank(), [anchor], { quotaFloor: 0 });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects a sentence missing a true axis', () => {
    const b = goodBank();
    b.sentences[0].validation.humor = false;
    const r = validateBank(b, [anchor], { quotaFloor: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/axis|humor/i);
  });

  it('rejects a token whose offsets do not reconstruct its surface', () => {
    const b = goodBank();
    b.sentences[0].tokens[1].end = 6; // breaks slice
    const r = validateBank(b, [anchor], { quotaFloor: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/offset/i);
  });

  it('rejects an anchor that does not resolve to a known illustrated noun', () => {
    const b = goodBank();
    b.sentences[0].anchors = ['licorne'];
    const r = validateBank(b, [anchor], { quotaFloor: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/anchor|licorne/i);
  });

  it('rejects an image token pointing at a non-anchor image', () => {
    const b = goodBank();
    b.sentences[0].tokens[1].image = 'dragon.png';
    const r = validateBank(b, [anchor], { quotaFloor: 0 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/image/i);
  });

  it('enforces the per-image quota floor', () => {
    const r = validateBank(goodBank(), [anchor], { quotaFloor: 5 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/quota/i);
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/schemaCheck.test.mjs
```

Expected: FAIL — cannot resolve `./schemaCheck.mjs`.

- [ ] Create `scripts/lib/schemaCheck.mjs`:

```js
// scripts/lib/schemaCheck.mjs
// Validate an assembled SentenceBank against the contract + invariants.

const LEVELS = new Set(['A1', 'A2', 'B1']);
const TOKEN_TYPES = new Set(['noun', 'verb', 'adjective', 'adverb', 'function']);

/**
 * @param {import('../../src/types/bank').SentenceBank} bank
 * @param {{ lemma: string, gender: 'm'|'f', image: string }[]} anchors
 * @param {{ quotaFloor: number }} opts
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateBank(bank, anchors, opts) {
  const errors = [];
  const anchorByLemma = new Map(anchors.map((a) => [a.lemma, a]));
  const validImages = new Set(anchors.map((a) => a.image));
  const perImageCounts = {};
  const seenIds = new Set();

  if (bank.schemaVersion !== 1) errors.push(`schemaVersion must be 1, got ${bank.schemaVersion}`);
  if (!Array.isArray(bank.sentences)) {
    errors.push('sentences is not an array');
    return { ok: false, errors };
  }

  for (const s of bank.sentences) {
    const tag = `sentence ${s.id}`;
    if (seenIds.has(s.id)) errors.push(`${tag}: duplicate id`);
    seenIds.add(s.id);
    if (!LEVELS.has(s.level)) errors.push(`${tag}: bad level ${s.level}`);

    // All six axes must be true.
    const v = s.validation || {};
    for (const axis of ['grammar', 'semantics', 'frenchOnly', 'simplicity', 'humor', 'safety']) {
      if (v[axis] !== true) errors.push(`${tag}: validation axis ${axis} not true`);
    }

    // Anchors resolve.
    for (const lemma of s.anchors) {
      if (!anchorByLemma.has(lemma)) errors.push(`${tag}: anchor "${lemma}" does not resolve to a known illustrated noun`);
      else perImageCounts[lemma] = (perImageCounts[lemma] || 0) + 1;
    }

    // Tokens.
    for (const t of s.tokens) {
      if (s.text.slice(t.start, t.end) !== t.surface) {
        errors.push(`${tag}: token offset mismatch ("${t.surface}" vs slice "${s.text.slice(t.start, t.end)}")`);
      }
      if (!TOKEN_TYPES.has(t.type)) errors.push(`${tag}: bad token type ${t.type}`);
      if (t.image !== null && !validImages.has(t.image)) {
        errors.push(`${tag}: token image "${t.image}" is not an anchor image`);
      }
      if (t.isContent && (t.en === null || t.en === undefined)) {
        errors.push(`${tag}: content token "${t.surface}" has null gloss`);
      }
      if (!t.isContent && t.en !== null) {
        errors.push(`${tag}: function token "${t.surface}" should have null gloss`);
      }
    }
  }

  // Per-image quota floor.
  for (const a of anchors) {
    const c = perImageCounts[a.lemma] || 0;
    if (c < opts.quotaFloor) errors.push(`quota: anchor "${a.lemma}" has ${c} < floor ${opts.quotaFloor}`);
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/schemaCheck.test.mjs
```

Expected: all pass.

- [ ] Create the assembler `scripts/assemble-bank.mjs`. It reads `accepted.json`, sorts sentences by id for deterministic diffs, wraps them in the `SentenceBank` envelope, runs `validateBank` with `quotaFloor` (default 15 = `PER_ANCHOR_QUOTA_MIN`), and writes `src/data/sentenceBank.json` only if validation passes:

```js
#!/usr/bin/env node
// scripts/assemble-bank.mjs
// Assemble scripts/.bank-output/accepted.json into the committed
// src/data/sentenceBank.json, after validating against the contract.
//
// Usage: node scripts/assemble-bank.mjs [--quota-floor N]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { illustratedNouns } from './lib/wordData.mjs';
import { deriveAnchors, PER_ANCHOR_QUOTA_MIN } from './lib/anchors.mjs';
import { GENERATOR_MODEL, GENERATOR_VERSION } from './lib/generate.mjs';
import { VALIDATOR_MODEL, VALIDATOR_VERSION } from './lib/validateCorrectness.mjs';
import { validateBank } from './lib/schemaCheck.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCEPTED = join(__dirname, '.bank-output', 'accepted.json');
const OUTPUT = join(__dirname, '..', 'src', 'data', 'sentenceBank.json');

function parseArgs(argv) {
  let quotaFloor = PER_ANCHOR_QUOTA_MIN;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--quota-floor') quotaFloor = parseInt(argv[++i], 10);
  }
  return { quotaFloor };
}

function main() {
  const { quotaFloor } = parseArgs(process.argv);
  if (!existsSync(ACCEPTED)) {
    console.error(`Missing ${ACCEPTED}. Run the build first.`);
    process.exit(1);
  }
  const accepted = JSON.parse(readFileSync(ACCEPTED, 'utf8'));
  accepted.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const bank = {
    schemaVersion: 1,
    generatorModel: GENERATOR_MODEL,
    generatorVersion: GENERATOR_VERSION,
    validatorModel: VALIDATOR_MODEL,
    validatorVersion: VALIDATOR_VERSION,
    generatedAt: new Date().toISOString(),
    sentences: accepted,
  };

  const anchors = deriveAnchors(illustratedNouns);
  const result = validateBank(bank, anchors, { quotaFloor });
  if (!result.ok) {
    console.error(`Validation FAILED with ${result.errors.length} errors:`);
    for (const e of result.errors.slice(0, 50)) console.error('  -', e);
    process.exit(1);
  }

  writeFileSync(OUTPUT, JSON.stringify(bank, null, 2) + '\n');
  console.log(`Wrote ${bank.sentences.length} sentences to ${OUTPUT}.`);
}

main();
```

- [ ] Add an `assemble` script to `package.json` scripts (after `bank`):

```json
    "bank": "node scripts/build-sentence-bank.mjs",
    "bank:assemble": "node scripts/assemble-bank.mjs"
```

- [ ] OPERATOR: run the full build (after Task 11's gate passed). This is the costly one-time batch (~$ a few dollars). From `Motamot/motamot-app`:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node scripts/build-sentence-bank.mjs --count 1000
```

Expected: batches run until ~1000 accepted (or all anchors hit `PER_ANCHOR_QUOTA`). If it crashes, re-run with `--resume` to continue from the checkpoint:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node scripts/build-sentence-bank.mjs --count 1000 --resume
```

- [ ] Assemble the committed JSON:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm bank:assemble
```

Expected: `Wrote N sentences to .../src/data/sentenceBank.json.` If validation fails, fix the offending sentences (or regenerate) — do NOT hand-edit `sentenceBank.json` to pass.

- [ ] Add a committed schema-check test that loads the REAL `sentenceBank.json` and asserts it passes `validateBank`. This guards against future regressions. Create `scripts/lib/sentenceBank.schema.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBank } from './schemaCheck.mjs';
import { deriveAnchors, PER_ANCHOR_QUOTA_MIN } from './anchors.mjs';
import { illustratedNouns } from './wordData.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BANK = join(__dirname, '..', '..', 'src', 'data', 'sentenceBank.json');

describe('shipped sentenceBank.json', () => {
  it('exists and passes the full contract + quota-floor validation', () => {
    expect(existsSync(BANK)).toBe(true);
    const bank = JSON.parse(readFileSync(BANK, 'utf8'));
    const anchors = deriveAnchors(illustratedNouns);
    const result = validateBank(bank, anchors, { quotaFloor: PER_ANCHOR_QUOTA_MIN });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('ships between 600 and 1500 sentences (spec target)', () => {
    const bank = JSON.parse(readFileSync(BANK, 'utf8'));
    expect(bank.sentences.length).toBeGreaterThanOrEqual(600);
    expect(bank.sentences.length).toBeLessThanOrEqual(1500);
  });
});
```

- [ ] Run the full suite — expect PASS (this now includes the real-bank schema test):

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
```

Expected: all suites pass, including `shipped sentenceBank.json`.

- [ ] Ensure `vite.config.ts` precaches the JSON. The current `workbox.globPatterns` is `['**/*.{js,css,html,ico,png,svg,woff2}']` — it has NO `json`. The bank is imported by the app (so Vite bundles it into JS), meaning it is precached via the JS chunk and `json` in globPatterns is not strictly required. NOTE for the frontend plan: if the bank is ever served as a standalone `/assets/*.json` asset rather than bundled, add `json` to `globPatterns`. This plan does not modify `vite.config.ts`; it flags the dependency. (No code change here.)

- [ ] Commit the bank + assembler + scripts. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/scripts/assemble-bank.mjs Motamot/motamot-app/scripts/lib/schemaCheck.mjs Motamot/motamot-app/scripts/lib/schemaCheck.test.mjs Motamot/motamot-app/scripts/lib/sentenceBank.schema.test.mjs Motamot/motamot-app/package.json Motamot/motamot-app/src/data/sentenceBank.json && git commit -m "feat(bank): assemble, schema-validate, and commit sentenceBank.json

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If `.git/index.lock` contention occurs, retry once after a short pause. The JSON may be large; the commit is a single artifact and that is intentional (spec: bundle directly, <100KB gzipped).

---

### Task 13: Document the human spot-read + the "report this sentence" contract

A documented manual release gate (100% human spot-read) and the data contract the frontend's "report this sentence" button must send. No generation code — a committed reviewer doc + a tiny helper the frontend will call.

**Files:**
- Create: `Motamot/motamot-app/docs/sentence-bank-review.md`
- Create: `Motamot/motamot-app/src/data/reportSentence.ts`
- Create: `Motamot/motamot-app/scripts/lib/reportUrl.test.mjs` (tests the URL builder via a mirrored pure fn)
- Create: `Motamot/motamot-app/scripts/lib/reportUrl.mjs`

Steps:

- [ ] Create the reviewer doc `docs/sentence-bank-review.md`:

```markdown
# Sentence-bank release review

The bank is a permanent, screenshot-able, child-accessible public artifact with
no runtime kill switch. Before any release that changes `src/data/sentenceBank.json`:

## Mandatory: 100% human spot-read

1. Run `pnpm test` — confirm `shipped sentenceBank.json` passes (all six axes true,
   offsets valid, anchors resolve, per-image quota floor met).
2. Read EVERY sentence in `src/data/sentenceBank.json` (the `sentences[].text` fields).
   The automated safety gate is necessary but not sufficient — a human reads all of it.
3. For any sentence that is unsafe, unfunny-but-shipped, or wrong, delete it from
   `accepted.json` (or regenerate) and re-run `pnpm bank:assemble`. Never hand-edit
   `sentenceBank.json`.
4. Record the review (reviewer, date, count read) in the release PR description.

Do NOT lower the validation bar to hit a quota. 600 funny+safe > 1200 filler.

## "Report this sentence" affordance

The frontend implements a button that opens a prefilled GitHub issue. The button
needs only two fields from the runtime bank:

- `sentence.id`   (stable; survives regeneration)
- `sentence.text`

These feed the next regeneration: reported ids are removed from `accepted.json`
before the next `pnpm bank:assemble`. The URL is built by
`src/data/reportSentence.ts` → `buildReportIssueUrl({ id, text })`.
```

- [ ] Write the failing test first for the URL builder. Create `scripts/lib/reportUrl.test.mjs`:

```js
import { describe, it, expect } from 'vitest';
import { buildReportIssueUrl, REPORT_REPO } from './reportUrl.mjs';

describe('buildReportIssueUrl', () => {
  it('targets the configured repo issues/new endpoint', () => {
    const url = buildReportIssueUrl({ id: 'abc123abc123', text: 'Le chat dort.' });
    expect(url.startsWith(`https://github.com/${REPORT_REPO}/issues/new`)).toBe(true);
  });
  it('encodes the sentence id and text into title and body', () => {
    const url = buildReportIssueUrl({ id: 'abc123abc123', text: 'Le chat rit fort.' });
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('abc123abc123');
    expect(decoded).toContain('Le chat rit fort.');
  });
  it('url-encodes special characters in the sentence', () => {
    const url = buildReportIssueUrl({ id: 'x', text: "L'oiseau & le chat." });
    // raw ampersand must be percent-encoded so it does not split query params
    expect(url).not.toContain('& le chat');
    expect(url).toContain('%26');
  });
});
```

- [ ] Run it — expect FAIL:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/reportUrl.test.mjs
```

Expected: FAIL — cannot resolve `./reportUrl.mjs`.

- [ ] Create the pure `.mjs` builder (the `.ts` frontend file re-exports the same logic). Create `scripts/lib/reportUrl.mjs`:

```js
// scripts/lib/reportUrl.mjs
// Pure builder for the "report this sentence" prefilled GitHub issue URL.
// Mirrored by src/data/reportSentence.ts for the app to import.

export const REPORT_REPO = 'mathias-bonnet/Motamot';

/**
 * @param {{ id: string, text: string }} sentence
 * @returns {string}
 */
export function buildReportIssueUrl(sentence) {
  const title = `Report sentence ${sentence.id}`;
  const body = `Reported sentence:\n\n> ${sentence.text}\n\nid: ${sentence.id}\n\nReason (please describe):`;
  const params = new URLSearchParams({
    title,
    body,
    labels: 'sentence-report',
  });
  return `https://github.com/${REPORT_REPO}/issues/new?${params.toString()}`;
}
```

- [ ] Run it — expect PASS:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test scripts/lib/reportUrl.test.mjs
```

Expected: all pass. (If `REPORT_REPO` differs from the real GitHub slug, the operator updates the constant; the test only asserts structure.)

- [ ] Create the TypeScript app-facing module `src/data/reportSentence.ts` (frontend imports this; keep logic identical to the `.mjs`):

```ts
// src/data/reportSentence.ts
// App-facing builder for the "report this sentence" prefilled GitHub issue URL.
// The frontend's report button calls buildReportIssueUrl({ id, text }).

import type { BankSentence } from '../types/bank';

export const REPORT_REPO = 'mathias-bonnet/Motamot';

export function buildReportIssueUrl(
  sentence: Pick<BankSentence, 'id' | 'text'>,
): string {
  const title = `Report sentence ${sentence.id}`;
  const body = `Reported sentence:\n\n> ${sentence.text}\n\nid: ${sentence.id}\n\nReason (please describe):`;
  const params = new URLSearchParams({
    title,
    body,
    labels: 'sentence-report',
  });
  return `https://github.com/${REPORT_REPO}/issues/new?${params.toString()}`;
}
```

- [ ] Type-check the new TS module:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && npx tsc --noEmit src/data/reportSentence.ts
```

Expected: clean (it imports the `BankSentence` type from `src/types/bank.ts`).

- [ ] Run the full suite one final time:

```bash
cd /Users/mathias.bonnet/Zivver/Motamot/motamot-app && pnpm test
```

Expected: all suites pass.

- [ ] Commit. From git root:

```bash
cd /Users/mathias.bonnet/Zivver && git add Motamot/motamot-app/docs/sentence-bank-review.md Motamot/motamot-app/src/data/reportSentence.ts Motamot/motamot-app/scripts/lib/reportUrl.mjs Motamot/motamot-app/scripts/lib/reportUrl.test.mjs && git commit -m "feat(bank): human spot-read doc + report-sentence URL contract

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Cross-plan notes (for the frontend and audio plans)

- The shared type file is `src/types/bank.ts` (Task 1) — import `SentenceBank`, `BankSentence`, `BankToken`, `BankValidation`, `BankLevel`, `BankTokenType`, `BankGender` from it. Do not redefine these.
- The committed data artifact is `src/data/sentenceBank.json` (Task 12), matching the contract exactly.
- The "report this sentence" button (frontend) calls `buildReportIssueUrl({ id, text })` from `src/data/reportSentence.ts` (Task 13) — it needs only `sentence.id` and `sentence.text`.
- The `audio` field on every shipped sentence is `null` until the audio batch runs; the audio plan rewrites those filenames back into `sentenceBank.json` and must preserve all other fields and the `schemaVersion`/version stamps.
- This plan deletes `scripts/evaluate-sentences.mjs` and removes the `evaluate` package script (Task 7).
- `vite.config.ts` `workbox.globPatterns` has no `json` (Task 12 flags this): fine if the bank is bundled into JS, but if it is ever served as a standalone JSON asset, the frontend plan must add `json` to `globPatterns`.
