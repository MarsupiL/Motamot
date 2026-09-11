import { allWords, formatWordWithArticle } from '../src/data/frenchWords.ts';
import { examples } from '../src/data/sentences.ts';

// Use the exact displayed text so changed content can never play an old recording.
const texts = [...new Set([
  ...allWords.map(formatWordWithArticle),
  ...examples.map(example => example.text),
])].sort();
process.stdout.write(JSON.stringify(texts));
