import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Mic, 
  Zap, 
  Globe, 
  Crown, 
  Check, 
  ShieldCheck, 
  Layers,
  Volume2,
  VolumeX,
  Play,
  Bookmark,
  FileDown,
  Gauge,
  Flame,
  Search,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth, PlanTier } from '../context/AuthContext';
import { speechManager } from '../lib/speechManager';

interface BolexPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTierTab?: 'plus' | 'ultra';
}

export function BolexPlusModal({ isOpen, onClose }: BolexPlusModalProps) {
  const { user, profile, effectiveTier, isTrialActive, trialRemainingText, startTrial, cancelTrial, setPlanTier } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'tiers' | 'matrix'>('tiers');

  useEffect(() => {
    return () => {
      if (isPlayingDemo) {
        speechManager.stop();
      }
    };
  }, [isPlayingDemo]);

  if (!isOpen) return null;

  const handleStartTrial = async (tier: 'plus' | 'ultra') => {
    setIsUpdating(true);
    try {
      await startTrial(tier);
    } catch (err) {
      console.error('Failed to start trial:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectPlan = async (tier: PlanTier) => {
    setIsUpdating(true);
    try {
      await setPlanTier(tier);
    } catch (err) {
      console.error('Failed to update plan:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelTrial = async () => {
    setIsUpdating(true);
    try {
      await cancelTrial();
    } catch (err) {
      console.error('Failed to cancel trial:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestSpeech = () => {
    if (isPlayingDemo) {
      speechManager.stop();
      setIsPlayingDemo(false);
      return;
    }

    const demoText = effectiveTier === 'ultra'
      ? 'Welcome to Bolex Ultra. You have unlocked unlimited infinite questions, 1M extended context memory, VIP zero-latency routing, and cognitive deep reasoning.'
      : effectiveTier === 'plus'
      ? 'Welcome to Bolex Plus. Your active perks include infinite questions and statements, continuous voice dictation, and the neural audio studio.'
      : 'Hello! Bolex Free plan includes 60 questions or statements per conversation. Activate your 3-day free trial of Bolex Plus or Bolex Ultra to unlock unlimited questions instantly.';

    setIsPlayingDemo(true);
    speechManager.speak('tier-voice-test', demoText, demoSpeed);

    const checkInterval = setInterval(() => {
      const state = speechManager.getState();
      if (state.status === 'idle') {
        setIsPlayingDemo(false);
        clearInterval(checkInterval);
      }
    }, 300);
  };

  const comparisonRows = [
    {
      feature: 'Question & Statement Allowance',
      free: '60 Questions / conversation',
      plus: 'Unlimited (∞)',
      ultra: 'Unlimited (∞) + 1M Memory',
      highlight: true,
    },
    {
      feature: '3-Day Free Trial',
      free: '—',
      plus: 'Included (1-Click)',
      ultra: 'Included (1-Click)',
      highlight: true,
    },
    {
      feature: 'Web Speech Read-Aloud',
      free: '1.0x Basic Speed',
      plus: '0.5x–2.5x Studio Pace',
      ultra: 'Neural HD + Continuous Pace',
    },
    {
      feature: 'Voice Microphone Dictation',
      free: 'Standard',
      plus: 'Continuous Hands-Free Pro',
      ultra: 'Continuous Pro + Acoustic Filter',
    },
    {
      feature: 'Inference Speed & Latency',
      free: 'Standard Queue',
      plus: 'Priority Turbo Speed',
      ultra: 'VIP Zero-Latency Ultra Lane',
      highlight: true,
    },
    {
      feature: 'Google Search Grounding',
      free: 'Standard Search',
      plus: 'Enhanced Web Grounding',
      ultra: 'Deep Web Research Pro',
    },
    {
      feature: 'Cognitive Deep Reasoning',
      free: 'Standard',
      plus: 'Advanced Reasoning',
      ultra: 'Chain-of-Thought Deep Reasoner',
    },
    {
      feature: 'Multimodal Vision & OCR',
      free: 'Basic Analysis',
      plus: 'High-Res Vision Processing',
      ultra: 'Unlimited Multimodal OCR Studio',
    },
    {
      feature: 'Conversation Pinning & Search',
      free: '—',
      plus: 'Unlimited Pinned Chats',
      ultra: 'Unlimited Pinned + Global Search',
    },
    {
      feature: 'Document Export Suite',
      free: 'Markdown (.md)',
      plus: 'Markdown & JSON Backup',
      ultra: 'Markdown, JSON, Text, & PDF Layout',
    },
    {
      feature: 'VIP Profile Distinction',
      free: 'Standard Explorer',
      plus: 'Gold Plus Crown Badge',
      ultra: 'Radiant Titanium Ultra Badge',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-500/10">
              <Sparkles className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Bolex Membership Tiers & 3-Day Trials
                </h2>
                {isTrialActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    ⚡ 3-Day Trial Active ({trialRemainingText})
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Choose the perfect tier for intelligent reasoning, infinite tokens, and neural speech synthesis.
              </p>
            </div>
          </div>

          <button
            id="close-bolex-plus-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tiers'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Tier Plans & 3-Day Trials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Head-to-Head Comparison Matrix
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm flex-1">
          {activeTab === 'tiers' ? (
            <>
              {/* 3 Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. FREE PLAN */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  effectiveTier === 'free' && !isTrialActive
                    ? 'bg-neutral-950/90 border-neutral-600 shadow-md ring-1 ring-neutral-700'
                    : 'bg-neutral-950/40 border-neutral-850'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Starter</span>
                      {effectiveTier === 'free' && !isTrialActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Active Plan
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">Free Plan</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-neutral-200">$0</span>
                        <span className="text-xs text-neutral-500">/ forever</span>
                      </div>
                    </div>

                    <div className="py-2 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                      <span className="text-neutral-400">Question Allowance: </span>
                      <strong className="text-amber-400 font-mono">60 questions / chat</strong>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>60 statements or questions per chat</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Basic Web Speech (1.0x)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Standard voice dictation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Single image attachments</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    {effectiveTier === 'free' && !isTrialActive ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 rounded-lg bg-neutral-800 text-neutral-400 text-xs font-semibold cursor-default text-center"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan('free')}
                        disabled={isUpdating}
                        className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold transition-colors"
                      >
                        Downgrade to Free
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. BOLEX PLUS */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between relative transition-all ${
                  effectiveTier === 'plus'
                    ? 'bg-amber-950/20 border-amber-500/70 shadow-lg ring-1 ring-amber-500/50'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-amber-500/30'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Plus</span>
                      </div>
                      {effectiveTier === 'plus' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {isTrialActive ? '3-Day Trial' : 'Active Plan'}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                        Bolex Plus
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-400">$12</span>
                        <span className="text-xs text-neutral-400">/ month</span>
                      </div>
                    </div>

                    <div className="py-2 px-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs">
                      <span className="text-neutral-300">Session Tokens: </span>
                      <strong className="text-emerald-400 font-mono font-bold">∞ Unlimited</strong>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-200">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Infinite (∞) Tokens</strong> in all chats</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Neural Web Speech Studio (0.5x–2.5x)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Continuous Voice Dictation Pro</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Priority Turbo reasoning speed</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Unlimited Conversation Pinning</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 space-y-2">
                    {effectiveTier === 'plus' ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-default text-center flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isTrialActive ? `Trial Active: ${trialRemainingText}` : 'Active Plus Member'}</span>
                        </button>
                        {isTrialActive && (
                          <button
                            type="button"
                            onClick={handleCancelTrial}
                            disabled={isUpdating}
                            className="w-full py-1 text-[11px] text-neutral-400 hover:text-rose-400 transition-colors"
                          >
                            Cancel 3-Day Trial
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          id="start-plus-trial-btn"
                          type="button"
                          onClick={() => handleStartTrial('plus')}
                          disabled={isUpdating}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{isUpdating ? 'Activating...' : 'Start 3-Day Free Trial'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPlan('plus')}
                          disabled={isUpdating}
                          className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 text-xs font-medium transition-colors"
                        >
                          Subscribe ($12/mo)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. BOLEX ULTRA (NEW PREMIER TIER) */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between relative transition-all overflow-hidden ${
                  effectiveTier === 'ultra'
                    ? 'bg-purple-950/20 border-purple-500/80 shadow-xl ring-1 ring-purple-500/50'
                    : 'bg-neutral-950/80 border-purple-500/40 hover:border-purple-500/70'
                }`}>
                  {/* Premier ribbon */}
                  <div className="absolute -right-12 top-6 bg-gradient-to-r from-purple-500 to-amber-500 text-neutral-950 font-black text-[9px] uppercase tracking-wider py-0.5 px-12 rotate-45 shadow-sm">
                    TITANIUM PINNACLE
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Ultra Pro</span>
                      </div>
                      {effectiveTier === 'ultra' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {isTrialActive ? '3-Day Trial' : 'Active Plan'}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                        Bolex Ultra
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-300">$28</span>
                        <span className="text-xs text-neutral-400">/ month</span>
                      </div>
                    </div>

                    <div className="py-2 px-2.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-xs">
                      <span className="text-neutral-300">Tokens & Context: </span>
                      <strong className="text-purple-300 font-mono font-bold">∞ Inf + 1M Memory</strong>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-200">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span><strong>Infinite (∞) Tokens</strong> + 1M Deep Memory</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span><strong>VIP Zero-Latency Ultra Lane</strong> (bypasses queues)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span><strong>Deep Web Research Pro</strong> with synthesized citations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span><strong>Cognitive Deep Reasoning</strong> chain-of-thought mode</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Unlimited Multimodal Vision & OCR</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Universal Export (Markdown, JSON, PDF)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 space-y-2">
                    {effectiveTier === 'ultra' ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold cursor-default text-center flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isTrialActive ? `Trial Active: ${trialRemainingText}` : 'Active Ultra VIP'}</span>
                        </button>
                        {isTrialActive && (
                          <button
                            type="button"
                            onClick={handleCancelTrial}
                            disabled={isUpdating}
                            className="w-full py-1 text-[11px] text-neutral-400 hover:text-rose-400 transition-colors"
                          >
                            Cancel 3-Day Trial
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          id="start-ultra-trial-btn"
                          type="button"
                          onClick={() => handleStartTrial('ultra')}
                          disabled={isUpdating}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:opacity-95 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{isUpdating ? 'Activating...' : 'Start 3-Day Free Trial (Ultra)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPlan('ultra')}
                          disabled={isUpdating}
                          className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 text-xs font-medium transition-colors"
                        >
                          Subscribe ($28/mo)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Speech Studio Preview */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">Live Web Speech Audio Studio Preview</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">Available across Plus & Ultra</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-850">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400 font-medium">Pace:</span>
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          setDemoSpeed(speed);
                          speechManager.setReadSpeed(speed);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                          demoSpeed === speed
                            ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-xs'
                            : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSpeech}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isPlayingDemo
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                    }`}
                  >
                    {isPlayingDemo ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Audition Voice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Full Comparison Matrix */
            <div className="space-y-4">
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                <div className="p-3 bg-neutral-900/70 border-b border-neutral-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Full Feature Comparison Matrix</span>
                  <span className="text-neutral-400">All features unlocked instantly during 3-day free trials</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/40">
                        <th className="p-3 font-semibold text-neutral-300 w-1/3">Capability</th>
                        <th className="p-3 font-semibold text-neutral-400 text-center">Free Plan</th>
                        <th className="p-3 font-semibold text-amber-400 text-center">Bolex Plus</th>
                        <th className="p-3 font-semibold text-purple-300 text-center bg-purple-950/10">Bolex Ultra (VIP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {comparisonRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-neutral-900/40 transition-colors ${
                            row.highlight ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="p-3 text-neutral-200 font-medium">{row.feature}</td>
                          <td className="p-3 text-neutral-400 text-center">{row.free}</td>
                          <td className="p-3 text-amber-300 text-center font-medium">{row.plus}</td>
                          <td className="p-3 text-purple-200 text-center font-semibold bg-purple-950/10">
                            {row.ultra}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Trial CTAs from matrix view */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartTrial('plus')}
                  disabled={isUpdating}
                  className="p-3 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Try Bolex Plus Free for 3 Days</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStartTrial('ultra')}
                  disabled={isUpdating}
                  className="p-3 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <span>Try Bolex Ultra Free for 3 Days</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {user ? (
              <span>Account: <strong className="text-neutral-300">{user.email}</strong></span>
            ) : (
              <span>Guest session — 3-day trials can be activated instantly with 1-click.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-bolex-plus-footer-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
