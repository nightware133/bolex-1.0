import React from 'react';
import { 
  X, 
  Sparkles, 
  Mic, 
  Zap, 
  Globe, 
  Crown, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BolexPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BolexPlusModal({ isOpen, onClose }: BolexPlusModalProps) {
  const { user, profile, setBolexPlus } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  if (!isOpen) return null;

  const isPlus = Boolean(profile?.isBolexPlus || profile?.planTier === 'plus');

  const handleTogglePlus = async (enable: boolean) => {
    setIsUpdating(true);
    try {
      await setBolexPlus(enable);
    } catch (err) {
      console.error('Failed to update Bolex Plus status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const perksList = [
    {
      icon: Mic,
      title: 'Web Speech Voice Dictation Pro',
      description: 'Continuous hands-free speech-to-text dictation with smart punctuation and instant live transcript buffer.',
      badge: 'Voice Mode',
    },
    {
      icon: Zap,
      title: 'Priority Turbo Speed',
      description: 'Accelerated token streaming with ultra-low latency and maximum context processing capability.',
      badge: 'Accelerated',
    },
    {
      icon: Globe,
      title: 'Deep Search Grounding',
      description: 'Real-time live Google Search grounding synthesized with authoritative web references.',
      badge: 'Web Grounded',
    },
    {
      icon: Layers,
      title: 'Custom Architect Personas',
      description: 'Unlock advanced persona roles and custom system instructions with deep chain-of-thought analysis.',
      badge: 'Advanced Roles',
    },
    {
      icon: Crown,
      title: 'Verified Bolex Plus Badge',
      description: 'Gold verified status symbol across your profile, conversation headers, and account drawer.',
      badge: 'Verified',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Cloud Profile Sync',
      description: 'Instant persistent synchronization with owner-only access rules in Firebase Firestore.',
      badge: 'Cloud Sync',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/40 border-b border-amber-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Bolex Plus</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    Member Perks
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                  Elevate your assistant with continuous voice dictation, turbo inference, and deep reasoning.
                </p>
              </div>
            </div>

            <button
              id="close-bolex-plus-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Active status indicator */}
          <div className={`p-4 rounded-xl border transition-all ${
            isPlus 
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30'
              : 'bg-neutral-950 border-neutral-800 text-neutral-300'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPlus ? 'bg-amber-400 animate-pulse' : 'bg-neutral-500'}`} />
                  <span className="text-sm font-semibold text-white">
                    Current Plan: {isPlus ? 'Bolex Plus (Active)' : 'Bolex Free Tier'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {isPlus 
                    ? 'All Bolex Plus perks including continuous Web Speech dictation and turbo reasoning are unlocked.'
                    : 'Upgrade to Bolex Plus to unlock continuous microphone dictation and priority responses.'}
                </p>
              </div>

              {isPlus ? (
                <button
                  id="downgrade-plus-btn"
                  type="button"
                  onClick={() => handleTogglePlus(false)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Switch to Free Tier'}
                </button>
              ) : (
                <button
                  id="activate-plus-btn"
                  type="button"
                  onClick={() => handleTogglePlus(true)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
                >
                  {isUpdating ? 'Activating...' : 'Activate Bolex Plus'}
                </button>
              )}
            </div>
          </div>

          {/* Perks Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Exclusive Plus Capabilities</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perksList.map((perk, index) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-neutral-200">{perk.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                        {perk.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed pl-8">
                      {perk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
            <div className="p-3 bg-neutral-900/60 border-b border-neutral-800 text-xs font-semibold text-neutral-300">
              Plan Comparison
            </div>
            <div className="divide-y divide-neutral-800 text-xs">
              <div className="grid grid-cols-3 p-2.5 px-3.5 font-medium text-neutral-400 bg-neutral-950">
                <span>Capability</span>
                <span className="text-center">Free Tier</span>
                <span className="text-center text-amber-400 font-semibold">Bolex Plus</span>
              </div>
              <div className="grid grid-cols-3 p-2.5 px-3.5 text-neutral-300 items-center">
                <span>Web Speech Dictation</span>
                <span className="text-center text-neutral-400">Standard</span>
                <span className="text-center text-amber-300 font-medium flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Continuous Pro
                </span>
              </div>
              <div className="grid grid-cols-3 p-2.5 px-3.5 text-neutral-300 items-center">
                <span>Response Speed</span>
                <span className="text-center text-neutral-400">Standard</span>
                <span className="text-center text-amber-300 font-medium flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Priority Turbo
                </span>
              </div>
              <div className="grid grid-cols-3 p-2.5 px-3.5 text-neutral-300 items-center">
                <span>Search Grounding</span>
                <span className="text-center text-neutral-400">Included</span>
                <span className="text-center text-amber-300 font-medium flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Deep Real-Time
                </span>
              </div>
              <div className="grid grid-cols-3 p-2.5 px-3.5 text-neutral-300 items-center">
                <span>Verified Plus Badge</span>
                <span className="text-center text-neutral-500">—</span>
                <span className="text-center text-amber-300 font-medium flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Included
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {user ? (
              <span>Linked to <strong className="text-neutral-300">{user.email}</strong></span>
            ) : (
              <span>Guest mode — perks can be tested instantly.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-bolex-plus-footer-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
            {!isPlus && (
              <button
                id="footer-activate-plus-btn"
                type="button"
                onClick={() => handleTogglePlus(true)}
                disabled={isUpdating}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Activating...' : 'Upgrade to Plus'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
