import type { Word, GroqResponse } from '../types';
import { getStoredApiKey } from '../components/Settings';

const ERROR_NO_API_KEY = "Clé API manquante. Cliquez sur ⚙️ pour configurer votre clé API Groq.";
const ERROR_API_FAILED = "Erreur: Impossible de générer la phrase. Veuillez réessayer.";

const STRUCTURE_HINTS = [
  "une phrase décrivant une action quotidienne avec une touche d'humour",
  "une phrase exprimant une émotion de façon amusante",
  "une phrase décrivant une situation cocasse",
  "une phrase avec une comparaison drôle ou inattendue",
  "une phrase exprimant une préférence de façon humoristique",
  "une phrase décrivant une personne ou un objet de manière amusante",
  "une phrase racontant un petit événement comique",
  "une phrase exprimant une opinion avec ironie légère",
  "une phrase sur un petit problème du quotidien de façon drôle",
  "une phrase avec une observation amusante sur la vie"
];

const formatWordDetails = (words: Word[]): string => {
  return words.map(w => {
    if (w.type === 'noun') {
      return `${w.word} (nom, ${w.gender === 'm' ? 'masculin' : 'féminin'})`;
    } else if (w.type === 'verb') {
      return `${w.word} (verbe)`;
    } else if (w.type === 'adjective') {
      return `${w.word} (adjectif)`;
    }
    return `${w.word} (adverbe)`;
  }).join(', ');
};

const buildPrompt = (wordDetails: string, randomHint: string): string => {
  return `Tu es un professeur de français natif avec un bon sens de l'humour qui crée des phrases d'exemple amusantes pour des étudiants débutants.

MOTS DISPONIBLES (avec leur type grammatical):
${wordDetails}

TÂCHE: Crée UNE SEULE phrase en français en suivant ces étapes:

1. ANALYSE les 10 mots proposés ci-dessus
2. CHOISIS les mots (2 ou plus) qui permettent de créer la phrase la plus cohérente sémantiquement ET la plus amusante
3. CRÉE une phrase qui:
   - Utilise les mots choisis de façon naturelle et logique
   - A un SENS CLAIR et RÉALISTE (décrit quelque chose de plausible)
   - Est grammaticalement correcte (accords de genre, nombre, conjugaison)
   - Est de type: ${randomHint}
   - Est simple (niveau A2/B1, pour quelqu'un qui apprend le français depuis 6 mois)
   - Contient MAXIMUM 25 mots
   - Est AMUSANTE - avec une touche d'humour léger (situation cocasse, observation amusante, petit twist inattendu)

IMPORTANT: Tu n'es PAS obligé d'utiliser tous les mots. Choisis ceux qui fonctionnent le mieux ensemble pour créer une phrase qui a du sens ET qui fait sourire. La qualité sémantique et l'humour sont plus importants que le nombre de mots utilisés.

RÈGLES STRICTES:
- La phrase DOIT avoir un sens sémantique clair et logique
- La phrase ne doit PAS dépasser 25 mots
- Évite les phrases absurdes comme "Il y a un chat dans une idée" ou "Le bonheur mange une table"
- Les mots doivent être utilisés dans un contexte naturel et approprié
- Utilise les articles appropriés (le/la/les/un/une/des)
- Conjugue les verbes correctement si tu les utilises
- Accorde les adjectifs en genre et en nombre
- Utilise TOUJOURS les apostrophes correctement en français:
  * "l'homme" et non "l homme"
  * "j'aime" et non "j aime"
  * "qu'un" et non "qu un"
  * "d'une" et non "d une"
  * "c'est" et non "c est"
  * "n'est" et non "n est"
  * "s'il" et non "s il"

RÉPONDS UNIQUEMENT avec la phrase, sans guillemets, sans explication, sans ponctuation supplémentaire.`;
};

export const generateSentence = async (words: Word[]): Promise<string> => {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    throw new Error(ERROR_NO_API_KEY);
  }

  const wordDetails = formatWordDetails(words);
  const randomHint = STRUCTURE_HINTS[Math.floor(Math.random() * STRUCTURE_HINTS.length)];
  const prompt = buildPrompt(wordDetails, randomHint);

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
          content: "Tu es un professeur de français natif avec un excellent sens de l'humour. Tu crées des phrases simples, naturelles et sémantiquement correctes pour des étudiants débutants. Tes phrases décrivent toujours des situations réalistes mais avec une touche d'humour léger - une situation cocasse, une observation amusante, ou un petit twist inattendu qui fait sourire. Tes phrases ne dépassent jamais 25 mots. Tu utilises toujours les apostrophes correctement (l'homme, j'aime, qu'un, d'une, c'est, n'est, s'il)."
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
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
