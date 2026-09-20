import React from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  KeyRound, 
  Sparkles, 
  X,
  Layers,
  Chrome,
  LogIn,
  ShieldCheck,
  Crown,
  User as UserIcon
} from 'lucide-react';
import { ChatSession } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenBolexPlus?: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenExtension,
  onOpenAuth,
  onOpenProfile,
  onOpenBolexPlus,
}: SidebarProps) {
  const { user, profile } = useAuth();
  const isPlus = Boolean(profile?.isBolexPlus || profile?.planTier === 'plus');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 sm:w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top bar with New Chat */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <button
            id="sidebar-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 md:hidden"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Conversations
            </span>
            <span>{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No conversations yet. Start a new topic!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white font-medium shadow-xs border border-neutral-700/60'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="truncate">{session.title || 'Untitled conversation'}</span>
                  </div>

                  {sessions.length > 1 && (
                    <button
                      id={`delete-session-${session.id}`}
                      type="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700/60 text-neutral-400 hover:text-rose-400 transition-opacity ml-1 shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Cards: Bolex Plus, Browser Extension & User Account */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/50 space-y-2">
          {/* Bolex Plus Perks Card */}
          {onOpenBolexPlus && (
            <button
              id="sidebar-bolex-plus-card-btn"
              type="button"
              onClick={() => {
                onOpenBolexPlus();
                onClose();
              }}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                isPlus
                  ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Bolex Plus</span>
                    {isPlus && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {isPlus ? 'Voice Pro & Priority Turbo' : 'Voice Dictation & Perks'}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 transition-colors ${
                isPlus 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
              }`}>
                {isPlus ? 'Perks' : 'Upgrade'}
              </span>
            </button>
          )}

          {/* User Account / Auth Section */}
          {user ? (
            <button
              id="sidebar-user-profile-btn"
              type="button"
              onClick={() => {
                onOpenProfile();
                onClose();
              }}
              className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold text-xs shrink-0 shadow-xs">
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt="avatar" 
                      className="w-full h-full rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (profile?.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                    {profile?.displayName || user.displayName || 'User Profile'}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 shrink-0">
                Active
              </span>
            </button>
          ) : (
            <button
              id="sidebar-login-btn"
              type="button"
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-neutral-700/60"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* Browser Extension Button */}
          <button
            id="sidebar-extension-btn"
            type="button"
            onClick={() => {
              onOpenExtension();
              onClose();
            }}
            className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                <Chrome className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Browser Extension
                </div>
                <div className="text-[10px] text-neutral-400">
                  Chrome, Edge & Brave (.ZIP)
                </div>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
              V3
            </span>
          </button>

          <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Bolex Engine Ready</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Bolex operates on high-speed neural intelligence with free-tier accessibility.
            </p>
            <button
              id="sidebar-api-key-info-btn"
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full mt-1 py-1 px-2 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>View Key Setup Guide</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
