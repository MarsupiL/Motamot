# Motamot - Learn French Word by Word

A React-based web application for learning French vocabulary. The app displays random French words in fullscreen, and after 8 clicks, generates a grammatically correct French sentence using at least 2 of the displayed words.

## Features

- **Fullscreen Word Display**: Shows French words (nouns, verbs, adjectives, adverbs) in a beautiful fullscreen interface
- **Article Support**: Nouns are displayed with their correct indefinite article (un/une) based on gender
- **Progress Tracking**: Visual progress dots show how many words until the next sentence
- **AI-Powered Sentences**: Uses Groq's LLM API to generate simple, grammatically correct French sentences
- **Beginner-Friendly**: Sentences are designed for learners who have been studying French for about 6 months
- **Responsive Design**: Works on desktop and mobile devices

## Word Categories

The app includes a comprehensive list of common French words:
- **Nouns**: ~600 common nouns with gender information (masculine/feminine)
- **Verbs**: ~200 common verbs in infinitive form
- **Adjectives**: ~300 common adjectives
- **Adverbs**: ~190 common adverbs

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd motamot-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up your API key (optional but recommended):
   - Get a free API key from [Groq Console](https://console.groq.com)
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Add your Groq API key to the `.env` file:
   ```
   VITE_GROQ_API_KEY=your_api_key_here
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## How to Use

1. **View a Word**: A random French word appears in fullscreen
   - Nouns show with their article (un/une)
   - Verbs, adjectives, and adverbs appear without articles

2. **Click to Continue**: Click anywhere on the screen to see the next word

3. **Track Progress**: Watch the progress dots at the bottom fill up (0/8 to 8/8)

4. **Read the Sentence**: After 8 clicks, a French sentence is generated using at least 2 of the words you've seen

5. **Start Again**: Click on the sentence to begin a new cycle

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Groq API**: LLM-powered sentence generation (using Llama 3.3 70B)
- **CSS3**: Custom styling with animations and responsive design

## Project Structure

```
motamot-app/
├── src/
│   ├── data/
│   │   └── frenchWords.js    # Word lists with metadata
│   ├── App.jsx               # Main application component
│   ├── App.css               # Styling
│   └── main.jsx              # Entry point
├── index.html
├── package.json
├── vite.config.js
├── .env.example              # Environment variables template
└── README.md
```

## API Configuration

The app uses Groq's free API tier for sentence generation. Without an API key, it falls back to simple template-based sentences.

### Getting a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Generate an API key
4. Add it to your `.env` file

## Customization

### Adding More Words

Edit `src/data/frenchWords.js` to add more words:

```javascript
// Add a noun
{ word: "example", gender: "m" }  // masculine
{ word: "example", gender: "f" }  // feminine

// Add a verb (infinitive form)
"parler"

// Add an adjective
"beau"

// Add an adverb
"rapidement"
```

### Changing the Number of Clicks

In `src/App.jsx`, modify the constant:
```javascript
const CLICKS_BEFORE_SENTENCE = 8;  // Change to desired number
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

MIT License - feel free to use and modify for your own learning projects!

## Contributing

Contributions are welcome! Feel free to:
- Add more French words
- Improve the sentence generation prompts
- Enhance the UI/UX
- Fix bugs or typos
