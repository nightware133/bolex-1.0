/**
 * Web Speech API Narration and Synthesis Engine for Bolex AI
 */

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
  isNatural: boolean;
}

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    // Replace code blocks with descriptive text
    .replace(/```[a-z0-9_-]*\n([\s\S]*?)```/gi, ' [Code omitted for listening] ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Remove markdown images and links
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove headings and replace with sentence stops
    .replace(/#{1,6}\s*(.*)/g, '$1. ')
    // Remove bold and italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove blockquotes and list bullets
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/>\s*(.*)/g, '$1')
    // Remove table borders and separators
    .replace(/\|/g, ' ')
    .replace(/[-:]{3,}/g, '')
    // Collapse excess spaces and clean punctuation
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getSpeechMetrics(text: string, rate: number = 1.0) {
  if (!text) return { wordCount: 0, estimatedSeconds: 0, displayDuration: '0s' };
  
  const clean = cleanTextForSpeech(text);
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Average human reading/speaking speed is ~150 words per minute at 1.0x rate
  const wordsPerMinute = 150 * (rate || 1.0);
  const totalMinutes = wordCount / wordsPerMinute;
  const estimatedSeconds = Math.ceil(totalMinutes * 60);

  let displayDuration = '';
  if (estimatedSeconds < 60) {
    displayDuration = `${estimatedSeconds}s`;
  } else {
    const mins = Math.floor(estimatedSeconds / 60);
    const secs = estimatedSeconds % 60;
    displayDuration = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  return {
    wordCount,
    estimatedSeconds,
    displayDuration,
  };
}

export function getStoredSpeechSettings() {
  try {
    const raw = localStorage.getItem('bolex_speech_settings_v1');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    rate: 1.0,
    pitch: 1.0,
    voiceURI: '',
    autoNarrate: false,
  };
}

export function saveStoredSpeechSettings(settings: {
  rate: number;
  pitch: number;
  voiceURI?: string;
  autoNarrate: boolean;
}) {
  try {
    localStorage.setItem('bolex_speech_settings_v1', JSON.stringify(settings));
  } catch {
    // fallback
  }
}
