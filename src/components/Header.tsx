import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Settings2, 
  Plus, 
  PanelLeft,
  PanelLeftClose,
  Globe, 
  BrainCircuit,
  Headphones,
  Sun,
  Moon,
  Keyboard,
  Share2,
  ChevronDown,
  Check,
  Zap,
  Layers,
  Compass,
  Users,
  Anchor,
  SquarePen,
  Lock,
  Crown,
  BookOpen,
  Cpu
} from 'lucide-react';
import { PersonaRole } from '../types';
import { AI_MODELS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { speechManager } from '../lib/speechManager';

interface HeaderProps {
  currentRole: PersonaRole;
  isSidebarOpen?: boolean;
  onOpenRoles: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenBolexPlus?: () => void;
  onOpenMap: () => void;
  onOpenPeopleSearch: () => void;
  onOpenAnchors?: () => void;
  activeAnchorsCount?: number;
  enableCognitiveTrace?: boolean;
  onToggleCognitiveTrace?: () => void;
  enableQuantumReasoning?: boolean;
  onToggleQuantumReasoning?: () => void;
  onOpenShortcuts?: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  onExportChat: () => void;
  onClearChat: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFounder?: () => void;
  isFounder?: boolean;
  onOpenShare?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenColab?: () => void;
  onOpenGiveaways?: () => void;
  activeGiveawaysCount?: number;
  hasMessages: boolean;
  isBackendConnected: boolean;
  sessionTokens?: number;
  selectedModelVersion?: string;
  onSelectModelVersion?: (modelId: string) => void;
}

export function Header({
  currentRole,
  isSidebarOpen = true,
  onOpenRoles,
  onOpenSettings,
  onOpenExtension,
  onOpenBolexPlus,
  onOpenMap,
  onOpenPeopleSearch,
  onOpenAnchors,
  enableCognitiveTrace = true,
  onToggleCognitiveTrace,
  enableQuantumReasoning = false,
  onToggleQuantumReasoning,
  onOpenShortcuts,
  onNewChat,
  onToggleSidebar,
  enableSearch,
  onToggleSearch,
  onOpenAuth,
  onOpenProfile,
  onOpenFounder,
  isFounder = false,
  onOpenShare,
  onOpenKnowledgeBase,
  onOpenColab,
  isBackendConnected,
  selectedModelVersion = 'bolex-3.8',
  onSelectModelVersion,
}: HeaderProps) {
  const { user, profile, effectiveTier, isTrialActive } = useAuth();
  const isFreeTier = effectiveTier === 'free' && !isTrialActive;
  const { resolvedTheme, toggleTheme } = useTheme();
  const [speechState, setSpeechState] = useState(() => speechManager.getState());
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentModel = AI_MODELS.find((m) => m.id === selectedModelVersion) || AI_MODELS[0];

  useEffect(() => {
    return speechManager.subscribe((st) => setSpeechState(st));
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAutoNarrate = () => {
    speechManager.setAutoNarrate(!speechState.autoNarrate);
  };

  return (
    <header className="h-14 border-b border-neutral-800/60 bg-neutral-900/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Left Zone: Sidebar Toggle & Bolex Model Selector */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          id="sidebar-toggle-btn"
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
          title={isSidebarOpen ? "Close sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-neutral-300 hover:text-amber-400" />
          ) : (
            <PanelLeft className="w-5 h-5 text-amber-400" />
          )}
        </button>

        <button
          id="header-new-chat-icon-btn"
          type="button"
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
          title="New chat (Ctrl+K)"
        >
          <SquarePen className="w-5 h-5" />
        </button>

        {/* Bolex Neural Model Dropdown Button */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            id="bolex-model-selector-btn"
            type="button"
            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-800/90 text-neutral-100 transition-all font-semibold text-sm cursor-pointer border border-transparent hover:border-neutral-700/60 group"
          >
            <div className="flex items-center gap-1.5">
              <span>{currentModel.name}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${currentModel.tagColor}`}>
                {currentModel.versionNumber}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Model Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-84 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 shadow-2xl p-2 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-neutral-400 border-b border-neutral-800 pb-1.5 mb-1">
                <span>Bolex Neural Architectures</span>
                <span className="text-[10px] text-amber-400/90 font-mono">Bolex Core Engine</span>
              </div>

              {/* Version Options List */}
              <div className="space-y-1">
                {AI_MODELS.map((model) => {
                  const isLocked = Boolean(model.isLockedForFree && isFreeTier);
                  const isSelected = (selectedModelVersion === model.id) || (!selectedModelVersion && model.id === 'bolex-3.8');

                  return (
                    <div
                      key={model.id}
                      onClick={() => {
                        if (isLocked) {
                          onOpenBolexPlus?.();
                          setIsModelDropdownOpen(false);
                          return;
                        }
                        onSelectModelVersion?.(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 relative ${
                        isSelected
                          ? 'bg-neutral-800/90 border-neutral-600 shadow-xs'
                          : isLocked
                          ? 'border-transparent hover:bg-amber-950/20 hover:border-amber-500/30 opacity-90'
                          : 'border-transparent hover:bg-neutral-800/50 hover:border-neutral-700/50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span>{model.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${model.tagColor}`}>
                            {model.versionNumber}
                          </span>
                          {isLocked ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{model.requiredTier === 'ultra' ? 'ULTRA' : 'PLUS'}</span>
                            </span>
                          ) : model.tag ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                              {model.tag}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">
                          {model.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 pt-0.5">
                          <span>⚡ Speed: <strong className="text-neutral-300">{model.speed}</strong></span>
                          <span>🧠 IQ: <strong className="text-neutral-300">{model.intelligence}</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 mt-0.5 flex items-center">
                        {isLocked ? (
                          <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[10px] flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Upgrade</span>
                          </div>
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Mode Toggles */}
              <div className="pt-1 border-t border-neutral-800 space-y-1">
                {/* Cognitive Reasoning Mode */}
                <div 
                  onClick={() => {
                    onToggleCognitiveTrace?.();
                    setIsModelDropdownOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-800/60 flex items-start justify-between cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                      <span>Cognitive Trace Monologue</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">Step-by-step reasoning &amp; design trade-offs</p>
                  </div>
                  {enableCognitiveTrace && <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />}
                </div>

                {/* Web Search Grounding */}
                <div 
                  onClick={() => {
                    onToggleSearch();
                    setIsModelDropdownOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-800/60 flex items-start justify-between cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>Web Search Grounding</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">Live internet data with source citations</p>
                  </div>
                  {enableSearch && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                </div>

                {/* Personas / System Roles */}
                <div 
                  onClick={() => {
                    onOpenRoles();
                    setIsModelDropdownOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-800/60 flex items-center justify-between cursor-pointer transition-colors border-t border-neutral-800/80"
                >
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Persona: <strong className="text-white">{currentRole.name}</strong></span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-medium">Switch</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Zone: Quick Tools, Share & User Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Voice Narration Toggle */}
        <button
          id="header-auto-narrate-btn"
          type="button"
          onClick={toggleAutoNarrate}
          className={`p-2 rounded-full text-xs transition-colors ${
            speechState.autoNarrate
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title={speechState.autoNarrate ? 'Voice narration is ON' : 'Turn on voice narration'}
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Share Button */}
        {onOpenShare && (
          <button
            id="header-share-btn"
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/60 transition-colors cursor-pointer"
            title="Share chat"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        {/* Knowledge Base & NLU Button */}
        {onOpenKnowledgeBase && (
          <button
            id="header-kb-btn"
            type="button"
            onClick={onOpenKnowledgeBase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/60 transition-colors cursor-pointer"
            title="Open Knowledge Base & NLU Studio"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Knowledge &amp; NLU</span>
          </button>
        )}

        {/* Google Colab Cloud Studio Button */}
        {onOpenColab && (
          <button
            id="header-colab-btn"
            type="button"
            onClick={onOpenColab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/60 transition-colors cursor-pointer"
            title="Google Colab Cloud Accelerator (GPU/TPU & Jupyter)"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Colab Studio</span>
          </button>
        )}

        {/* Profile / Account Avatar */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-amber-400 transition-colors cursor-pointer overflow-hidden ml-1"
            title="User Profile & Settings"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{(user?.displayName || profile?.displayName || 'B')[0].toUpperCase()}</span>
            )}
          </button>

          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="font-semibold text-white truncate">{user?.displayName || profile?.displayName || 'Bolex User'}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user?.email || profile?.email || 'Guest Session'}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenProfile();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
              >
                <span>My Profile &amp; Plan</span>
              </button>

              {onOpenColab && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenColab();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Colab Accelerator</span>
                </button>
              )}

              {onOpenKnowledgeBase && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenKnowledgeBase();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Knowledge &amp; NLU Studio</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
              >
                <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenExtension();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
              >
                <span>Browser Extension</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {resolvedTheme === 'dark' ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Theme</span>
                </span>
                <span className="text-[11px] text-neutral-400 capitalize">{resolvedTheme}</span>
              </button>

              {onOpenShortcuts && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Keyboard Shortcuts</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
