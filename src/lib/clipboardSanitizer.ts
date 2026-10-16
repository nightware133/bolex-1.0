/**
 * Bolex AI - Smart Clipboard Sanitizer & Anti-Copy Protection Engine
 * Strips out anti-mastery / anti-cheating copy warnings injected by educational sites
 * (e.g. Edgenuity, Khan Academy, Canvas, Quizlet, Turnitin, etc.)
 */

export const ANTI_COPY_PATTERNS: RegExp[] = [
  // Anti-mastery educational site warnings
  /Copying this information won['’]?t help you achieve mastery of the content\.?\s*You can master it on your own!?/gi,
  /Copying this information won['’]?t help you achieve mastery of the content\.?/gi,
  /You can master it on your own!?/gi,
  /Mastery of the content cannot be achieved by copying\.?/gi,
  
  // Generic copy watermarks and tracking footers
  /Read more at:\s*https?:\/\/[^\s]+/gi,
  /Source:\s*https?:\/\/[^\s]+/gi,
  /Copied from\s+[^\n\r]+/gi,
  /Originally published at\s+[^\n\r]+/gi,
  /All rights reserved\.?\s*Copyright ©\s*\d{4}[^\n\r]*/gi
];

export interface SanitizeResult {
  cleanedText: string;
  wasCleaned: boolean;
  removedWarningsCount: number;
  originalLength: number;
  cleanedLength: number;
}

/**
 * Sanitizes input text by removing anti-copy warnings and boilerplate
 */
export function sanitizeAntiCopyText(text: string): SanitizeResult {
  if (!text) {
    return {
      cleanedText: '',
      wasCleaned: false,
      removedWarningsCount: 0,
      originalLength: 0,
      cleanedLength: 0,
    };
  }

  let cleaned = text;
  let removedCount = 0;

  for (const pattern of ANTI_COPY_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches && matches.length > 0) {
      removedCount += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  }

  // Normalize excess leading/trailing whitespace or multiple blank lines left by removals
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');

  const wasCleaned = removedCount > 0 || cleaned.length < text.length;

  // If the text consisted entirely of anti-copy warning, provide helpful guidance
  if (!cleaned && wasCleaned) {
    cleaned = `[Anti-Copy Warning Detected: The website blocked direct copying. Tip: Take a screenshot (Win+Shift+S or Cmd+Shift+4) and paste the picture here for Bolex Multimodal Vision to analyze!]`;
  }

  return {
    cleanedText: cleaned,
    wasCleaned,
    removedWarningsCount: removedCount,
    originalLength: text.length,
    cleanedLength: cleaned.length,
  };
}

/**
 * Reads text from system clipboard and returns sanitized text
 */
export async function readCleanClipboard(): Promise<{
  text: string;
  wasCleaned: boolean;
  error?: string;
}> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return { text: '', wasCleaned: false, error: 'Clipboard API not supported in this browser environment.' };
    }

    const rawText = await navigator.clipboard.readText();
    if (!rawText || !rawText.trim()) {
      return { text: '', wasCleaned: false, error: 'Clipboard is empty.' };
    }

    const result = sanitizeAntiCopyText(rawText);
    return {
      text: result.cleanedText,
      wasCleaned: result.wasCleaned,
    };
  } catch (err: any) {
    return {
      text: '',
      wasCleaned: false,
      error: err?.message || 'Clipboard access permission denied or blocked.',
    };
  }
}
