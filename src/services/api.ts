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

══════════════════════════════════════════════════════════════════════
MÉTHODE EN 2 PASSES (OBLIGATOIRE)
══════════════════════════════════════════════════════════════════════

▶ PASSE 1 - VISUALISE UNE SCÈNE RÉELLE:
Avant d'écrire, imagine une situation CONCRÈTE de la vie quotidienne.
Imagine que tu dois DESSINER ou FILMER cette scène.

Questions à te poser:
• "Où se passe cette scène?" (cuisine, rue, bureau, parc...)
• "Qui fait quoi?" (une personne, un animal, un objet qui tombe...)
• "Est-ce que je pourrais VOIR ça dans la vraie vie?"

▶ PASSE 2 - VÉRIFIE LE BON SENS:
Relis ta phrase et demande-toi:
• "Un enfant de 8 ans comprendrait-il cette situation?"
• "Pourrais-je prendre une PHOTO de cette scène?"
• "Cette action est-elle PHYSIQUEMENT possible?"

Si tu réponds NON → RECOMMENCE avec moins de mots.

══════════════════════════════════════════════════════════════════════
ÉTAPE 1 - SÉLECTION DES MOTS
══════════════════════════════════════════════════════════════════════
Parmi les mots ci-dessus, identifie ceux qui peuvent former une phrase COHÉRENTE.
⚠️ N'utilise PAS les mots qui ne s'associent pas logiquement.
⚠️ Mieux vaut utiliser 2-3 mots qui vont bien ensemble que forcer 5 mots sans sens.
⚠️ Si un mot ne rentre pas dans une scène réaliste, IGNORE-LE.

══════════════════════════════════════════════════════════════════════
ÉTAPE 2 - VÉRIFICATION SÉMANTIQUE
══════════════════════════════════════════════════════════════════════
La phrase doit décrire une situation POSSIBLE (même si exagérée ou comique).

✓ BONNES phrases (drôles ET réalistes):
- "Mon voisin a repeint sa voiture en rose." (on peut le voir)
- "Le chat a encore volé les chaussettes." (les chats font ça!)
- "La pluie a mouillé tous mes vêtements sur le balcon." (cause → effet logique)
- "Mon fils a caché les légumes sous la table." (situation réelle)

✗ MAUVAISES phrases (absurdes, INTERDITES):
- "La pluie fait une erreur" → la pluie n'a pas de volonté
- "Le rideau pense à demain" → un objet ne pense pas
- "L'erreur court dans le jardin" → une abstraction ne court pas
- "La table mange une idée" → impossible physiquement
- "L'appartement fatigue mon bras" → aucun sens

══════════════════════════════════════════════════════════════════════
ÉTAPE 3 - GRAMMAIRE PARFAITE
══════════════════════════════════════════════════════════════════════
- Verbes CONJUGUÉS (présent, passé composé, futur, imparfait)
  ✓ "Le chat mange" / "Il a mangé" / "Elle mangera"
  ✗ "Le chat manger" (INTERDIT)
- Adjectifs ACCORDÉS en genre et nombre
  ✓ "une voiture rouge" / "des voitures rouges"
- Articles corrects (le/la/les/un/une/des)
- Apostrophes: l'homme, j'aime, c'est, d'une, qu'il, n'est, s'il

══════════════════════════════════════════════════════════════════════
ÉTAPE 4 - SIMPLICITÉ (niveau A2/B1)
══════════════════════════════════════════════════════════════════════
- Maximum 25 mots
- Vocabulaire simple et courant
- Structure claire: Sujet + Verbe + Complément
- Évite les constructions complexes

══════════════════════════════════════════════════════════════════════
EXEMPLES DE BONNES PHRASES (drôles ET logiques)
══════════════════════════════════════════════════════════════════════
- "Mon patron a encore oublié mon prénom."
- "Le chien regarde la télé plus que mon mari."
- "Ma grand-mère court plus vite que moi."
- "Mon chat a décidé que mon clavier était son lit."
- "J'ai retrouvé mes lunettes... sur ma tête."

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
          content: `Tu es un professeur de français NATIF et humoriste. Tu écris des phrases DRÔLES, LOGIQUES et grammaticalement parfaites pour des débutants (niveau A2/B1).

MÉTHODE OBLIGATOIRE:
1. VISUALISE d'abord une scène RÉELLE de la vie quotidienne
2. Vérifie que tu pourrais DESSINER ou PHOTOGRAPHIER cette scène
3. Écris une phrase qui décrit cette scène de façon amusante

RÈGLES ABSOLUES:
1. FRANÇAIS UNIQUEMENT - Pas de mots espagnols, anglais ou autres langues
2. SENS LOGIQUE - La phrase doit décrire une situation POSSIBLE dans le monde réel
3. GRAMMAIRE PARFAITE - Verbes conjugués, accords en genre/nombre
4. HUMOUR - La phrase doit faire sourire tout en restant réaliste
5. SIMPLICITÉ - Maximum 25 mots, vocabulaire courant

TEST DE RÉALITÉ (obligatoire avant de répondre):
- "Puis-je imaginer cette scène dans la vraie vie?" → Si NON, recommence
- "Un enfant comprendrait-il cette situation?" → Si NON, simplifie
- "Le sujet peut-il logiquement faire cette action?" → Si NON, change

INTERDIT (phrases absurdes):
- "La pluie fait une erreur" → la météo n'a pas de volonté
- "Le rideau pense" → les objets ne pensent pas
- "L'erreur court" → les abstractions ne bougent pas
- Toute phrase qu'on ne pourrait pas PHOTOGRAPHIER`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
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
