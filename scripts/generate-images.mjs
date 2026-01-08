#!/usr/bin/env node

/**
 * Image Generation Script for Motamot
 * 
 * Uses Pollinations.ai - a completely FREE image generation API
 * No signup, no API key required!
 * 
 * https://pollinations.ai/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// List of 50 words to generate images for
const words = [
  // Masculine nouns (30)
  { word: "homme", filename: "homme.webp", prompt: "simple flat illustration of a man standing, friendly adult male, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "enfant", filename: "enfant.webp", prompt: "simple flat illustration of a happy child, young kid smiling, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "père", filename: "pere.webp", prompt: "simple flat illustration of a father, adult man with warm smile, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "ami", filename: "ami.webp", prompt: "simple flat illustration of two friends, people shaking hands, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "chat", filename: "chat.webp", prompt: "simple flat illustration of a cute cat sitting, domestic cat, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "chien", filename: "chien.webp", prompt: "simple flat illustration of a friendly dog, happy puppy, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "oiseau", filename: "oiseau.webp", prompt: "simple flat illustration of a colorful bird, small songbird, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "poisson", filename: "poisson.webp", prompt: "simple flat illustration of a fish, colorful tropical fish, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "cheval", filename: "cheval.webp", prompt: "simple flat illustration of a horse standing, brown horse, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "arbre", filename: "arbre.webp", prompt: "simple flat illustration of a tree, green leafy tree, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "jardin", filename: "jardin.webp", prompt: "simple flat illustration of a garden with flowers, colorful plants, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "soleil", filename: "soleil.webp", prompt: "simple flat illustration of the sun, bright yellow sun with rays, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "ciel", filename: "ciel.webp", prompt: "simple flat illustration of blue sky with white clouds, minimal design, educational flashcard style, vector art" },
  { word: "pain", filename: "pain.webp", prompt: "simple flat illustration of bread, french baguette, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "café", filename: "cafe.webp", prompt: "simple flat illustration of a cup of coffee, steaming coffee mug, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "livre", filename: "livre.webp", prompt: "simple flat illustration of a book, open book, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "bureau", filename: "bureau.webp", prompt: "simple flat illustration of a desk, office desk with chair, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "lit", filename: "lit.webp", prompt: "simple flat illustration of a bed, comfortable bed with pillows, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "train", filename: "train.webp", prompt: "simple flat illustration of a train, passenger train, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "avion", filename: "avion.webp", prompt: "simple flat illustration of an airplane, passenger plane flying, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "bateau", filename: "bateau.webp", prompt: "simple flat illustration of a boat, sailboat on water, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "vélo", filename: "velo.webp", prompt: "simple flat illustration of a bicycle, simple bike, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "téléphone", filename: "telephone.webp", prompt: "simple flat illustration of a smartphone, mobile phone, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "ordinateur", filename: "ordinateur.webp", prompt: "simple flat illustration of a laptop computer, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "chapeau", filename: "chapeau.webp", prompt: "simple flat illustration of a hat, stylish hat, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "gâteau", filename: "gateau.webp", prompt: "simple flat illustration of a birthday cake with frosting, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "fromage", filename: "fromage.webp", prompt: "simple flat illustration of cheese, yellow cheese wedge, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "œuf", filename: "oeuf.webp", prompt: "simple flat illustration of an egg, white chicken egg, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "fruit", filename: "fruit.webp", prompt: "simple flat illustration of colorful fruits, apple orange banana, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "légume", filename: "legume.webp", prompt: "simple flat illustration of vegetables, carrot tomato broccoli, minimal design, solid white background, educational flashcard style, vector art" },
  
  // Feminine nouns (20)
  { word: "femme", filename: "femme.webp", prompt: "simple flat illustration of a woman standing, friendly adult female, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "fille", filename: "fille.webp", prompt: "simple flat illustration of a young girl smiling, happy child, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "mère", filename: "mere.webp", prompt: "simple flat illustration of a mother, adult woman with warm smile, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "maison", filename: "maison.webp", prompt: "simple flat illustration of a house, cozy family home, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "voiture", filename: "voiture.webp", prompt: "simple flat illustration of a car, simple sedan, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "table", filename: "table.webp", prompt: "simple flat illustration of a table, wooden dining table, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "chaise", filename: "chaise.webp", prompt: "simple flat illustration of a chair, wooden chair, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "porte", filename: "porte.webp", prompt: "simple flat illustration of a door, wooden door, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "fenêtre", filename: "fenetre.webp", prompt: "simple flat illustration of a window, window with curtains, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "fleur", filename: "fleur.webp", prompt: "simple flat illustration of a flower, beautiful colorful flower, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "montagne", filename: "montagne.webp", prompt: "simple flat illustration of a mountain, snow-capped mountain peak, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "mer", filename: "mer.webp", prompt: "simple flat illustration of the sea, blue ocean waves, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "plage", filename: "plage.webp", prompt: "simple flat illustration of a beach, sandy beach with palm tree, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "lune", filename: "lune.webp", prompt: "simple flat illustration of the moon, crescent moon, minimal design, solid dark blue background, educational flashcard style, vector art" },
  { word: "étoile", filename: "etoile.webp", prompt: "simple flat illustration of a star, bright yellow star shape, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "pomme", filename: "pomme.webp", prompt: "simple flat illustration of a red apple with leaf, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "orange", filename: "orange.webp", prompt: "simple flat illustration of an orange fruit, citrus, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "banane", filename: "banane.webp", prompt: "simple flat illustration of a yellow banana, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "pizza", filename: "pizza.webp", prompt: "simple flat illustration of a pizza slice with toppings, minimal design, solid white background, educational flashcard style, vector art" },
  { word: "guitare", filename: "guitare.webp", prompt: "simple flat illustration of an acoustic guitar, minimal design, solid white background, educational flashcard style, vector art" },
];

// Output directory
const outputDir = path.join(__dirname, '..', 'generated-images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      // Handle redirects
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
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Generate image using Pollinations.ai (FREE, no API key needed!)
async function generateImage(word, index, total) {
  const progress = `[${index + 1}/${total}]`;
  console.log(`${progress} Generating: ${word.word} (${word.filename})`);
  
  // Pollinations.ai URL format
  const encodedPrompt = encodeURIComponent(word.prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Date.now()}&nologo=true`;
  
  // Output path (save as PNG first, then we'll note to convert)
  const pngFilename = word.filename.replace('.webp', '.png');
  const outputPath = path.join(outputDir, pngFilename);
  
  try {
    await downloadImage(imageUrl, outputPath);
    console.log(`  ✓ Saved: ${pngFilename}`);
    return { success: true, filename: pngFilename };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, filename: word.filename, error: error.message };
  }
}

// Add delay between requests to be nice to the API
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║           MOTAMOT IMAGE GENERATOR (Pollinations.ai)                ║
╠════════════════════════════════════════════════════════════════════╣
║  Using Pollinations.ai - 100% FREE, no API key needed!            ║
║  Generating ${words.length} images...                                          ║
╚════════════════════════════════════════════════════════════════════╝
`);

  const results = { success: [], failed: [] };
  
  for (let i = 0; i < words.length; i++) {
    const result = await generateImage(words[i], i, words.length);
    
    if (result.success) {
      results.success.push(result.filename);
    } else {
      results.failed.push(result);
    }
    
    // Add delay between requests (2 seconds)
    if (i < words.length - 1) {
      await delay(2000);
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
    results.failed.forEach(f => console.log(`  - ${f.filename}: ${f.error}`));
    console.log('');
  }

  console.log(`Images saved to: ${outputDir}`);
  console.log(`
NEXT STEPS:
1. Convert PNG to WebP (optional, for smaller file size):
   cd generated-images
   for f in *.png; do cwebp "$f" -o "\${f%.png}.webp"; done

2. Or just rename .png to .webp and update the code to use PNG

3. Upload all images to Supabase storage bucket "images"
   - Go to: https://supabase.com/dashboard/project/gvsbrkvrqjlptzlvbaax/storage/buckets
   - Select "images" bucket
   - Upload all files from generated-images folder
`);
}

main().catch(console.error);
