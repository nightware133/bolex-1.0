import React from 'react';
import { Sparkles, Crown, Zap, AlertTriangle, ShieldCheck, Flame, MessageSquare } from 'lucide-react';
import { PlanTier } from '../context/AuthContext';
import { FREE_TIER_CREDIT_LIMIT } from '../lib/tokenCounter';

interface TokenIndicatorProps {
  tokens: number;
  tier: PlanTier;
  isTrialActive: boolean;
  trialRemainingText: string | null;
  onOpenUpgradeModal: () => void;
  variant?: 'header' | 'footer' | 'banner';
}

export function TokenIndicator({
  tokens,
  tier,
  isTrialActive,
  trialRemainingText,
  onOpenUpgradeModal,
  variant = 'footer',
}: TokenIndicatorProps) {
  const isUnlimited = tier === 'plus' || tier === 'ultra' || tier === 'quantum' || isTrialActive;
  const limit = FREE_TIER_CREDIT_LIMIT;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((tokens / limit) * 100));
  const isLimitReached = !isUnlimited && tokens >= limit;
  const isWarning = !isUnlimited && tokens >= 50 && !isLimitReached;

  // Header compact pill
  if (variant === 'header') {
    if (isUnlimited) {
      const isQuantum = tier === 'quantum';
      const isUltra = tier === 'ultra';
      return (
        <button
          type="button"
          onClick={onOpenUpgradeModal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border ${
            isQuantum
              ? 'bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/30'
              : isUltra
              ? 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-500/40 shadow-xs'
              : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/40 shadow-xs'
          }`}
          title={`${isQuantum ? 'Bolex Quantum Infinity VIP' : isUltra ? 'Bolex Ultra VIP' : 'Bolex Plus'}: Unlimited questions & statements. Click to manage subscription.`}
        >
          {isQuantum ? (
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : isUltra ? (
            <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-semibold">{tokens}</span>
          <span className="text-neutral-400">/</span>
          <span className={`${isQuantum ? 'text-cyan-300' : 'text-emerald-400'} font-bold`}>∞</span>
          {isTrialActive && (
            <span className="hidden lg:inline text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-sans font-bold">
              TRIAL
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenUpgradeModal}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border ${
          isLimitReached
            ? 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-600/60 animate-pulse'
            : isWarning
            ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-500/50'
            : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700/60'
        }`}
        title={`Questions answered: ${tokens} of ${limit} free questions. Click to unlock unlimited questions with a 3-Day Free Trial.`}
      >
        <MessageSquare className={`w-3.5 h-3.5 ${isLimitReached ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-neutral-400'}`} />
        <span className="font-semibold">{tokens}</span>
        <span className="text-neutral-500">/</span>
        <span className={isLimitReached ? 'text-rose-400 font-bold' : 'text-neutral-400'}>{limit} questions</span>
      </button>
    );
  }

  // Warning or limit banner for input area
  if (variant === 'banner') {
    if (isUnlimited) return null;

    if (isLimitReached) {
      return (
        <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-neutral-900 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-rose-300">Free 60 Questions Limit Reached ({tokens}/{limit})</span>
              <p className="text-[11px] text-neutral-400">You have used all 60 free questions in this chat. Start a new chat or unlock infinite questions instantly with a 3-Day Free Trial.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Start 3-Day Free Trial (∞ Questions)</span>
          </button>
        </div>
      );
    }

    if (isWarning) {
      return (
        <div className="mb-2 p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-between text-xs text-amber-300/90">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">Free plan question budget: <strong>{limit - tokens} questions left</strong> in this conversation.</span>
          </div>
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Try 3-Day Trial (∞ Unlimited)</span>
          </button>
        </div>
      );
    }

    return null;
  }

  // Default: Footer Token / Question Meter Bar
  return (
    <div className="w-full flex items-center justify-between gap-3 text-xs py-1 px-1">
      {isUnlimited ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {tier === 'ultra' ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-[11px]">
                <Flame className="w-3 h-3 text-purple-400" />
                <span>Bolex Ultra VIP</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Bolex Plus</span>
              </span>
            )}

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
              <span className="text-neutral-400">Questions Asked:</span>
              <strong className="text-white">{tokens}</strong>
              <span className="text-neutral-500">/</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                ∞ Unlimited Questions
              </span>
            </div>

            {isTrialActive && trialRemainingText && (
              <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                3-Day Trial: {trialRemainingText}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="text-[11px] text-neutral-400 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Manage Plan & Perks</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
            <span className="text-[11px] font-medium text-neutral-400 shrink-0 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span>Free Plan Questions:</span>
            </span>

            {/* Progress Bar Meter */}
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden max-w-[140px] sm:max-w-[200px]">
              <div
                className={`h-full transition-all duration-300 ${
                  isLimitReached
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <span className="font-mono text-[11px] text-neutral-300 shrink-0">
              <strong className={isLimitReached ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white'}>
                {tokens}
              </strong>
              <span className="text-neutral-500"> / {limit} questions</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0 font-semibold hover:underline"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>3-Day Trial (∞ Unlimited)</span>
          </button>
        </div>
      )}
    </div>
  );
}

