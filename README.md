# Motamot

Learn French ten words at a time, then see several of them in a short, gently funny everyday scene. Motamot is a static React + TypeScript app with an old-school chalkboard and the original Playwrite FR Trad handwriting.

## What changed

- **Complete French examples instead of live AI generation.** The app contains 72 authored sentences, each with explicit vocabulary forms and a small grammar explanation. The text is never assembled from unrelated words or automatically inflected.
- **Sentence-first lessons.** Each round includes all 3–7 annotated words from its sentence and enough additional words from the full vocabulary to reach ten. The order is shuffled. Sentences cycle without repeats until the collection is exhausted; reloading starts a new cycle.
- **1,273 dictionary entries.** Duplicate nouns were removed while keeping their illustrations. Nouns show definite articles and gender, with elision for words such as l’eau and l’homme and an explicit exception for le héros. Five prepositions previously classified as adverbs now have the right label.
- **A calmer chalkboard.** Explicit next/back buttons, a revisitable word list, highlighted words in sentences, visible progress, keyboard focus, small-screen scrolling, zoom and reduced-motion support.
- **French pronunciation.** Listen to each word or the whole sentence, at normal or slower speed. The browser prefers a France French voice and then another French voice. It never silently chooses an English voice. Voices load asynchronously; a missing French voice or speech error produces a useful message. Voice quality and offline availability depend on the device; some browser voices use a remote service. No microphone permission is needed.
- **50 local illustrations and local fonts.** The app no longer depends on Supabase or Google Fonts at runtime. The PWA caches text, images and fonts for use after the first successful online visit.

## Cost and limitations

No user account, API key, model download, backend or paid service is needed. The existing GitHub Pages workflow still hosts the app; a separate private Sites preview may be used to review changes. Runtime dependencies are React and React DOM only.

The tradeoff is finite sentence variety: 72 complete examples, rather than unlimited AI output. Additional vocabulary is sampled across the full lexicon, but only the annotated words are guaranteed a sentence example in that round. Automated checks verify annotations, length, vocabulary coverage and lesson behavior; they do **not** prove grammar or semantic correctness. New or changed examples should receive a fluent French editorial review.

## Development

Use Node 22.18+ (CI uses Node 24).

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

The application is static. Relative asset URLs work both at `/Motamot/` on GitHub Pages and at the root of another static host. `dist/` contains the distributable app. The production build also generates its service worker and manifest.

## Maintaining the French content

Add a complete example in `src/data/sentences.ts`. Its vocabulary annotations explicitly map the dictionary lemma to the exact written form, for example `v('dormir', 'dort')` or `a('vieux', 'vieil')`. Do not substitute arbitrary nouns, verbs or adjectives into existing sentences. Add a dictionary entry if needed, preserving its gender and part of speech. Every example needs a short explanation and 3–10 distinct annotated vocabulary entries.

Run `npm test` after editing content. Checks cover every example and thousands of shuffled lessons, articles and elision, inflected-word highlighting, repetition and image availability. They are structural safeguards, not a substitute for reviewing French meaning and usage.

Images are in `public/images/`. The original image-generation scripts are optional maintenance utilities, not used by the app or its build. Font licenses are included in `public/fonts/OFL.txt`.
