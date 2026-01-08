import type { Word, GroqResponse } from '../types';
import { getStoredApiKey } from '../components/Settings';

const ERROR_NO_API_KEY = "API key missing. Click ⚙️ to configure your Groq API key.";
const ERROR_API_FAILED = "Error: Unable to generate sentence. Please try again.";

const HUMOR_STYLES = [
  "une situation cocasse mais réaliste",
  "une observation ironique sur le quotidien",
  "un petit problème du quotidien exagéré",
  "une comparaison inattendue mais logique",
  "une situation embarrassante mais crédible"
];

const formatWordDetails = (words: Word[]): string => {
  return words.map(w => {
    if (w.type === 'noun') {
      return `"${w.word}" (nom ${w.gender === 'm' ? 'masculin' : 'féminin'})`;
    } else if (w.type === 'verb') {
      return `"${w.word}" (verbe - à conjuguer)`;
    } else if (w.type === 'adjective') {
      return `"${w.word}" (adjectif - à accorder)`;
    }
    return `"${w.word}" (adverbe)`;
  }).join('\n- ');
};

const buildPrompt = (wordDetails: string, humorStyle: string): string => {
  return `OBJECTIF: Créer une phrase DRÔLE, LOGIQUE et GRAMMATICALEMENT PARFAITE pour un débutant en français.

MOTS DISPONIBLES:
- ${wordDetails}

STYLE D'HUMOUR: ${humorStyle}

ÉTAPE 1 - SÉLECTION DES MOTS:
Parmi les mots ci-dessus, identifie ceux qui peuvent former une phrase COHÉRENTE.
⚠️ N'utilise PAS les mots qui ne s'associent pas logiquement.
⚠️ Mieux vaut utiliser 2-3 mots qui vont bien ensemble que forcer 5 mots sans sens.

ÉTAPE 2 - VÉRIFICATION SÉMANTIQUE:
La phrase doit décrire une situation POSSIBLE (même si exagérée ou comique).
✓ "Mon voisin a repeint sa voiture en rose." (possible, drôle)
✓ "Le chat a encore volé les chaussettes." (possible, amusant)
✗ "L'appartement fatigue mon bras." (impossible, absurde)
✗ "La table mange une idée." (impossible, absurde)

ÉTAPE 3 - GRAMMAIRE PARFAITE:
- Verbes CONJUGUÉS (présent, passé composé, futur, imparfait)
  ✓ "Le chat mange" / "Il a mangé" / "Elle mangera"
  ✗ "Le chat manger" (INTERDIT)
- Adjectifs ACCORDÉS en genre et nombre
  ✓ "une voiture rouge" / "des voitures rouges"
- Articles corrects (le/la/les/un/une/des)
- Apostrophes: l'homme, j'aime, c'est, d'une, qu'il, n'est, s'il

ÉTAPE 4 - SIMPLICITÉ (niveau A2/B1):
- Maximum 20 mots
- Vocabulaire simple et courant
- Structure claire: Sujet + Verbe + Complément
- Évite les constructions complexes

EXEMPLES DE BONNES PHRASES:
- "Mon patron a encore oublié mon prénom."
- "Le chien regarde la télé plus que mon mari."
- "Ma grand-mère court plus vite que moi."

RÉPONDS avec UNE SEULE phrase, sans guillemets, sans explication.`;
};

export const generateSentence = async (words: Word[]): Promise<string> => {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    throw new Error(ERROR_NO_API_KEY);
  }

  const wordDetails = formatWordDetails(words);
  const humorStyle = HUMOR_STYLES[Math.floor(Math.random() * HUMOR_STYLES.length)];
  const prompt = buildPrompt(wordDetails, humorStyle);

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
          content: `Tu es un professeur de français qui crée des phrases drôles ET grammaticalement parfaites pour des débutants (niveau A2/B1).

PRIORITÉS (dans l'ordre):
1. SENS LOGIQUE - La phrase décrit une situation RÉELLE ou PLAUSIBLE
2. GRAMMAIRE PARFAITE - Verbes conjugués, accords corrects, apostrophes
3. SIMPLICITÉ - Phrases courtes (max 20 mots), vocabulaire simple
4. HUMOUR - Situation cocasse, observation ironique, exagération crédible

RÈGLE D'OR: Si les mots ne peuvent pas former une phrase logique ensemble, utilise SEULEMENT ceux qui fonctionnent. Ne force JAMAIS des mots incompatibles.

INTERDIT:
- Phrases absurdes (objets qui font des actions impossibles)
- Associations illogiques (ex: "la maison mange", "le bonheur court")
- Verbes non conjugués
- Phrases trop longues ou complexes`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
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
