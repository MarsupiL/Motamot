import recordings from '../data/pronunciations.json' with { type: 'json' };

export function recordingFor(text: string, baseUrl: string): string | undefined {
  const filename = Object.prototype.hasOwnProperty.call(recordings, text)
    ? (recordings as Record<string, string>)[text] : undefined;
  return filename ? `${baseUrl}audio/${filename}` : undefined;
}
