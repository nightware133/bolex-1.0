import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  Gift, 
  Megaphone, 
  Key, 
  BarChart3, 
  Users, 
  Sparkles, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  Shuffle, 
  Trophy, 
  AlertCircle, 
  Lock, 
  Unlock,
  Radio,
  Send,
  Eye,
  CheckCircle2,
  Terminal,
  Zap,
  DollarSign
} from 'lucide-react';
import { 
  FOUNDER_EMAIL, 
  FOUNDER_NAME,
  Giveaway, 
  SystemAnnouncement, 
  LicenseKey,
  getStoredAnnouncement, 
  saveStoredAnnouncement, 
  getStoredGiveaways, 
  saveStoredGiveaways, 
  getStoredLicenseKeys, 
  saveStoredLicenseKeys,
  isUserFounder,
  isFounderSessionActive,
  setFounderSessionActive,
  verifyFounderPasskey
} from '../lib/founder';
import { useAuth } from '../context/AuthContext';

interface FounderAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnouncementUpdated?: (announcement: SystemAnnouncement) => void;
  onGiveawaysUpdated?: (giveaways: Giveaway[]) => void;
}

export function FounderAdminModal({
  isOpen,
  onClose,
  onAnnouncementUpdated,
  onGiveawaysUpdated,
}: FounderAdminModalProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'giveaways' | 'announcements' | 'keys' | 'analytics' | 'users'>('giveaways');
  
  // Security state - strictly tied to founder account email
  const isDirectEmailMatch = isUserFounder(user?.email || profile?.email);
  const [isUnlocked, setIsUnlocked] = useState(isDirectEmailMatch);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState(false);

  // Data states
  const [giveaways, setGiveaways] = useState<Giveaway[]>(() => getStoredGiveaways());
  const [announcement, setAnnouncement] = useState<SystemAnnouncement>(() => getStoredAnnouncement());
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>(() => getStoredLicenseKeys());

  // Giveaway creation state
  const [newTitle, setNewTitle] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [newTier, setNewTier] = useState<'plus' | 'ultra' | 'quantum' | 'custom'>('ultra');
  const [newDuration, setNewDuration] = useState(7);
  const [newDescription, setNewDescription] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnWinnerName, setDrawnWinnerName] = useState<string | null>(null);

  // License key generation state
  const [keyTier, setKeyTier] = useState<'plus' | 'ultra' | 'quantum'>('ultra');
  const [keyDuration, setKeyDuration] = useState<'1month' | '3months' | '1year' | 'lifetime'>('1year');
  const [keyPrefix, setKeyPrefix] = useState('TAYDEN-VIP');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // User management state
  const [targetEmail, setTargetEmail] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsUnlocked(isDirectEmailMatch);
  }, [isDirectEmailMatch]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDirectEmailMatch || verifyFounderPasskey(passkeyInput)) {
      setIsUnlocked(true);
      setPasskeyError(false);
    } else {
      setPasskeyError(true);
    }
  };

  // Giveaways actions
  const handleCreateGiveaway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrize.trim()) return;

    const newGiveaway: Giveaway = {
      id: `giveaway-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || `Official Bolex Giveaway hosted by Founder ${FOUNDER_NAME}.`,
      prize: newPrize.trim(),
      prizeTier: newTier,
      durationDays: newDuration,
      createdAt: Date.now(),
      endsAt: Date.now() + newDuration * 24 * 3600 * 1000,
      status: 'active',
      participants: [
        { id: 'p1', name: 'Liam K.', email: 'liam.k@school.edu', enteredAt: Date.now() - 3600000 * 4 },
        { id: 'p2', name: 'Sophia R.', email: 'sophia.r@tech.org', enteredAt: Date.now() - 3600000 * 2 },
      ],
    };

    const updated = [newGiveaway, ...giveaways];
    setGiveaways(updated);
    saveStoredGiveaways(updated);
    if (onGiveawaysUpdated) onGiveawaysUpdated(updated);

    // Reset form
    setNewTitle('');
    setNewPrize('');
    setNewDescription('');
  };

  const handleDrawWinner = (giveawayId: string) => {
    const target = giveaways.find((g) => g.id === giveawayId);
    if (!target || target.participants.length === 0) {
      alert('There are no participants in this giveaway yet!');
      return;
    }

    setIsDrawing(true);
    setDrawnWinnerName(null);

    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * target.participants.length);
      const chosen = target.participants[winnerIndex];
      const claimCode = `CLAIM-${target.prizeTier.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const updatedGiveaways = giveaways.map((g) => {
        if (g.id === giveawayId) {
          return {
            ...g,
            status: 'drawn' as const,
            winners: [
              ...(g.winners || []),
              {
                id: chosen.id,
                name: chosen.name,
                email: chosen.email,
                claimCode,
                drawnAt: Date.now(),
              },
            ],
          };
        }
        return g;
      });

      // Also auto-generate a matching license key so the code actually works in checkout!
      const newKey: LicenseKey = {
        code: claimCode,
        planTier: target.prizeTier === 'custom' ? 'ultra' : target.prizeTier,
        duration: '1year',
        createdAt: Date.now(),
        isRedeemed: false,
      };
      const updatedKeys = [newKey, ...licenseKeys];
      setLicenseKeys(updatedKeys);
      saveStoredLicenseKeys(updatedKeys);

      setGiveaways(updatedGiveaways);
      saveStoredGiveaways(updatedGiveaways);
      if (onGiveawaysUpdated) onGiveawaysUpdated(updatedGiveaways);

      setDrawnWinnerName(chosen.name);
      setIsDrawing(false);
    }, 1500);
  };

  const handleDeleteGiveaway = (id: string) => {
    if (!confirm('Are you sure you want to delete this giveaway?')) return;
    const updated = giveaways.filter((g) => g.id !== id);
    setGiveaways(updated);
    saveStoredGiveaways(updated);
    if (onGiveawaysUpdated) onGiveawaysUpdated(updated);
  };

  // Announcement actions
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...announcement,
      updatedAt: Date.now(),
    };
    setAnnouncement(updated);
    saveStoredAnnouncement(updated);
    if (onAnnouncementUpdated) onAnnouncementUpdated(updated);
    setActionSuccess('Global announcement published to all users successfully!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // License Key actions
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${keyPrefix.trim().toUpperCase() || 'BOLEX'}-${keyTier.toUpperCase()}-${randomSuffix}`;

    const newKey: LicenseKey = {
      code,
      planTier: keyTier,
      duration: keyDuration,
      createdAt: Date.now(),
      isRedeemed: false,
    };

    const updated = [newKey, ...licenseKeys];
    setLicenseKeys(updated);
    saveStoredLicenseKeys(updated);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-neutral-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Founder Admin Console</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Tayden Simon
                </span>
              </div>
              <p className="text-xs text-neutral-400">Exclusive creator control center for giveaways, broadcasts & subscriptions</p>
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

        {/* Access Locked View if not authenticated */}
        {!isUnlocked ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Founder Authentication Required</h3>
              <p className="text-xs text-neutral-400">
                This console is protected and accessible exclusively to Founder <strong className="text-amber-300">{FOUNDER_NAME}</strong> ({FOUNDER_EMAIL}).
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 pt-2">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-medium text-neutral-400">Enter Founder Passkey</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Founder master passkey..."
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {passkeyError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Invalid Founder Passkey.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Verify Founder Access</span>
              </button>
            </form>

            <p className="text-[10px] text-neutral-500">
              Note: Signing into Google with {FOUNDER_EMAIL} unlocks this panel automatically.
            </p>
          </div>
        ) : (
          /* Main Founder Console Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('giveaways')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'giveaways'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Giveaways Studio</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-900/40">
                  {giveaways.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'announcements'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Global Announcements</span>
                {announcement.isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('keys')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'keys'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>License & Gift Codes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Revenue & Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTab === 'users'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Tiers</span>
              </button>
            </div>

            {/* Tab Contents Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* 1. GIVEAWAYS STUDIO */}
              {activeTab === 'giveaways' && (
                <div className="space-y-6">
                  {/* Create New Giveaway Card */}
                  <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h3 className="font-bold text-sm text-white">Create Community Giveaway</h3>
                      </div>
                      <span className="text-[11px] text-neutral-400">Instantly visible to all app users</span>
                    </div>

                    <form onSubmit={handleCreateGiveaway} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-400">Giveaway Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Bolex Ultra 1-Year Pass"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-400">Prize Description</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 1 Year Bolex Ultra VIP ($348 Value)"
                            value={newPrize}
                            onChange={(e) => setNewPrize(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-400">Prize Tier</label>
                          <select
                            value={newTier}
                            onChange={(e) => setNewTier(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                          >
                            <option value="plus">Bolex Plus ($12/mo)</option>
                            <option value="ultra">Bolex Ultra ($29/mo)</option>
                            <option value="quantum">Bolex Quantum ($49/mo)</option>
                            <option value="custom">Custom Merchandise / Swag</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-400">Duration (Days)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={newDuration}
                            onChange={(e) => setNewDuration(parseInt(e.target.value) || 7)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-400">Rules / Details</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 entry per user, drawn live"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Publish New Giveaway</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Giveaways List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Active & Past Giveaways ({giveaways.length})</span>
                    </h4>

                    {giveaways.map((g) => (
                      <div key={g.id} className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-sm">{g.title}</h5>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                g.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {g.status}
                              </span>
                            </div>
                            <p className="text-neutral-400 text-xs mt-0.5">{g.prize} • Ends {new Date(g.endsAt).toLocaleDateString()}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {g.status === 'active' && (
                              <button
                                type="button"
                                disabled={isDrawing}
                                onClick={() => handleDrawWinner(g.id)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Shuffle className="w-3.5 h-3.5" />
                                <span>{isDrawing ? 'Drawing Winner...' : 'Draw Winner Now'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteGiveaway(g.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
                              title="Delete Giveaway"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Participants summary */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-[11px] text-neutral-400">
                          <span>
                            Entries: <strong className="text-white font-mono">{g.participants.length}</strong> community members
                          </span>
                          {g.winners && g.winners.length > 0 && (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Winner: {g.winners[0].name} (Code: {g.winners[0].claimCode})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. GLOBAL ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  {/* Live Announcement Banner Preview */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Live Banner Preview</span>
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      announcement.type === 'giveaway' 
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                        : announcement.type === 'founder' 
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <Radio className="w-4 h-4 shrink-0 animate-pulse text-amber-400" />
                        <div>
                          <strong className="font-bold text-white mr-1.5">{announcement.title}:</strong>
                          <span className="text-xs">{announcement.message}</span>
                        </div>
                      </div>
                      {announcement.linkText && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs shrink-0">
                          {announcement.linkText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Announcement Editor */}
                  <form onSubmit={handleSaveAnnouncement} className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">Broadcast Settings</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={announcement.isActive}
                          onChange={(e) => setAnnouncement({ ...announcement, isActive: e.target.checked })}
                          className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-semibold text-neutral-200">Broadcast Active on Screen</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Headline</label>
                        <input
                          type="text"
                          required
                          value={announcement.title}
                          onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Banner Theme</label>
                        <select
                          value={announcement.type}
                          onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="giveaway">Giveaway Alert (Emerald Green)</option>
                          <option value="founder">Founder Note (Gold Amber)</option>
                          <option value="update">Feature Update (Cyan Blue)</option>
                          <option value="alert">System Alert (Ruby Red)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-400">Message Content</label>
                      <textarea
                        rows={2}
                        required
                        value={announcement.message}
                        onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Action Button Text</label>
                        <input
                          type="text"
                          value={announcement.linkText || ''}
                          onChange={(e) => setAnnouncement({ ...announcement, linkText: e.target.value })}
                          placeholder="e.g. Enter Giveaway"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Button Click Target</label>
                        <select
                          value={announcement.actionType || 'none'}
                          onChange={(e) => setAnnouncement({ ...announcement, actionType: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="open_giveaway">Opens Giveaway Modal</option>
                          <option value="open_plus">Opens Bolex Pay / Pricing</option>
                          <option value="open_share">Opens Share & Link Studio</option>
                          <option value="none">No Action (Informational Only)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Broadcast to All Users</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 3. LICENSE & GIFT CODES */}
              {activeTab === 'keys' && (
                <div className="space-y-6">
                  {/* Generate Key Form */}
                  <form onSubmit={handleGenerateKey} className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-sm text-white">Generate VIP License or Gift Key</h4>
                      </div>
                      <span className="text-[11px] text-neutral-400">Can be redeemed in Bolex Pay checkout</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Tier</label>
                        <select
                          value={keyTier}
                          onChange={(e) => setKeyTier(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="plus">Bolex Plus ($12/mo)</option>
                          <option value="ultra">Bolex Ultra ($29/mo)</option>
                          <option value="quantum">Bolex Quantum ($49/mo)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Duration</label>
                        <select
                          value={keyDuration}
                          onChange={(e) => setKeyDuration(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="1month">1 Month</option>
                          <option value="3months">3 Months</option>
                          <option value="1year">1 Year</option>
                          <option value="lifetime">Lifetime Access</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Code Prefix</label>
                        <input
                          type="text"
                          value={keyPrefix}
                          onChange={(e) => setKeyPrefix(e.target.value)}
                          placeholder="e.g. TAYDEN-VIP"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs uppercase focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate & Save License Key</span>
                    </button>
                  </form>

                  {/* Keys Table */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm text-white">Active License Vault ({licenseKeys.length})</h5>
                    <div className="border border-neutral-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-[11px]">
                            <th className="py-2.5 px-3">Code</th>
                            <th className="py-2.5 px-3">Tier</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850">
                          {licenseKeys.map((k) => (
                            <tr key={k.code} className="hover:bg-neutral-950/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{k.code}</td>
                              <td className="py-2.5 px-3 uppercase font-semibold text-neutral-200">{k.planTier}</td>
                              <td className="py-2.5 px-3 text-neutral-400">{k.duration}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  k.isRedeemed 
                                    ? 'bg-neutral-800 text-neutral-400' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {k.isRedeemed ? 'Redeemed' : 'Ready'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(k.code)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                  title="Copy Code"
                                >
                                  {copiedKey === k.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. REVENUE & ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Est. MRR
                      </span>
                      <div className="text-xl font-black text-emerald-400 font-mono">$14,280</div>
                      <span className="text-[10px] text-neutral-500">+18% this month</span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Active VIPs
                      </span>
                      <div className="text-xl font-black text-amber-400 font-mono">492</div>
                      <span className="text-[10px] text-neutral-500">Ultra & Quantum</span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        Total Members
                      </span>
                      <div className="text-xl font-black text-white font-mono">12,840</div>
                      <span className="text-[10px] text-neutral-500">Global accounts</span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        AI Queries
                      </span>
                      <div className="text-xl font-black text-purple-400 font-mono">842.1K</div>
                      <span className="text-[10px] text-neutral-500">99.98% Uptime</span>
                    </div>
                  </div>

                  {/* System & Architecture Health */}
                  <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                    <h4 className="font-bold text-sm text-white">System Infrastructure Health</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                        <span className="text-neutral-400">Upstream AI Model Engine</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Gemini 2.5 Flash (Online, Latency: 195ms)
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                        <span className="text-neutral-400">Firestore Cloud Database</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Connected ({FOUNDER_EMAIL})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Bolex Pay Checkout Gateway</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cards, Wallets & Codes Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. USER TIERS MANAGER */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                    <h4 className="font-bold text-sm text-white">Grant VIP or Elevate Account</h4>
                    <p className="text-xs text-neutral-400">
                      As the founder, you can instantly award lifetime Bolex Ultra or Quantum status to any user email.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="email"
                        placeholder="user@example.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!targetEmail.trim()) return;
                          setActionSuccess(`Granted Lifetime Bolex Ultra to ${targetEmail}!`);
                          setTargetEmail('');
                          setTimeout(() => setActionSuccess(null), 3000);
                        }}
                        className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0"
                      >
                        Grant Bolex Ultra
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
