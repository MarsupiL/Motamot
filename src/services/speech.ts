type VoiceInfo = Pick<SpeechSynthesisVoice, 'lang' | 'localService'>;

export const selectFrenchVoice = <T extends VoiceInfo>(voices: readonly T[]): T | undefined => {
  const french = voices.filter(voice => /^fr(?:[-_]|$)/i.test(voice.lang));
  const score = (voice: T) => (/^fr[-_]fr$/i.test(voice.lang) ? 2 : 0) + (voice.localService ? 1 : 0);
  return [...french].sort((a, b) => score(b) - score(a))[0];
};
