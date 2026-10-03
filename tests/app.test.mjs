import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { allWords, formatWordWithArticle } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';
import { PROGRESS_KEY } from '../src/services/progress.ts';

test('the initial HTML declares French and opts out of automatic page translation before React loads', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const root = html.match(/<html\b[^>]*>/)?.[0];
  assert.match(root, /lang="fr"/);
  assert.match(root, /translate="no"/);
  assert.match(root, /class="notranslate"/);
  assert.match(html, /<meta name="google" content="notranslate"\s*\/>/);
});

test('the rendered app protects French vocabulary and English hints and shows the saved course number', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    esbuild: { jsx: 'automatic' },
  });
  const previousWindow = globalThis.window;
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.tsx');
    const escapeHtml = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[char]);
    const french = new Set(allWords.map(word => escapeHtml(formatWordWithArticle(word))));
    for (const completed of [0, 5, 23, 359, 360]) {
      globalThis.window = { localStorage: {
        getItem: key => key === PROGRESS_KEY ? JSON.stringify({ version: 1, seen: examples.slice(0, completed).map(example => example.text) }) : null,
      } };
      const html = renderToStaticMarkup(createElement(App));
      assert.match(html, /<main[^>]*class="classroom notranslate"[^>]*lang="fr"[^>]*translate="no"/);
      assert.match(html, /class="english-translation" lang="en"/);
      if (completed < examples.length) {
        const title = html.match(/<h1 class="vocabulary-word" lang="fr" translate="no">([^<]+)<\/h1>/);
        assert.ok(title && french.has(title[1]), 'The word card must come from the French dictionary');
        assert.ok(html.includes(`aria-label="Leçon ${completed + 1} sur 360"`));
        assert.ok(html.includes(`>n° ${String(completed + 1).padStart(2, '0')}</span>`));
      } else {
        assert.ok(html.includes('Vous avez découvert les 360 phrases.'));
        assert.ok(!html.includes('class="lesson-number"'));
      }
    }
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    await server.close();
  }
});
