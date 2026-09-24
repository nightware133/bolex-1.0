import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  User, 
  ShieldCheck, 
  Crown, 
  Flame, 
  Sparkles, 
  Calendar, 
  Copy, 
  Check, 
  LogIn, 
  Users, 
  ExternalLink,
  MessageSquarePlus,
  RefreshCw,
  Info
} from 'lucide-react';
import { PublicUserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { searchPublicProfiles, syncPublicProfile } from '../lib/firebase';

interface PeopleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onSelectPersonForChat?: (person: PublicUserProfile) => void;
}

export function PeopleSearchModal({
  isOpen,
  onClose,
  onOpenAuth,
  onSelectPersonForChat,
}: PeopleSearchModalProps) {
  const { user, profile, isLocalUser, effectiveTier } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'quantum' | 'ultra' | 'plus' | 'free'>('all');
  const [people, setPeople] = useState<PublicUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PublicUserProfile | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load public profiles whenever the modal opens
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedPerson(null);
      return;
    }

    let isMounted = true;
    const fetchPeople = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // If current user is logged in, ensure their public profile is synced first
        if (user && profile) {
          await syncPublicProfile(user.uid, {
            displayName: profile.displayName || user.displayName || 'Bolex User',
            photoURL: profile.photoURL || user.photoURL || undefined,
            bio: profile.bio,
            planTier: (profile.planTier || effectiveTier || 'free') as 'free' | 'plus' | 'ultra' | 'quantum',
            createdAt: profile.createdAt,
          }).catch(() => {});
        }

        const results = await searchPublicProfiles('');
        if (isMounted) {
          // If current user profile is present but not yet indexed in results, include it
          if (profile && !results.some((p) => p.uid === profile.uid)) {
            const selfPublic: PublicUserProfile = {
              uid: profile.uid,
              displayName: profile.displayName || user?.displayName || 'You',
              photoURL: profile.photoURL || user?.photoURL || undefined,
              bio: profile.bio || 'Bolex user exploring intelligent workflows.',
              planTier: (profile.planTier || effectiveTier || 'free') as 'free' | 'plus' | 'ultra' | 'quantum',
              createdAt: profile.createdAt || new Date().toISOString(),
              updatedAt: profile.updatedAt || new Date().toISOString(),
            };
            setPeople([selfPublic, ...results]);
          } else {
            setPeople(results);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          // If error is permission or offline, provide graceful fallback for current session
          console.warn('Could not load public accounts:', message);
          if (profile) {
            setPeople([
              {
                uid: profile.uid,
                displayName: profile.displayName || user?.displayName || 'You',
                photoURL: profile.photoURL || user?.photoURL || undefined,
                bio: profile.bio || 'Bolex user exploring intelligent workflows.',
                planTier: (profile.planTier || effectiveTier || 'free') as 'free' | 'plus' | 'ultra' | 'quantum',
                createdAt: profile.createdAt || new Date().toISOString(),
                updatedAt: profile.updatedAt || new Date().toISOString(),
              },
            ]);
          } else {
            setLoadError('Unable to load directory. Please make sure you are signed in.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPeople();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, profile, effectiveTier]);

  // Filter people based on search query and tier filter
  const filteredPeople = useMemo(() => {
    let list = people;

    // Filter by tier
    if (selectedTierFilter !== 'all') {
      list = list.filter((p) => (p.planTier || 'free') === selectedTierFilter);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const matchName = p.displayName?.toLowerCase().includes(q);
      const matchBio = p.bio?.toLowerCase().includes(q);
      const matchUid = p.uid.toLowerCase().includes(q);
      return matchName || matchBio || matchUid;
    });
  }, [people, selectedTierFilter, searchQuery]);

  const handleCopyUid = (uid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const results = await searchPublicProfiles('');
      if (profile && !results.some((p) => p.uid === profile.uid)) {
        const selfPublic: PublicUserProfile = {
          uid: profile.uid,
          displayName: profile.displayName || user?.displayName || 'You',
          photoURL: profile.photoURL || user?.photoURL || undefined,
          bio: profile.bio || 'Bolex user exploring intelligent workflows.',
          planTier: (profile.planTier || effectiveTier || 'free') as 'free' | 'plus' | 'ultra' | 'quantum',
          createdAt: profile.createdAt || new Date().toISOString(),
          updatedAt: profile.updatedAt || new Date().toISOString(),
        };
        setPeople([selfPublic, ...results]);
      } else {
        setPeople(results);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const renderTierBadge = (tier?: string) => {
    switch (tier) {
      case 'quantum':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs shadow-cyan-500/10">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Quantum VIP</span>
          </span>
        );
      case 'ultra':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs shadow-purple-500/10">
            <Flame className="w-3 h-3 text-purple-400 fill-purple-400/20" />
            <span>Ultra VIP</span>
          </span>
        );
      case 'plus':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-500/10">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Plus</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700/60">
            <span>Free</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Search Bolex Accounts
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Real People Only
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Search and explore real community accounts in Bolex. Strictly zero bots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="people-refresh-btn"
              type="button"
              onClick={handleRefresh}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Refresh account list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              id="people-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar & Tier Filter Chips */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/40 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="people-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by display name or bio keywords..."
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs select-none">
            <span className="text-[11px] text-neutral-400 font-medium mr-1 shrink-0">Tier:</span>
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'quantum', label: 'Quantum VIP' },
              { id: 'ultra', label: 'Ultra VIP' },
              { id: 'plus', label: 'Plus' },
              { id: 'free', label: 'Free' },
            ].map((chip) => {
              const isActive = selectedTierFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedTierFilter(chip.id as typeof selectedTierFilter)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 text-xs ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-750 border border-neutral-700/60'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Strict Zero-Bot Transparency Banner */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-300 leading-relaxed">
              <span className="font-semibold text-white">Authentic Directory: </span>
              Accounts listed here represent real registered users in Bolex AI. Bot personas and automated AI agents are strictly excluded from this directory. Private emails remain confidential.
            </div>
          </div>

          {/* If user is not authenticated, show sign-in prompt */}
          {!user && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-200">
                <span className="font-bold block text-amber-300">Join the Bolex Directory</span>
                Sign in or create an account to list your public profile and connect with the community.
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && people.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs text-neutral-400">Loading Bolex accounts...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-500 mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-200">
                  {searchQuery ? `No accounts matching "${searchQuery}"` : 'No accounts found'}
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try searching by a different name or keyword.'
                    : 'Real user accounts will appear here as they register on Bolex.'}
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs transition-colors border border-neutral-700"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            /* Accounts List */
            <div className="grid grid-cols-1 gap-2.5">
              {filteredPeople.map((person) => {
                const isSelf = user?.uid === person.uid;
                const isSelected = selectedPerson?.uid === person.uid;

                return (
                  <div
                    key={person.uid}
                    onClick={() => setSelectedPerson(isSelected ? null : person)}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-neutral-800/90 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold text-sm shadow-sm shrink-0">
                          {person.photoURL ? (
                            <img
                              src={person.photoURL}
                              alt={person.displayName}
                              className="w-full h-full rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            person.displayName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Person Info */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-white group-hover:text-amber-200 transition-colors">
                              {person.displayName}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                You
                              </span>
                            )}
                            {renderTierBadge(person.planTier)}
                          </div>

                          {person.bio && (
                            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                              {person.bio}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              <span>Joined {formatJoinedDate(person.createdAt)}</span>
                            </span>
                            <span className="font-mono text-[10px] text-neutral-400">
                              UID: {person.uid.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyUid(person.uid, e)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors border border-neutral-700/60"
                          title="Copy Account UID"
                        >
                          {copiedUid === person.uid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {onSelectPersonForChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPersonForChat(person);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Discuss or collaborate in chat"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel when selected */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2.5 animate-in fade-in duration-100">
                        <div className="text-xs font-semibold text-neutral-200">
                          Account Profile Details
                        </div>
                        <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-850 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>Account Status:</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Active Human Member
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>Bolex Plan:</span>
                            <span className="text-white capitalize font-medium">
                              {person.planTier || 'Free'} Tier
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>Full Account ID:</span>
                            <span className="font-mono text-[11px] text-neutral-300">
                              {person.uid}
                            </span>
                          </div>
                        </div>

                        {onSelectPersonForChat && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPersonForChat(person);
                              onClose();
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
                            <span>Mention in Chat / Discuss Ideas</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{filteredPeople.length}</span>
            <span>real account{filteredPeople.length === 1 ? '' : 's'} found</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
