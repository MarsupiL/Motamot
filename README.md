# Motamot

Learn French ten words at a time, then see several of them in a short, gently funny everyday scene. Motamot is a static React + TypeScript app with an old-school chalkboard and the original Playwrite FR Trad handwriting.

## What changed

- **Complete French examples instead of live AI generation.** The app contains 72 authored sentences, each with explicit vocabulary forms and an editorial grammar note kept in the source data. The text is never assembled from unrelated words or automatically inflected.
- **Sentence-first lessons.** Each round includes all 3–7 annotated words from its sentence and enough additional words from the full vocabulary to reach ten. The order is shuffled. Sentences cycle without repeats until the collection is exhausted; reloading starts a new cycle.
- **1,273 dictionary entries.** Duplicate nouns were removed while keeping their illustrations. Nouns show definite articles, with elision for words such as l’eau and l’homme and an explicit exception for le héros. Gender and part of speech remain in the content data without extra labels on the board.
- **A simpler chalkboard.** Larger vocabulary words, no grammar labels or sentence notes, and a single listen button. Next/back buttons, a revisitable word list, highlighted words in sentences, visible progress, keyboard focus, small-screen scrolling, zoom and reduced-motion support remain available.
- **Tap or swipe to move.** In the word/sentence area, tap the right half or swipe left to advance; tap the left half or swipe right to go back. Navigation crosses lesson boundaries and preserves the original words and order when revisiting a lesson. Vertical scrolling, pinch zoom, long presses and audio controls do not turn the page.
- **Phone-friendly lessons.** Full-width navigation and larger touch targets on small screens, a collapsible vocabulary list, safe-area spacing around notches and home indicators, and support for both portrait and landscape. Installed mode keeps the system status bar available.
- **A consistent French feminine voice.** Every word and sentence has a locally generated neural speech recording using Kokoro’s `ff_siwis` voice. Small MP3s load only when “Écouter” is pressed; phones do not download or run an AI model. Playback preserves the sampled delivery. Moving to another word stops the previous recording, and failed playback can be retried. No installed system voice or microphone permission is needed.
- **50 local illustrations and local fonts.** The app no longer depends on Supabase or Google Fonts at runtime. The PWA caches text, images and fonts for use after the first successful online visit.
- **A chalk speech-bubble icon.** The selected yellow handwritten “m” appears on the home screen and browser tab. Opaque PNG exports cover 32, 48, 180, 192 and 512 pixels, with the full bubble inside the maskable icon safe area. The original artwork and export notes live in `assets/branding/`.

## Cost and limitations

No user account, API key, model download, backend or paid service is needed. The existing GitHub Pages workflow still hosts the app; a separate private Sites preview may be used to review changes. Runtime dependencies are React and React DOM only.

The tradeoff is finite sentence variety: 72 complete examples, rather than unlimited AI output. Additional vocabulary is sampled across the full lexicon, but only the annotated words are guaranteed a sentence example in that round. Automated checks verify annotations, length, vocabulary coverage and lesson behavior; they do **not** prove grammar or semantic correctness. New or changed examples should receive a fluent French editorial review.

Audio is synthetic, with the same voice on each supported device. Recordings are deliberately excluded from the PWA’s initial download, so uncached audio needs a connection. Text, images and fonts remain available offline after installation. Changing the French content also requires generating its new recording; an exact-text index and automated coverage check prevent a changed sentence from silently playing an old recording.

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

## Maintaining pronunciation

The finished MP3s in `public/audio/` are committed, so normal development and deployment need no speech dependencies. `src/data/pronunciations.json` maps the exact displayed text to a recording. The optional generator uses Python 3.11–3.13, Node and a local copy of the model, with no cloud API.

1. Create a Python virtual environment outside the repository and install `scripts/audio-requirements.txt` into it.
2. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the [kokoro-onnx model-files-v1.1 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1), also outside the repository.
3. Run the generator with that environment’s Python:

```sh
python scripts/generate-audio.py --model /path/to/kokoro-v1.0.onnx --voices /path/to/voices-v1.0.bin
```

The generator resumes existing recordings and publishes the index only when the complete corpus is ready. Filenames include a hash of the text, voice configuration and model checksums. Remove recordings no longer referenced by the index after changing content or generation settings. Run `npm test`, and listen to changed words and sentences before publishing: file checks do not establish pronunciation accuracy. Commit the new MP3s and index together. Model files and Python dependencies never belong in the browser build.

See [audio credits](public/audio/CREDITS.md) for model, voice and dataset attribution.
