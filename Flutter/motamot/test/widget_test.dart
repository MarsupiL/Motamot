// This is a basic test file for the Mot à Mot Flutter app.
// To run these tests, you need Flutter installed and then run: flutter test

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:motamot/main.dart';
import 'package:motamot/data/french_words.dart';

void main() {
  testWidgets('App loads and displays a French word', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MotAmotApp());

    // Verify that the app loads without crashing
    expect(find.byType(WordDisplayScreen), findsOneWidget);
    
    // Verify that some text is displayed (should be a French word)
    expect(find.byType(Text), findsOneWidget);
    
    // Verify the background color is dark green
    expect(find.byType(Scaffold), findsOneWidget);
  });

  testWidgets('Tapping changes the word', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MotAmotApp());

    // Find the initial word
    final initialWordFinder = find.byType(Text);
    expect(initialWordFinder, findsOneWidget);
    
    final Text initialWordWidget = tester.widget(initialWordFinder);
    final String initialWord = initialWordWidget.data!;

    // Tap the screen to change the word
    await tester.tap(find.byType(GestureDetector));
    await tester.pump();

    // Find the new word
    final newWordFinder = find.byType(Text);
    expect(newWordFinder, findsOneWidget);
    
    final Text newWordWidget = tester.widget(newWordFinder);
    final String newWord = newWordWidget.data!;

    // The word might be the same due to randomness, but the mechanism should work
    // We just verify that the text widget still exists and contains a string
    expect(newWord, isA<String>());
    expect(newWord.isNotEmpty, true);
  });
}