# Motamot review — 11 September 2026

These measurements describe the 72-sentence version reviewed before the English translations and larger library were added. See the README for current features and asset sizes.

## Assessment

The existing static architecture fits this app. Runtime dependencies are React and React DOM; there is no database, learner authentication, API key, remote text generation or model inference. French content, lesson ordering, navigation and audio playback are separate from the view. Keep this structure and GitHub Pages hosting.

## Size and delivery

Measurements use production file sizes in decimal MB/KB. They are not a browser timing benchmark or a measurement of device memory.

| Asset group | Size | When downloaded |
| --- | ---: | --- |
| Complete published app | About 20.9 MB | Never all at once by default |
| Offline precache | About 1.84 MB, before compression | First successful service-worker installation |
| 1,343 MP3 recordings | 19.05 MB combined | One recording on each uncached listen |
| Typical / largest MP3 | 12.48 / 59.28 KB | On demand |
| 50 illustrations | 0.84 MB combined | Included in the offline precache |
| Two handwriting fonts | 0.26 MB combined | Included in the offline precache |
| Browser JavaScript | About 94 KB gzip | Included in the offline precache |

Font licenses, source artwork, generation prompts, development tools and local speech models are not part of the offline precache. The original icon artwork and generation prompts are outside `public/`, so they are not in the published app either. Audio is excluded from service-worker caching; ordinary HTTP caching may reuse it, but offline audio is not guaranteed.

Live HTTP checks confirmed gzip delivery for JavaScript, successful audio responses, byte-range support and a ten-minute HTTP cache lifetime. The service worker retains its versioned app resources beyond that normal HTTP cache window. Future releases reuse unchanged precached resources; they do not require downloading every audio file again.

GitHub Pages already hosts the assets remotely. Its documented limits are a 1 GB published site and a soft 100 GB monthly bandwidth allowance. The current app occupies about 2% of the site-size limit. Traffic usage was not available in this review. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

A separate storage bucket would not inherently shrink downloads. Consider one when there are user uploads, frequent large media replacements that inflate Git history, a library reaching hundreds of MB, or measured bandwidth pressure. For now, avoid the added configuration, cross-origin handling and provider administration.

The local Git object store is about 146 MiB, largely because older history contains large design files and a testing binary. This increases a developer’s full clone size; learners receive only the published build. Moving current media to another host would not remove those historical objects. Rewriting shared history is unnecessary for the app’s present size.

## Findings addressed

1. **Development dependency advisories.** The initial npm audit reported 22 affected packages, including 15 high-severity findings. These were in development/build tooling, not the React runtime. Compatible updates resolve the reported findings without a framework migration or new runtime dependency.
2. **Audio could stay loading indefinitely.** Initial playback and buffering now time out after 15 seconds. The request is released and the user can retry. Playing, stopping, switching words and disposal clear the timer; late events from older recordings remain ignored.
3. **Maintenance downloads could destroy existing illustrations.** Both old downloaders opened the destination before checking HTTP success and duplicated substantial logic. They were removed; all 50 illustration prompts were retained. Replacement artwork is prepared and inspected separately before changing a published image.
4. **Gestures retained entire event objects.** Navigation now snapshots only the four numeric fields it needs, including fields inherited from native event prototypes. The gesture controller is created once per component instance.
5. **Backtracking unnecessarily copied history.** Revisiting already discovered words now reuses lesson history. Words, sentence order and forward history remain unchanged.
6. **Checks missed parts of the project.** Lint now covers JavaScript configuration, maintenance scripts and tests; the production build also type-checks the Vite configuration. A build-time guard rejects audio in the offline precache and a precache larger than 2.5 MB. Duplicate icon precache entries and a redundant stylesheet import were removed.

## Validation and remaining limits

- All 21 automated tests pass. They cover all 72 sentence annotations, thousands of shuffled lessons, complete recording coverage, image availability, Unicode highlighting, lesson history, tap/swipe decisions and audio lifecycle behavior, including simulated stalled connections.
- Lint and the production build pass. A temporary oversized asset was correctly rejected by the production build and removed before the final successful build. The final npm audit reports zero known vulnerabilities.
- Source inspection, production builds and non-browser HTTP checks were used. This review did not include a new interactive test on physical phones or an accessibility audit with assistive technology.
- French checks establish structural consistency, not perfect grammar or pronunciation. New content still needs fluent editorial review and listening before publication.
- Lesson history is intentionally retained in memory until reload to support previous/next navigation. It contains references to existing content and small word-order arrays, not decoded images or audio. Refreshing resets the session; persistent progress is not currently a feature.
- Browser storage can be evicted. Keep the app text usable offline after installation, but do not promise permanent storage or offline pronunciation.
- A clean dependency audit reflects known advisories on the review date and should be repeated over time.
