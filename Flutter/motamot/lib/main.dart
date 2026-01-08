import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math';
import 'package:google_fonts/google_fonts.dart';
import 'data/french_words.dart';
import 'services/ai_service.dart';

void main() {
  runApp(const MotAmotApp());
}

class MotAmotApp extends StatelessWidget {
  const MotAmotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mot à Mot',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const WordDisplayScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class WordDisplayScreen extends StatefulWidget {
  const WordDisplayScreen({super.key});

  @override
  State<WordDisplayScreen> createState() => _WordDisplayScreenState();
}

class _WordDisplayScreenState extends State<WordDisplayScreen> with TickerProviderStateMixin {
  final Random _random = Random();
  String _currentWord = '';
  List<String> _clickedWords = [];
  String _generatedSentence = '';
  bool _isGenerating = false;
  bool _showSentence = false;
  bool _showCongratulations = false;
  
  late AnimationController _congratulationsController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _congratulationsController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _congratulationsController,
      curve: Curves.elasticOut,
    ));
    
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _congratulationsController,
      curve: Curves.easeIn,
    ));
    
    _selectRandomWord();
  }

  @override
  void dispose() {
    _congratulationsController.dispose();
    super.dispose();
  }

  void _selectRandomWord() {
    setState(() {
      _currentWord = frenchWordsForChildren[_random.nextInt(frenchWordsForChildren.length)];
    });
  }

  void _onWordTapped() {
    setState(() {
      // Add current word to clicked words if not already present
      if (!_clickedWords.contains(_currentWord)) {
        _clickedWords.add(_currentWord);
      }
      
      // Reset sentence display when continuing to click
      if (_showSentence) {
        _showSentence = false;
        _generatedSentence = '';
      }
      
      // Auto-generate sentence when 10 words are reached
      if (_clickedWords.length == 10) {
        _generateSentence();
      } else {
        // Only select new word if we haven't reached 10 words yet
        _selectRandomWord();
      }
    });
  }

  Future<void> _generateSentence() async {
    setState(() {
      _isGenerating = true;
    });

    try {
      String sentence = await AIService.generateFrenchSentence(_clickedWords);
      setState(() {
        _generatedSentence = sentence;
        _showSentence = true;
        _isGenerating = false;
      });
    } catch (e) {
      setState(() {
        _generatedSentence = 'Erreur lors de la génération de la phrase.';
        _showSentence = true;
        _isGenerating = false;
      });
    }
  }

  void _resetGame() {
    setState(() {
      _clickedWords.clear();
      _generatedSentence = '';
      _showSentence = false;
      _showCongratulations = false;
      _isGenerating = false;
      _congratulationsController.reset();
      _selectRandomWord();
    });
  }

  void _onSentenceTapped() {
    setState(() {
      _showCongratulations = true;
    });
    
    _congratulationsController.forward().then((_) {
      // Wait a bit after animation completes, then reset
      Future.delayed(const Duration(milliseconds: 800), () {
        _resetGame();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 23, 53, 25), // Dark green background
      body: Stack(
        children: [
          _showSentence ? _buildSentenceView() : _buildWordView(),
          if (_showCongratulations) _buildCongratulationsOverlay(),
        ],
      ),
    );
  }

  Widget _buildWordView() {
    return GestureDetector(
      onTap: _onWordTapped,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        child: Center(
          child: Text(
            _currentWord,
            style: GoogleFonts.dancingScript(
              color: Colors.white,
              fontSize: 56,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildSentenceView() {
    return GestureDetector(
      onTap: _onSentenceTapped,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        child: Center(
          child: Text(
            _generatedSentence,
            style: GoogleFonts.dancingScript(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildCongratulationsOverlay() {
    final List<String> congratulationsMessages = [
      'Bravo !',
      'Magnifique phrase !',
      'Excellent !',
      'Fantastique !',
      'Superbe !',
    ];
    
    final Random random = Random();
    final String message = congratulationsMessages[random.nextInt(congratulationsMessages.length)];
    
    return AnimatedBuilder(
      animation: _congratulationsController,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.black.withOpacity(0.3 * _opacityAnimation.value),
          child: Center(
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Opacity(
                opacity: _opacityAnimation.value,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Text(
                    message,
                    style: GoogleFonts.dancingScript(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
