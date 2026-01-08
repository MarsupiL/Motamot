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
      className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blackboard-dark via-blackboard to-blackboard-light cursor-pointer select-none relative font-sans"
      onClick={handleClick}
    >
      {/* Blackboard texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTEiPjwvcmVjdD4KPC9zdmc+')]" />
      
      {/* Wooden frame effect */}
      <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-blackboard-border rounded-sm shadow-inner pointer-events-none" />

      <div className="flex justify-center items-center flex-1 w-full px-8 z-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            <span className="text-xl md:text-2xl text-chalk-dim">
              Génération de la phrase...
            </span>
            <div className="w-12 h-12 border-[3px] border-chalk-subtle border-t-chalk rounded-full animate-spin" />
          </div>
        ) : (
          <span
            className={`
              text-center text-chalk animate-fade-in max-w-[90vw] break-words !leading-[2.5] font-cursive
              ${isErrorOrSentence
                ? error
                  ? 'text-xl md:text-2xl lg:text-3xl text-red-300 px-[10%] max-w-[80vw]'
                  : 'text-2xl md:text-4xl lg:text-5xl px-[5%] max-w-[85vw]'
                : 'text-5xl md:text-7xl lg:text-8xl tracking-wide'
              }
              hover:text-white transition-colors duration-300
              active:scale-[0.98] transition-transform
            `}
          >
            {displayText}
          </span>
        )}
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        {!isErrorOrSentence && !isLoading && (
          <div className="flex gap-3">
            {Array.from({ length: CLICKS_BEFORE_SENTENCE }).map((_, i) => (
              <span
                key={i}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${i < clickCount
                    ? 'bg-chalk shadow-[0_0_8px_rgba(245,245,240,0.5)]'
                    : 'bg-chalk-subtle'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm md:text-base text-chalk-faint z-10">
        {isErrorOrSentence
          ? 'Cliquez pour continuer'
          : `Cliquez sur le mot (${clickCount}/${CLICKS_BEFORE_SENTENCE})`
        }
      </div>
    </div>
  );
}

export default App;
