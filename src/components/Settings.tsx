import { useState, useEffect } from 'react';

const STORAGE_KEY = 'motamot_groq_api_key';

interface SettingsProps {
  onClose: () => void;
}

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const clearStoredApiKey = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export function Settings({ onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearStoredApiKey();
    setApiKey('');
    setSaved(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-blackboard border-4 border-blackboard-border rounded-lg p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl text-chalk font-bold mb-4">⚙️ Paramètres</h2>
        
        <form onSubmit={handleSave}>
          <label className="block text-chalk-dim mb-2">
            Clé API Groq
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full p-3 rounded bg-blackboard-dark border border-chalk-subtle text-chalk placeholder-chalk-faint focus:outline-none focus:border-chalk mb-4"
          />
          
          <p className="text-chalk-faint text-sm mb-4">
            Obtenez votre clé API gratuite sur{' '}
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-chalk underline hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              console.groq.com
            </a>
          </p>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-chalk text-blackboard-dark py-2 px-4 rounded font-semibold hover:bg-white transition-colors"
            >
              {saved ? '✓ Enregistré!' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-chalk-subtle text-chalk-dim rounded hover:border-chalk hover:text-chalk transition-colors"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-chalk-subtle text-chalk-dim rounded hover:border-chalk hover:text-chalk transition-colors"
            >
              Fermer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
