import { useEffect, useRef, useState } from 'react';
import { selectFrenchVoice } from '../services/speech';

export function Pronunciation({ text }: { text: string }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [slow, setSlow] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = () => {
    utteranceRef.current = null;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const update = () => setVoice(selectFrenchVoice(synth.getVoices()));
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, [supported]);

  useEffect(() => {
    setError('');
    setSpeaking(false);
    return () => {
      utteranceRef.current = null;
      if (supported) window.speechSynthesis.cancel();
    };
  }, [text, supported]);

  const speak = () => {
    if (speaking) { stop(); return; }
    if (!supported || !voice) return;
    stop();
    setError('');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = slow ? 0.72 : 0.9;
    utteranceRef.current = utterance;
    utterance.onend = () => {
      if (utteranceRef.current === utterance) { utteranceRef.current = null; setSpeaking(false); }
    };
    utterance.onerror = event => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setSpeaking(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('La lecture est indisponible. Réessayez ou vérifiez les voix françaises de votre appareil.');
      }
    };
    try {
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    } catch {
      stop();
      setError('La lecture est indisponible sur cet appareil.');
    }
  };

  return (
    <div className="pronunciation">
      <div className="audio-controls">
        <button className="listen-button" onClick={speak} disabled={!voice} aria-label={speaking ? 'Arrêter la lecture' : 'Écouter la prononciation'}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {speaking ? <path d="M8 5v14M16 5v14" /> : <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>}
          </svg>
          {speaking ? 'Arrêter' : 'Écouter'}
        </button>
        <label className="slow-toggle"><input type="checkbox" checked={slow} onChange={event => { stop(); setSlow(event.target.checked); }} /> Lentement</label>
      </div>
      <p className="audio-status" role="status">
        {error || (!supported ? 'La lecture audio n’est pas disponible dans ce navigateur.' : !voice ? 'Aucune voix française disponible. Ajoutez-en une dans les réglages de votre appareil.' : '')}
      </p>
    </div>
  );
}
