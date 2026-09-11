import { useEffect, useState } from 'react';
import { createPronunciationPlayer, type PlaybackState } from '../services/speech';
import { recordingFor } from '../services/recordings';

export function Pronunciation({ text }: { text: string }) {
  const [state, setState] = useState<PlaybackState>('idle');
  const [slow, setSlow] = useState(false);
  const [player] = useState(() => createPronunciationPlayer(() => new Audio(), setState));
  const source = recordingFor(text, import.meta.env.BASE_URL);
  const active = state === 'loading' || state === 'playing';

  useEffect(() => {
    player.stop();
    return () => player.dispose();
  }, [text, player]);

  const speak = () => {
    if (active) player.stop();
    else if (source) player.play(source, slow);
  };

  return (
    <div className="pronunciation">
      <div className="audio-controls">
        <button className="listen-button" onClick={speak} disabled={!source} aria-label={active ? 'Arrêter la lecture' : 'Écouter la prononciation'}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {active ? <path d="M8 5v14M16 5v14" /> : <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
          </svg>
          {active ? 'Arrêter' : 'Écouter'}
        </button>
        <label className="slow-toggle"><input type="checkbox" checked={slow} onChange={event => { player.stop(); setSlow(event.target.checked); }} /> Lentement</label>
      </div>
      <p className="audio-status" role="status">
        {!source ? 'La prononciation de ce texte n’est pas encore disponible.'
          : state === 'error' ? 'La lecture a échoué. Vérifiez votre connexion, puis réessayez.'
          : state === 'loading' ? 'Chargement de la voix…' : ''}
      </p>
    </div>
  );
}
