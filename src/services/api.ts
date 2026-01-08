import type { Word, GroqResponse } from '../types';
import { getStoredApiKey } from '../components/Settings';

const ERROR_NO_API_KEY = "API key missing. Click ⚙️ to configure your Groq API key.";
const ERROR_API_FAILED = "Error: Unable to generate sentence. Please try again.";

const SENTENCE_TYPES = [
  "une action quotidienne",
  "une observation amusante",
  "une situation du quotidien",
  "une préférence personnelle",
  "un petit événement",
  "une description simple"
];

const formatWordDetails = (words: Word[]): string => {
  return words.map(w => {
    if (w.type === 'noun') {
      return `"${w.word}" (nom ${w.gender === 'm' ? 'masculin' : 'féminin'})`;
    } else if (w.type === 'verb') {
      return `"${w.word}" (verbe à l'infinitif - DOIT être conjugué)`;
    } else if (w.type === 'adjective') {
      return `"${w.word}" (adjectif - accorder en genre/nombre)`;
    }
    return `"${w.word}" (adverbe)`;
  }).join('\n- ');
};

const buildPrompt = (wordDetails: string, sentenceType: string): string => {
  return `RÔLE: Tu es un professeur de français natif qui crée des phrases PARFAITEMENT grammaticales.

MOTS À UTILISER (choisis-en 2 ou plus):
- ${wordDetails}

CRÉE une phrase sur: ${sentenceType}

RÈGLES GRAMMATICALES OBLIGATOIRES:
1. STRUCTURE: Sujet + Verbe conjugué + Complément
   ✓ "Le roi se casse le nez" (correct)
   ✗ "Le roi casser son nez" (INTERDIT - verbe non conjugué)
   
2. CONJUGAISON: Les verbes DOIVENT être conjugués au présent, passé composé ou futur
   ✓ "Elle mange une pomme" / "Il a mangé" / "Nous mangerons"
   ✗ "Elle manger" (INTERDIT)

3. ACCORDS: 
   - Adjectifs accordés avec le nom (genre + nombre)
   - Participes passés accordés si nécessaire

4. ARTICLES: Toujours utiliser le/la/les/un/une/des devant les noms

5. SENS: La phrase doit décrire une situation RÉALISTE et LOGIQUE

EXEMPLES DE PHRASES CORRECTES:
- "Le chat dort sur le canapé."
- "Ma voisine a acheté une nouvelle voiture rouge."
- "Les enfants jouent dans le jardin."

RÉPONDS avec UNE SEULE phrase (max 20 mots), sans guillemets, sans explication.`;
};

export const generateSentence = async (words: Word[]): Promise<string> => {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    throw new Error(ERROR_NO_API_KEY);
  }

  const wordDetails = formatWordDetails(words);
  const sentenceType = SENTENCE_TYPES[Math.floor(Math.random() * SENTENCE_TYPES.length)];
  const prompt = buildPrompt(wordDetails, sentenceType);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Tu es un professeur de français natif. Tu crées UNIQUEMENT des phrases grammaticalement PARFAITES.

RÈGLE ABSOLUE: Chaque phrase DOIT avoir:
- Un SUJET (nom ou pronom)
- Un VERBE CONJUGUÉ (jamais à l'infinitif seul)
- Une structure grammaticale correcte

INTERDIT:
- Verbes à l'infinitif comme sujet ou sans auxiliaire
- Phrases sans verbe conjugué
- Structures grammaticales incorrectes

Tu utilises les apostrophes correctement: l'homme, j'aime, c'est, d'une, qu'il, n'est, s'il.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(ERROR_API_FAILED);
  }

  const data: GroqResponse = await response.json();
  let sentence = data.choices[0].message.content.trim();
  
  // Clean up the response - remove quotes if present
  sentence = sentence.replace(/^["']|["']$/g, '');
  
  return sentence;
};
