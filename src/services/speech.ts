export type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';
const LOADING_TIMEOUT_MS = 15_000;

// A fresh element per playback isolates late events from a previous word.
export function createPronunciationPlayer(
  createAudio: () => HTMLAudioElement,
  onState: (state: PlaybackState) => void,
) {
  let current: HTMLAudioElement | null = null;
  let loadingTimeout: ReturnType<typeof setTimeout> | undefined;

  const clearLoadingTimeout = () => {
    clearTimeout(loadingTimeout);
    loadingTimeout = undefined;
  };

  const release = () => {
    clearLoadingTimeout();
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
      const waitForPlayback = () => {
        if (current !== audio) return;
        onState('loading');
        // Repeated waiting events must not postpone a failed connection forever.
        loadingTimeout ??= setTimeout(fail, LOADING_TIMEOUT_MS);
      };
      audio.onpause = audio.onended = () => {
        if (current !== audio) return;
        release();
        onState('idle');
      };
      audio.onerror = fail;
      audio.onplaying = () => {
        if (current !== audio) return;
        clearLoadingTimeout();
        onState('playing');
      };
      audio.onwaiting = waitForPlayback;
      audio.preload = 'none';
      audio.src = source;
      waitForPlayback();
      // Call play directly in the tap handler to retain mobile user activation.
      try { void audio.play().catch(fail); } catch { fail(); }
    },
  };
}
