# Mot à Mot

A Flutter mobile app that displays French words from the 1000 most commonly used French words by children. Perfect for French language learning and vocabulary practice for young learners.

## Features

- **Full-screen word display**: Words appear prominently in white text on a dark green background
- **Random word selection**: Tap anywhere on the screen to get a new random French word
- **Landscape rotation support**: The app automatically rotates when the device is in landscape mode
- **1000 most used French words for children**: Curated list of child-friendly French vocabulary including family, animals, colors, numbers, and everyday objects
- **Clean, minimalist design**: Distraction-free interface focused on learning

## Getting Started

### Prerequisites

- Flutter SDK (>=3.10.0)
- Dart SDK (>=3.0.0)

### Installation

1. Clone this repository
2. Navigate to the project directory
3. Run `flutter pub get` to install dependencies
4. Run `flutter run` to start the app

### Usage

- Launch the app to see a random French word displayed
- Tap anywhere on the screen to display a new random word
- Rotate your device to landscape mode to see the word rotated accordingly
- Use the app for vocabulary practice, flashcard-style learning, or French immersion

## Project Structure

```
motamot/
├── lib/
│   ├── main.dart              # Main application code
│   └── data/
│       └── french_words.dart  # French words dataset for children
├── test/
│   └── widget_test.dart       # Unit and widget tests
├── android/                   # Android-specific configuration
├── ios/                       # iOS-specific configuration
├── pubspec.yaml              # Project dependencies and metadata
├── analysis_options.yaml     # Dart analyzer configuration
└── README.md                 # This file
```

## Technical Details

- Built with Flutter using Material Design 3
- Uses StatefulWidget for dynamic word updates
- Implements GestureDetector for tap-to-change functionality
- Responsive design that works in both portrait and landscape orientations
- Dark green background (#1B5E20) with white text for optimal contrast
- Modular code structure with separate data file for easy word list management
- Child-friendly vocabulary covering basic concepts like family, animals, colors, and everyday objects

## Contributing

Feel free to contribute by:
- Adding more French words to the vocabulary list
- Improving the UI/UX design
- Adding new features like word categories or pronunciation guides
- Fixing bugs or improving performance

## License

This project is open source and available under the MIT License.