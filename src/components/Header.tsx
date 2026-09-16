import { 
  Sparkles, 
  Settings2, 
  Plus, 
  Menu, 
  Globe, 
  Download, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PersonaRole } from '../types';

interface HeaderProps {
  currentRole: PersonaRole;
  onOpenRoles: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  onExportChat: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  isBackendConnected: boolean;
}

export function Header({
  currentRole,
  onOpenRoles,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  enableSearch,
  onToggleSearch,
  onExportChat,
  onClearChat,
  hasMessages,
  isBackendConnected,
}: HeaderProps) {
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold shadow-sm shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-white tracking-tight">
                Smart AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                Gemini 3.8 Flash
              </span>
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
                  {isBackendConnected ? 'Free Tier Ready' : 'Connecting'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Role Selector Trigger */}
        <button
          id="role-selector-btn"
          type="button"
          onClick={onOpenRoles}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 hover:border-neutral-600 transition-all"
          title="Change assistant persona"
        >
          <span className="text-amber-400 font-semibold">Role:</span>
          <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentRole.name}</span>
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

        {/* Settings Button */}
        <button
          id="settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Intelligence settings & API key info"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
