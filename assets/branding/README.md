# Motamot icon

`motamot-speech-bubble.png` is the original speech-bubble concept selected by the project owner. It was created with the built-in image-generation tool: a warm-white chalk speech bubble containing a yellow handwritten lowercase “m”, on a green chalkboard.

The production PNGs in `public/icons/` are size exports of that artwork. They are flattened onto the board color `#193c32` so the icon has an opaque background, then resized to 32, 48, 180, 192 and 512 pixels. The 512-pixel artwork fits inside the centered safe circle with radius 40% of the image width; both regular and maskable manifest entries can use it. The original remains outside `public/` to avoid including its full size in the PWA download.

If replacing the design, update the filenames in `index.html` and `vite.config.ts` so browsers can fetch the new icon instead of reusing an old cached URL. Keep actual PNG dimensions consistent with the HTML and manifest declarations. Check opacity, the maskable safe area, and legibility at favicon size before publishing.
