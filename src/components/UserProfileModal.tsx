import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Check, 
  Loader2, 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  Sparkles,
  Edit3,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBolexPlus?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenBolexPlus }: UserProfileModalProps) {
  const { user, profile, logout, updateProfileInfo } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setBio('');
    }
  }, [profile, user]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfileInfo({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formattedCreated = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) 
    : 'Recently';

  const formattedUpdated = profile?.updatedAt 
    ? new Date(profile.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold text-lg shadow-sm shadow-amber-500/20">
              {profile?.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt={displayName} 
                  className="w-full h-full rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                (displayName || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>{profile?.displayName || user.displayName || 'User Profile'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Authenticated
                </span>
              </h2>
              <p className="text-xs text-neutral-400 font-mono truncate max-w-[240px] sm:max-w-xs">
                {user.email}
              </p>
            </div>
          </div>
          <button
            id="profile-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Bolex Plus Membership Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-950 to-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Membership Plan</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    profile?.isBolexPlus 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {profile?.isBolexPlus ? 'Bolex Plus' : 'Free Tier'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {profile?.isBolexPlus 
                    ? 'Continuous voice dictation, priority turbo reasoning, & gold badge active.'
                    : 'Upgrade to Bolex Plus for unlimited voice dictation and turbo responses.'}
                </p>
              </div>
            </div>

            {onOpenBolexPlus && (
              <button
                id="profile-manage-plus-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBolexPlus();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors shrink-0"
              >
                {profile?.isBolexPlus ? 'View Perks' : 'Upgrade'}
              </button>
            )}
          </div>

          {/* Security & Firestore Storage Badge */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-semibold text-neutral-200">Secure Firestore Persistence</div>
              <div className="text-neutral-400 leading-relaxed text-[11px]">
                Your account details and preferences are stored securely in Google Cloud Firestore with Attribute-Based Access Control (ABAC). Only you can read or write your record.
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>Display Name</span>
                <span className="text-[10px] text-neutral-400 font-normal">Max 100 chars</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="profile-name-input"
                  type="text"
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How Bolex AI should address you"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Personalization & Bio</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">Max 500 chars</span>
              </label>
              <textarea
                id="profile-bio-input"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell Bolex about your role, favorite languages, or how you like responses formatted..."
                className="w-full p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500/80 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <div>
                  <span className="text-neutral-400 block text-[10px]">Account Created</span>
                  <span className="text-neutral-300 font-medium">{formattedCreated}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/80">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <div>
                  <span className="text-neutral-400 block text-[10px]">Last Synced</span>
                  <span className="text-neutral-300 font-medium">{formattedUpdated || 'Active'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                id="profile-logout-btn"
                type="button"
                onClick={handleLogout}
                className="py-2 px-3 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>

              <button
                id="profile-save-btn"
                type="submit"
                disabled={isSaving}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-neutral-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
