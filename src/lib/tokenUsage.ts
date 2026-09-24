import { ChatMessage, ChatSession } from '../types';

export interface SessionTokenStats {
  id: string;
  title: string;
  shortTitle: string;
  createdAt: number;
  updatedAt: number;
  dateLabel: string;
  timeLabel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  hasImages: boolean;
}

export interface OverallTokenMetrics {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalMessages: number;
  sessionCount: number;
  avgTokensPerSession: number;
  highestUsageSession: SessionTokenStats | null;
}

/**
 * Accurately estimates token count for a text string using Gemini/standard subword tokenizer heuristics.
 * ~3.8 characters per token on average for natural English, code and symbols.
 */
export function estimateTextTokens(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  
  // Word & character hybrid estimation for highest accuracy across code and markdown
  const words = trimmed.split(/\s+/).length;
  const chars = trimmed.length;
  const charBased = Math.ceil(chars / 3.8);
  const wordBased = Math.ceil(words * 1.3);
  
  return Math.max(1, Math.round((charBased * 0.6) + (wordBased * 0.4)));
}

/**
 * Estimates token usage for a single chat message
 */
export function estimateMessageTokens(message: ChatMessage): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const isAssistant = message.role === 'assistant';
  let tokenCount = estimateTextTokens(message.content);
  
  // Overhead per message envelope in chat format
  tokenCount += 4;
  
  // Image tokens if user attached an image (~258 tokens standard Gemini multimodal tile)
  if (message.image) {
    tokenCount += 258;
  }

  if (isAssistant) {
    return {
      promptTokens: 0,
      completionTokens: tokenCount,
      totalTokens: tokenCount,
    };
  } else {
    return {
      promptTokens: tokenCount,
      completionTokens: 0,
      totalTokens: tokenCount,
    };
  }
}

/**
 * Calculates token stats for an entire conversation session
 */
export function calculateSessionTokenStats(session: ChatSession): SessionTokenStats {
  let promptTokens = 0;
  let completionTokens = 0;
  let userMessageCount = 0;
  let assistantMessageCount = 0;
  let hasImages = false;

  // Include system prompt tokens if present
  if (session.customSystemPrompt) {
    promptTokens += estimateTextTokens(session.customSystemPrompt);
  }

  (session.messages || []).forEach((msg) => {
    const est = estimateMessageTokens(msg);
    promptTokens += est.promptTokens;
    completionTokens += est.completionTokens;

    if (msg.role === 'user') {
      userMessageCount++;
      if (msg.image) hasImages = true;
    } else if (msg.role === 'assistant') {
      assistantMessageCount++;
    }
  });

  const totalTokens = promptTokens + completionTokens;
  const dateObj = new Date(session.updatedAt || session.createdAt || Date.now());
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rawTitle = session.title || 'Untitled Session';
  const shortTitle = rawTitle.length > 18 ? rawTitle.slice(0, 18) + '...' : rawTitle;

  return {
    id: session.id,
    title: rawTitle,
    shortTitle,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    dateLabel,
    timeLabel,
    promptTokens,
    completionTokens,
    totalTokens,
    messageCount: (session.messages || []).length,
    userMessageCount,
    assistantMessageCount,
    hasImages,
  };
}

/**
 * Aggregates statistics across all sessions
 */
export function calculateOverallTokenMetrics(sessions: ChatSession[]): {
  overall: OverallTokenMetrics;
  sessionStats: SessionTokenStats[];
} {
  const sessionStats = sessions.map(calculateSessionTokenStats);
  
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalMessages = 0;
  let highestUsageSession: SessionTokenStats | null = null;

  sessionStats.forEach((stat) => {
    totalPromptTokens += stat.promptTokens;
    totalCompletionTokens += stat.completionTokens;
    totalMessages += stat.messageCount;

    if (!highestUsageSession || stat.totalTokens > highestUsageSession.totalTokens) {
      highestUsageSession = stat;
    }
  });

  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const sessionCount = sessions.length;
  const avgTokensPerSession = sessionCount > 0 ? Math.round(totalTokens / sessionCount) : 0;

  return {
    overall: {
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      totalMessages,
      sessionCount,
      avgTokensPerSession,
      highestUsageSession,
    },
    sessionStats,
  };
}
