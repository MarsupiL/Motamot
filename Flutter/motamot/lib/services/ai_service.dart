import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:math';

class AIService {
  // Using Hugging Face's free inference API with GPT-2
  static const String _baseUrl = 'https://api-inference.huggingface.co/models';
  
  // GPT-2 model for text generation (no registration required)
  static const String _model = 'gpt2';

  static Future<String> generateFrenchSentence(List<String> words) async {
    try {
      // Create a French prompt using exactly 5 words from the 10 clicked words
      String prompt = _createFrenchPrompt(words);
      
      // Try GPT-2 generation
      String? sentence = await _tryGPT2Generation(prompt, words);
      if (sentence != null && sentence.isNotEmpty) {
        return _cleanSentence(sentence);
      }
      
      // If GPT-2 fails, create a simple sentence using the words
      return _createSimpleFrenchSentence(words);
      
    } catch (e) {
      print('Error generating sentence: $e');
      return _createSimpleFrenchSentence(words);
    }
  }
  
  static String _createFrenchPrompt(List<String> words) {
    // Select exactly 2 random words from the 10 clicked words
    List<String> selectedWords = List.from(words);
    selectedWords.shuffle();
    
    // Take exactly 2 words (or all if less than 2)
    List<String> promptWords = selectedWords.take(2).toList();
    
    String wordList = promptWords.join(' et ');
    
    // Create a very detailed French prompt with specific gender and elision rules
    return '''Créez une phrase française avec une grammaire PARFAITE en utilisant les mots "$wordList".

RÈGLES OBLIGATOIRES POUR LES ARTICLES:

MASCULIN (utilisez "le" ou "un"):
- le chat, le chien, le livre, le garçon, le ballon, le vélo, le train, le pain, le lait
- un chat, un chien, un livre, un garçon, un ballon, un vélo, un train

FÉMININ (utilisez "la" ou "une"):
- la pomme, la voiture, la maison, la fille, la table, la chaise, la école → NON! = l'école
- une pomme, une voiture, une maison, une fille, une table, une chaise

ÉLISION OBLIGATOIRE (utilisez "l'" devant voyelle a,e,i,o,u,h):
- l'oiseau (PAS "le oiseau"), l'école (PAS "la école"), l'eau (PAS "la eau")
- l'orange (PAS "la orange"), l'hygromètre (PAS "le hygromètre")
- l'tablette (PAS "le tablette" car tablette est FÉMININ = "la tablette")

EXEMPLES PARFAITS:
✓ "Le chat mange la pomme." (le=masculin chat, la=féminin pomme)
✓ "L'oiseau cherche l'eau." (l' devant voyelles)
✓ "La tablette montre l'hygromètre." (la=féminin tablette, l'=élision hygromètre)

ERREURS À NE JAMAIS FAIRE:
✗ "Le pomme" → CORRECT: "La pomme" (pomme est féminin)
✗ "La chat" → CORRECT: "Le chat" (chat est masculin)
✗ "Le école" → CORRECT: "L'école" (élision devant voyelle)
✗ "Le hygromètre" → CORRECT: "L'hygromètre" (élision devant h)
✗ "Le tablette" → CORRECT: "La tablette" (tablette est féminin)

ATTENTION: Chaque nom DOIT avoir son article correct selon son genre ET l'élision!

Phrase française avec articles PARFAITEMENT corrects: ''';
  }
  
  static Future<String?> _tryGPT2Generation(String prompt, List<String> words) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/$_model'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'inputs': prompt,
          'parameters': {
            'max_length': 200, // No limitation on sentence length
            'temperature': 0.8,
            'do_sample': true,
            'top_p': 0.9,
            'repetition_penalty': 1.2,
            'pad_token_id': 50256, // GPT-2 pad token
          }
        }),
      ).timeout(const Duration(seconds: 20));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data is List && data.isNotEmpty) {
          String generatedText = data[0]['generated_text'] ?? '';
          return _extractFrenchSentence(generatedText, prompt);
        } else if (data is Map && data.containsKey('generated_text')) {
          String generatedText = data['generated_text'] ?? '';
          return _extractFrenchSentence(generatedText, prompt);
        }
      } else if (response.statusCode == 503) {
        // Model is loading, wait and try again
        print('GPT-2 model is loading, waiting...');
        await Future.delayed(const Duration(seconds: 3));
        return null;
      } else {
        print('GPT-2 API error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('GPT-2 generation failed: $e');
    }
    return null;
  }
  
  static String _extractFrenchSentence(String generatedText, String prompt) {
    // Remove the prompt from the generated text
    String sentence = generatedText.replaceFirst(prompt, '').trim();
    
    // Take the first complete sentence (no length limitation)
    List<String> sentences = sentence.split(RegExp(r'[.!?]'));
    if (sentences.isNotEmpty && sentences[0].trim().isNotEmpty) {
      sentence = sentences[0].trim();
    }
    
    // Clean up the sentence
    sentence = sentence.replaceAll(RegExp(r'\s+'), ' ').trim();
    sentence = sentence.replaceAll(RegExp(r'["\[\]{}|\\<>]'), ''); // Remove unwanted characters
    
    // Ensure it ends with proper punctuation
    if (sentence.isNotEmpty && !sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
      sentence += '.';
    }
    
    // Capitalize first letter
    if (sentence.isNotEmpty) {
      sentence = sentence[0].toUpperCase() + sentence.substring(1);
    }
    
    return sentence;
  }
  
  static String _cleanSentence(String sentence) {
    // Remove any unwanted characters or patterns
    sentence = sentence.replaceAll(RegExp(r'[<>{}[\]|\\"]'), '');
    sentence = sentence.replaceAll(RegExp(r'\s+'), ' ');
    sentence = sentence.trim();
    
    // Ensure proper capitalization
    if (sentence.isNotEmpty) {
      sentence = sentence[0].toUpperCase() + sentence.substring(1);
    }
    
    // Ensure proper punctuation
    if (sentence.isNotEmpty && !sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
      sentence += '.';
    }
    
    return sentence;
  }
  
  static String _createSimpleFrenchSentence(List<String> words) {
    // Fallback: create a simple French sentence using only 2 words from the 10 clicked words
    if (words.length < 2) {
      return 'Voici une belle histoire avec vos mots.';
    }
    
    // Shuffle and select exactly 2 words
    List<String> selectedWords = List.from(words);
    selectedWords.shuffle();
    List<String> sentenceWords = selectedWords.take(2).toList();
    
    String word1 = sentenceWords[0];
    String word2 = sentenceWords[1];
    
    // Simple but logical French sentence templates using exactly 2 words
    List<String> templates = [
      'Le {word1} regarde le {word2}.',
      'Il y a un {word1} près du {word2}.',
      'Le {word1} aime le {word2}.',
      'Voici un {word1} et un {word2}.',
      'Le {word1} cherche le {word2}.',
      'Un {word1} rencontre un {word2}.',
      'Le {word1} joue avec le {word2}.',
      'Où est le {word1} ? Près du {word2}.',
      'Le {word1} ressemble au {word2}.',
      'Un beau {word1} et un joli {word2}.',
      'Le {word1} protège le {word2}.',
      'Voilà le {word1} qui suit le {word2}.',
    ];
    
    // Select a random template
    String template = templates[Random().nextInt(templates.length)];
    
    // Replace placeholders with actual words
    String sentence = template.replaceAll('{word1}', word1).replaceAll('{word2}', word2);
    
    return sentence;
  }
}