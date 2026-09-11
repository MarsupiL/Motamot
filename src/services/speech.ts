export type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';

// A fresh element per playback isolates late events from a previous word.
export function createPronunciationPlayer(
  createAudio: () => HTMLAudioElement,
  onState: (state: PlaybackState) => void,
) {
  let current: HTMLAudioElement | null = null;

  const release = () => {
    const previous = current;
    current = null;
    if (!previous) return;
    previous.onended = previous.onpause = previous.onerror = previous.onplaying = previous.onwaiting = null;
    previous.pause();
    previous.removeAttribute('src');
    previous.load();
  };

  return {
    stop() { release(); onState('idle'); },
    dispose: release,
    play(source: string) {
      release();
      let audio: HTMLAudioElement;
      try {
        audio = createAudio();
      } catch {
        onState('error');
        return;
      }
      current = audio;
      const fail = () => {
        if (current !== audio) return;
        release();
        onState('error');
      };
      audio.onpause = audio.onended = () => {
        if (current !== audio) return;
        release();
        onState('idle');
      };
      audio.onerror = fail;
      audio.onplaying = () => { if (current === audio) onState('playing'); };
      audio.onwaiting = () => { if (current === audio) onState('loading'); };
      audio.preload = 'none';
      audio.src = source;
      onState('loading');
      // Call play directly in the tap handler to retain mobile user activation.
      try { void audio.play().catch(fail); } catch { fail(); }
    },
  };
}
