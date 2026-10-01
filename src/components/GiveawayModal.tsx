import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Gift, 
  Users, 
  Crown,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Giveaway, GiveawayParticipant, saveStoredGiveaways } from '../lib/founder';
import { useAuth } from '../context/AuthContext';

interface GiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  giveaways: Giveaway[];
  onGiveawaysUpdated: (updated: Giveaway[]) => void;
  onOpenFounder?: () => void;
  isFounder?: boolean;
}

export function GiveawayModal({
  isOpen,
  onClose,
  giveaways,
  onGiveawaysUpdated,
  onOpenFounder,
  isFounder = false
}: GiveawayModalProps) {
  const { user, profile } = useAuth();
  const [enteredGiveaways, setEnteredGiveaways] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState(profile?.displayName || user?.displayName || '');
  const [emailInput, setEmailInput] = useState(profile?.email || user?.email || '');

  if (!isOpen) return null;

  const handleEnterGiveaway = (giveawayId: string) => {
    const finalName = nameInput.trim() || 'Community Member';
    const finalEmail = emailInput.trim() || 'member@bolex.ai';

    const updated = giveaways.map((g) => {
      if (g.id === giveawayId) {
        // Prevent duplicate entries
        const alreadyEntered = g.participants.some((p) => p.email.toLowerCase() === finalEmail.toLowerCase());
        if (alreadyEntered) return g;

        const newParticipant: GiveawayParticipant = {
          id: `p-${Date.now()}`,
          name: finalName,
          email: finalEmail,
          enteredAt: Date.now(),
        };

        return {
          ...g,
          participants: [newParticipant, ...g.participants],
        };
      }
      return g;
    });

    setEnteredGiveaways((prev) => [...prev, giveawayId]);
    onGiveawaysUpdated(updated);
    saveStoredGiveaways(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Community Giveaways</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live & Free to Enter
                </span>
              </div>
              <p className="text-xs text-neutral-400">Win Bolex Ultra memberships & VIP passes hosted by Founder Tayden Simon</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Identity Quick Bar if not logged in */}
          {(!user?.email) && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-xs font-semibold text-neutral-300">Your Giveaway Entry Identity</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {giveaways.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs space-y-2">
              <Gift className="w-8 h-8 mx-auto text-neutral-600" />
              <p>No active giveaways right now. Check back soon for the next drop!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {giveaways.map((giveaway) => {
                const isEntered = enteredGiveaways.includes(giveaway.id) || 
                  giveaway.participants.some((p) => p.email.toLowerCase() === (user?.email || emailInput).toLowerCase());

                const daysLeft = Math.max(0, Math.ceil((giveaway.endsAt - Date.now()) / (1000 * 60 * 60 * 24)));

                return (
                  <div 
                    key={giveaway.id} 
                    className="p-5 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-all space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{giveaway.title}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {giveaway.prize}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">{giveaway.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-neutral-200">{daysLeft} days left</span>
                      </div>
                    </div>

                    {/* Entry Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-neutral-850 gap-3">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Users className="w-4 h-4 text-neutral-500" />
                        <span><strong className="text-white font-mono">{giveaway.participants.length}</strong> participants entered</span>
                      </div>

                      {giveaway.status === 'drawn' ? (
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Winner Drawn: {giveaway.winners?.[0]?.name}</span>
                        </div>
                      ) : isEntered ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-default"
                        >
                          <Check className="w-4 h-4" />
                          <span>You Are Entered!</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEnterGiveaway(giveaway.id)}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Enter Giveaway (Free)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Founder Footer Link if applicable */}
          {isFounder && onOpenFounder && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFounder();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
              >
                Founder Console: Create another giveaway or draw winners
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
