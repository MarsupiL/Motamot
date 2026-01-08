import { useState, useCallback, useEffect, useRef } from 'react';
import type { Word } from './types';
import { getRandomWord, formatWordWithArticle, getNounsWithImages } from './data/frenchWords';
import { generateSentence } from './services/api';
import { Settings, getStoredApiKey } from './components/Settings';
import { getImageUrl, preloadImages } from './services/supabase';
import './index.css';

const CLICKS_BEFORE_SENTENCE = 10;
const ERROR_API_FAILED = "Erreur: Impossible de générer la phrase. Veuillez réessayer.";
const PRELOAD_COUNT = 3; // Number of images to preload in advance

function App() {
  const [currentWord, setCurrentWord] = useState<Word>(() => getRandomWord());
  const [clickCount, setClickCount] = useState(0);
  const [displayedWords, setDisplayedWords] = useState<Word[]>([]);
  const [sentence, setSentence] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Preload images for nouns with images
  useEffect(() => {
    const nounsWithImages = getNounsWithImages();
    const imagesToPreload: string[] = [];
    
    // Randomly select PRELOAD_COUNT images to preload
    const shuffled = [...nounsWithImages].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(PRELOAD_COUNT, shuffled.length); i++) {
      const noun = shuffled[i];
      if (noun.image && !preloadedImagesRef.current.has(noun.image)) {
        imagesToPreload.push(getImageUrl(noun.image));
        preloadedImagesRef.current.add(noun.image);
      }
    }
    
    if (imagesToPreload.length > 0) {
      preloadImages(imagesToPreload);
    }
  }, [currentWord]); // Preload more images when word changes

  // Reset image state when word changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentWord]);

  const handleClick = useCallback(async () => {
    if (isLoading || showSettings) return;

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
      // Check if API key is configured
      if (!getStoredApiKey()) {
        setError("API key missing. Click ⚙️ to configure your Groq API key.");
        return;
      }

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
  }, [clickCount, currentWord, displayedWords, sentence, error, isLoading, showSettings]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(true);
  };

  const displayText = error 
    ? error
    : sentence 
      ? sentence 
      : formatWordWithArticle(currentWord);

  const isErrorOrSentence = error || sentence;
  const hasApiKey = !!getStoredApiKey();

  return (
    <div
      className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blackboard-dark via-blackboard to-blackboard-light cursor-pointer select-none relative font-sans"
      onClick={handleClick}
    >
      {/* Blackboard texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTEiPjwvcmVjdD4KPC9zdmc+')]" />
      
      {/* Wooden frame effect */}
      <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-blackboard-border rounded-sm shadow-inner pointer-events-none" />

      {/* Settings button */}
      <button
        onClick={handleSettingsClick}
        className={`absolute top-6 right-6 md:top-8 md:right-8 text-2xl z-20 transition-all duration-300 hover:scale-110 ${
          hasApiKey ? 'text-chalk-dim hover:text-chalk' : 'text-yellow-400 animate-pulse hover:text-yellow-300'
        }`}
        title={hasApiKey ? 'Paramètres' : 'Configurer la clé API'}
      >
        ⚙️
      </button>

      <div className="flex justify-center items-center flex-1 w-full px-8 z-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6">
            <span className="text-xl md:text-2xl text-chalk-dim">
              Génération de la phrase...
            </span>
            <div className="w-12 h-12 border-[3px] border-chalk-subtle border-t-chalk rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <span
              className={`
                text-center text-chalk animate-fade-in max-w-[90vw] break-words !leading-[2.5] font-cursive
                ${isErrorOrSentence
                  ? error
                    ? 'text-xl md:text-2xl lg:text-3xl text-red-300 px-[10%] max-w-[80vw] font-sans'
                    : 'text-2xl md:text-4xl lg:text-5xl px-[5%] max-w-[85vw]'
                  : 'text-4xl md:text-6xl lg:text-7xl tracking-wide'
                }
                hover:text-white transition-colors duration-300
                active:scale-[0.98] transition-transform
              `}
            >
              {displayText}
            </span>
            
            {/* Image display for words with illustrations - in a painting frame */}
            {!isErrorOrSentence && currentWord.image && (
              <div className="animate-fade-in">
                {/* Ornate painting frame */}
                <div className="relative p-3 md:p-4 lg:p-5 bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.3)]">
                  {/* Inner gold trim */}
                  <div className="absolute inset-2 md:inset-3 border-2 border-amber-500/50 rounded-sm pointer-events-none" />
                  {/* Outer decorative edge */}
                  <div className="absolute inset-0 border-4 md:border-6 border-amber-950 rounded-sm pointer-events-none" />
                  {/* Corner decorations */}
                  <div className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-l-2 border-amber-400/60 rounded-tl-sm" />
                  <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-r-2 border-amber-400/60 rounded-tr-sm" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-l-2 border-amber-400/60 rounded-bl-sm" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-r-2 border-amber-400/60 rounded-br-sm" />
                  
                  {/* Inner mat/passepartout */}
                  <div className="p-2 md:p-3 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 shadow-inner">
                    {/* Image container */}
                    <div className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white">
                      {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                          <div className="w-8 h-8 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={getImageUrl(currentWord.image)}
                        alt={currentWord.word}
                        className={`
                          w-full h-full object-contain
                          transition-opacity duration-300
                          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                        `}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                          setImageError(true);
                          setImageLoaded(false);
                        }}
                      />
                      {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-400 text-xs md:text-sm">
                          Image non disponible
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

      {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
