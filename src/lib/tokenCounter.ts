/**
 * Credits & Token Counter Utility for Bolex AI
 * Free plan: 60 questions/statements allowance per conversation session.
 * Bolex Plus & Ultra: Unlimited (∞) questions/statements.
 */

import { ChatMessage } from '../types';

export const FREE_TIER_CREDIT_LIMIT = 60;
// Keep legacy token limit export for backward compatibility
export const FREE_TIER_TOKEN_LIMIT = FREE_TIER_CREDIT_LIMIT;

/**
 * Standard token approximation for model reasoning/character counts
 */
export function estimateTextTokens(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const charBased = Math.ceil(trimmed.length / 4);
  const wordBased = Math.ceil(words.length * 1.33);

  return Math.max(1, Math.round((charBased * 0.6) + (wordBased * 0.4)));
}

/**
 * Count the number of user questions/statements asked in an active session.
 * Each user question counts as exactly 1 credit.
 */
export function calculateSessionQuestions(messages: ChatMessage[]): number {
  if (!messages || messages.length === 0) return 0;
  return messages.filter((m) => m.role === 'user').length;
}

/**
 * Calculate total credits / questions used in an active session.
 * Free plan allows 60 questions/statements (not subtracting per token/word).
 */
export function calculateSessionTokens(
  messages: ChatMessage[],
  _customSystemPrompt?: string
): number {
  return calculateSessionQuestions(messages);
}

export type PlanTier = 'free' | 'plus' | 'ultra';

export interface TokenStatus {
  currentCredits: number;
  currentTokens: number;
  limit: number | 'infinity';
  percentage: number;
  isLimitReached: boolean;
  remainingCredits: number;
  remainingTokens: number;
  displayLimit: string;
  isUnlimited: boolean;
}

export function getTokenStatus(
  creditsOrTokens: number,
  tier: PlanTier,
  isTrialActive = false
): TokenStatus {
  // If user is on Plus or Ultra, or has an active 3-day trial of either, credits are infinite
  if (tier === 'plus' || tier === 'ultra' || isTrialActive) {
    return {
      currentCredits: creditsOrTokens,
      currentTokens: creditsOrTokens,
      limit: 'infinity',
      percentage: 0,
      isLimitReached: false,
      remainingCredits: Infinity,
      remainingTokens: Infinity,
      displayLimit: '∞',
      isUnlimited: true,
    };
  }

  // Free Tier has a 60 question/statement credit limit per session
  const limit = FREE_TIER_CREDIT_LIMIT;
  const percentage = Math.min(100, Math.round((creditsOrTokens / limit) * 100));
  const isLimitReached = creditsOrTokens >= limit;
  const remainingCredits = Math.max(0, limit - creditsOrTokens);

  return {
    currentCredits: creditsOrTokens,
    currentTokens: creditsOrTokens,
    limit,
    percentage,
    isLimitReached,
    remainingCredits,
    remainingTokens: remainingCredits,
    displayLimit: `${limit}`,
    isUnlimited: false,
  };
}

