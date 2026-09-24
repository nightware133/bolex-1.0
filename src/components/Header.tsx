import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Settings2, 
  Plus, 
  Menu, 
  Globe, 
  Download, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Chrome,
  LogIn,
  Crown,
  Volume2,
  VolumeX,
  Headphones,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  Keyboard
} from 'lucide-react';
import { PersonaRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { speechManager } from '../lib/speechManager';
import { TokenIndicator } from './TokenIndicator';
import { Flame, Compass, Users } from 'lucide-react';

interface HeaderProps {
  currentRole: PersonaRole;
  onOpenRoles: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenBolexPlus?: () => void;
  onOpenMap: () => void;
  onOpenPeopleSearch: () => void;
  onOpenShortcuts?: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  onExportChat: () => void;
  onClearChat: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  hasMessages: boolean;
  isBackendConnected: boolean;
  sessionTokens?: number;
}

export function Header({
  currentRole,
  onOpenRoles,
  onOpenSettings,
  onOpenExtension,
  onOpenBolexPlus,
  onOpenMap,
  onOpenPeopleSearch,
  onOpenShortcuts,
  onNewChat,
  onToggleSidebar,
  enableSearch,
  onToggleSearch,
  onExportChat,
  onClearChat,
  onOpenAuth,
  onOpenProfile,
  hasMessages,
  isBackendConnected,
  sessionTokens = 0,
}: HeaderProps) {
  const { user, profile, effectiveTier, isTrialActive, trialRemainingText } = useAuth();
  const { themeMode, resolvedTheme, toggleTheme } = useTheme();
  const [speechState, setSpeechState] = useState(() => speechManager.getState());

  useEffect(() => {
    return speechManager.subscribe((st) => setSpeechState(st));
  }, []);

  const toggleAutoNarrate = () => {
    speechManager.setAutoNarrate(!speechState.autoNarrate);
  };

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="sidebar-toggle-btn"
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors md:hidden"
          title="Toggle history sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-purple-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold shadow-sm shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-white tracking-tight">
                Bolex AI
              </span>
              {effectiveTier === 'ultra' ? (
                <button
                  id="header-ultra-badge"
                  type="button"
                  onClick={onOpenBolexPlus}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-colors shadow-xs"
                  title="Bolex Ultra VIP Active"
                >
                  <Flame className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                  <span>ULTRA</span>
                </button>
              ) : effectiveTier === 'plus' ? (
                <button
                  id="header-plus-badge"
                  type="button"
                  onClick={onOpenBolexPlus}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors shadow-xs"
                  title="Bolex Plus Active — click to view member perks"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>PLUS</span>
                </button>
              ) : (
                <button
                  id="header-free-badge"
                  type="button"
                  onClick={onOpenBolexPlus}
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60 hover:text-amber-300 transition-colors"
                  title="Free Plan (60 questions/chat) — Click to start 3-Day Free Trial"
                >
                  <span>Free (60 questions)</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                {isBackendConnected ? (
                  <span title="Active engine">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                ) : (
                  <span title="Checking status">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                  </span>
                )}
                <span className="hidden md:inline text-[11px] font-normal text-neutral-400">
                  {isBackendConnected ? 'Active' : 'Connecting'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Token Counter Indicator in Header */}
        <TokenIndicator
          tokens={sessionTokens}
          tier={effectiveTier}
          isTrialActive={isTrialActive}
          trialRemainingText={trialRemainingText}
          onOpenUpgradeModal={onOpenBolexPlus || (() => {})}
          variant="header"
        />

        {/* Role Selector Trigger */}
        <button
          id="role-selector-btn"
          type="button"
          onClick={onOpenRoles}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 hover:border-neutral-600 transition-all"
          title="Change assistant persona"
        >
          <span className="text-amber-400 font-semibold">Role:</span>
          <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentRole.name}</span>
        </button>

        {/* Web Search Grounding Toggle */}
        <button
          id="web-grounding-toggle-btn"
          type="button"
          onClick={onToggleSearch}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
            enableSearch
              ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25'
              : 'bg-neutral-800/60 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title={enableSearch ? 'Google Web Grounding enabled' : 'Click to enable Google Web Grounding'}
        >
          <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-blue-400' : 'text-neutral-500'}`} />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Auto-Speech Narration Toggle */}
        <button
          id="header-auto-narrate-btn"
          type="button"
          onClick={toggleAutoNarrate}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors border hidden sm:flex items-center gap-1 ${
            speechState.autoNarrate
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
              : 'bg-neutral-800/60 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title={
            speechState.autoNarrate
              ? 'Auto-Speech is ON: Bolex automatically reads new answers aloud'
              : 'Auto-Speech is OFF: Click to enable hands-free read-aloud'
          }
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">
            {speechState.autoNarrate ? 'Audio ON' : 'Audio OFF'}
          </span>
        </button>

        {/* New Chat Button */}
        <button
          id="header-new-chat-btn"
          type="button"
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="New conversation"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Export Chat */}
        {hasMessages && (
          <button
            id="export-chat-btn"
            type="button"
            onClick={onExportChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden sm:block"
            title="Export conversation as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Clear Chat */}
        {hasMessages && (
          <button
            id="clear-chat-btn"
            type="button"
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors hidden sm:block"
            title="Clear current messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Extension Modal Trigger */}
        <button
          id="header-extension-btn"
          type="button"
          onClick={onOpenExtension}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 hover:border-neutral-600 transition-all"
          title="Browser Extension (Chrome / Edge)"
        >
          <Chrome className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Extension</span>
        </button>

        {/* Bolex Map Studio Trigger */}
        <button
          id="header-map-studio-btn"
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
          title="Open Bolex Map Studio (Mind Map & Geographic Explorer)"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Map</span>
        </button>

        {/* Search People / Bolex Accounts Trigger */}
        <button
          id="header-search-people-btn"
          type="button"
          onClick={onOpenPeopleSearch}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
          title="Search People (Bolex Accounts • Strictly No Bots)"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">People</span>
        </button>

        {/* Bolex Membership & Tiers Trigger */}
        {onOpenBolexPlus && (
          <button
            id="header-bolex-plus-btn"
            type="button"
            onClick={onOpenBolexPlus}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              effectiveTier === 'quantum'
                ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 ring-1 ring-cyan-500/30'
                : effectiveTier === 'ultra'
                ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40'
                : effectiveTier === 'plus'
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700/50'
            }`}
            title="Explore Bolex Membership Tiers & 3-Day Free Trials"
          >
            {effectiveTier === 'quantum' ? (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : effectiveTier === 'ultra' ? (
              <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden md:inline">
              {effectiveTier === 'quantum' ? 'Quantum VIP' : effectiveTier === 'ultra' ? 'Ultra VIP' : effectiveTier === 'plus' ? 'Plus Active' : '3-Day Trial'}
            </span>
          </button>
        )}

        {/* Keyboard Shortcuts '?' Helper Button */}
        {onOpenShortcuts && (
          <button
            id="header-shortcuts-btn"
            type="button"
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors flex items-center justify-center font-mono font-bold text-xs"
            title="Keyboard Shortcuts Cheat Sheet (Press ? or ⌘/)"
          >
            <span className="w-4 h-4 rounded-full border border-neutral-600 hover:border-amber-400/80 flex items-center justify-center text-[11px] leading-none">
              ?
            </span>
          </button>
        )}

        {/* Quick Theme Toggle Button */}
        <button
          id="header-theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title={`Theme: ${resolvedTheme === 'dark' ? 'Dark Theme' : 'Light Theme'} (${themeMode === 'system' ? 'Auto OS Match' : 'Manual'}). Click to switch.`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-purple-400" />
          )}
        </button>

        {/* Settings Button */}
        <button
          id="settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Assistant settings, theme override & API info"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        {/* User Account / Auth Button */}
        {user ? (
          <button
            id="header-user-profile-btn"
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/60 hover:border-amber-500/50 transition-all text-xs font-medium"
            title={`Signed in as ${profile?.displayName || user.displayName || user.email || 'User'}`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold text-[11px] shrink-0">
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
            <span className="hidden sm:inline max-w-[80px] truncate text-neutral-200">
              {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Account'}
            </span>
          </button>
        ) : (
          <button
            id="header-login-btn"
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors shadow-xs"
            title="Sign in or create an account"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
