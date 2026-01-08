import { useState, useCallback } from 'react';
import type { Word } from './types';
import { getRandomWord, formatWordWithArticle } from './data/frenchWords';
import { generateSentence } from './services/api';
import './index.css';

const CLICKS_BEFORE_SENTENCE = 10;
const ERROR_API_FAILED = "Erreur: Impossible de générer la phrase. Veuillez réessayer.";

function App() {
  const [currentWord, setCurrentWord] = useState<Word>(() => getRandomWord());
  const [clickCount, setClickCount] = useState(0);
  const [displayedWords, setDisplayedWords] = useState<Word[]>([]);
  const [sentence, setSentence] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    if (sentence || error) {
      setSentence(null);
      setError(null);
      setClickCount(0);
      setDisplayedWords([]);
      setCurrentWord(getRandomWord());
      return;
    }

    const newClickCount = clickCount + 1;
    const newDisplayedWords = [...displayedWords, currentWord];

    if (newClickCount >= CLICKS_BEFORE_SENTENCE) {
      setIsLoading(true);
      setDisplayedWords(newDisplayedWords);
      
      try {
        const generatedSentence = await generateSentence(newDisplayedWords);
        setSentence(generatedSentence);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : ERROR_API_FAILED);
        setSentence(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setClickCount(newClickCount);
      setDisplayedWords(newDisplayedWords);
      setCurrentWord(getRandomWord());
    }
  }, [clickCount, currentWord, displayedWords, sentence, error, isLoading]);

  const displayText = error 
    ? error
    : sentence 
      ? sentence 
      : formatWordWithArticle(currentWord);

  const isErrorOrSentence = error || sentence;

  return (
    <div 
      className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] cursor-pointer select-none relative font-sans"
      onClick={handleClick}
    >
      <div className="flex justify-center items-center flex-1 w-full px-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            <span className="text-base md:text-lg text-white/70 font-light">
              Génération de la phrase...
            </span>
            <div className="w-12 h-12 border-[3px] border-white/10 border-t-white/80 rounded-full animate-spin" />
          </div>
        ) : (
          <span 
            className={`
              text-center text-white animate-fade-in leading-tight max-w-[90vw] break-words
              ${isErrorOrSentence 
                ? error 
                  ? 'text-base md:text-xl lg:text-2xl font-normal text-red-400 px-[10%] max-w-[80vw] leading-relaxed'
                  : 'text-lg md:text-3xl lg:text-5xl font-normal px-[5%] max-w-[85vw] leading-snug'
                : 'text-4xl md:text-7xl lg:text-9xl font-light tracking-wide drop-shadow-[0_4px_30px_rgba(255,255,255,0.1)]'
              }
              hover:drop-shadow-[0_4px_40px_rgba(255,255,255,0.2)]
              active:scale-[0.98] transition-transform
            `}
          >
            {displayText}
          </span>
        )}
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        {!isErrorOrSentence && !isLoading && (
          <div className="flex gap-3">
            {Array.from({ length: CLICKS_BEFORE_SENTENCE }).map((_, i) => (
              <span 
                key={i} 
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${i < clickCount 
                    ? 'bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                    : 'bg-white/20'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs md:text-sm text-white/40 font-light tracking-wider">
        {isErrorOrSentence 
          ? 'Cliquez pour continuer' 
          : `Cliquez sur le mot (${clickCount}/${CLICKS_BEFORE_SENTENCE})`
        }
      </div>
    </div>
  );
}

export default App;
