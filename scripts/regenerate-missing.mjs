#!/usr/bin/env node

/**
 * Regenerate missing images for Motamot
 * Uses Pollinations.ai - FREE, no API key needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Missing images to regenerate
const missingWords = [
  { word: "café", filename: "cafe.png", prompt: "simple flat illustration of a cup of coffee, steaming coffee mug, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "ciel", filename: "ciel.png", prompt: "simple flat illustration of blue sky with white clouds, minimal design, educational flashcard style, vector art" },
  { word: "jardin", filename: "jardin.png", prompt: "simple flat illustration of a garden with flowers, colorful plants, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "pain", filename: "pain.png", prompt: "simple flat illustration of bread, french baguette, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "soleil", filename: "soleil.png", prompt: "simple flat illustration of the sun, bright yellow sun with rays, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "mer", filename: "mer.png", prompt: "simple flat illustration of the sea, blue ocean waves, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "plage", filename: "plage.png", prompt: "simple flat illustration of a beach, sandy beach with palm tree, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "lune", filename: "lune.png", prompt: "simple flat illustration of the moon, crescent moon, minimal design, solid dark blue background, educational flashcard style, vector art" },
  { word: "étoile", filename: "etoile.png", prompt: "simple flat illustration of a star, bright yellow star shape, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "pomme", filename: "pomme.png", prompt: "simple flat illustration of a red apple with leaf, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "orange", filename: "orange.png", prompt: "simple flat illustration of an orange fruit, citrus, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "banane", filename: "banane.png", prompt: "simple flat illustration of a yellow banana, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "pizza", filename: "pizza.png", prompt: "simple flat illustration of a pizza slice with toppings, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "guitare", filename: "guitare.png", prompt: "simple flat illustration of an acoustic guitar, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "livre", filename: "livre.png", prompt: "simple flat illustration of a book, open book, minimal design, solid white background, educational flashcard style, vector art" },
];

const outputDir = path.join(__dirname, '..', 'generated-images');

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        // Check file size
        const stats = fs.statSync(filepath);
        if (stats.size === 0) {
          fs.unlinkSync(filepath);
          reject(new Error('Empty file downloaded'));
        } else {
          resolve(filepath);
        }
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateImage(word, index, total) {
  const progress = `[${index + 1}/${total}]`;
  console.log(`${progress} Generating: ${word.word} (${word.filename})`);
  
  const encodedPrompt = encodeURIComponent(word.prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Date.now()}&nologo=true`;
  
  const outputPath = path.join(outputDir, word.filename);
  
  // Retry up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await downloadImage(imageUrl, outputPath);
      console.log(`  ✓ Saved: ${word.filename}`);
      return { success: true, filename: word.filename };
    } catch (error) {
      console.log(`  ✗ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < 3) {
        console.log(`  Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  return { success: false, filename: word.filename, error: 'All attempts failed' };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║         REGENERATING MISSING IMAGES (Pollinations.ai)              ║
╠════════════════════════════════════════════════════════════════════╣
║  Regenerating ${missingWords.length} missing images...                                 ║
╚════════════════════════════════════════════════════════════════════╝
`);

  const results = { success: [], failed: [] };
  
  for (let i = 0; i < missingWords.length; i++) {
    const result = await generateImage(missingWords[i], i, missingWords.length);
    
    if (result.success) {
      results.success.push(result.filename);
    } else {
      results.failed.push(result);
    }
    
    if (i < missingWords.length - 1) {
      await delay(3000); // 3 second delay between requests
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                  ║
╠════════════════════════════════════════════════════════════════════╣
║  Success: ${String(results.success.length).padEnd(3)} images                                          ║
║  Failed:  ${String(results.failed.length).padEnd(3)} images                                          ║
╚════════════════════════════════════════════════════════════════════╝
`);

  if (results.failed.length > 0) {
    console.log('Failed images:');
    results.failed.forEach(f => console.log(`  - ${f.filename}`));
  }

  console.log(`\nTotal images now: `);
}

main().catch(console.error);
