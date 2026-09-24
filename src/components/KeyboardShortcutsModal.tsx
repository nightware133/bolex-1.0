import React, { useState, useMemo } from 'react';
import { 
  X, 
  Command, 
  Search, 
  Keyboard, 
  Sparkles, 
  MessageSquare, 
  Globe, 
  Compass, 
  Sliders, 
  Mic, 
  Headphones, 
  Palette,
  Users,
  Chrome,
  Crown
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  category: 'chat' | 'tools' | 'audio' | 'general';
  title: string;
  description: string;
  keys: string[];
  icon?: React.ElementType;
}

const SHORTCUTS: ShortcutItem[] = [
  // Chat & Navigation
  {
    id: 'send-message',
    category: 'chat',
    title: 'Send Message',
    description: 'Submit your prompt or question to the AI model',
    keys: ['Enter'],
    icon: MessageSquare,
  },
  {
    id: 'newline',
    category: 'chat',
    title: 'New Line in Input',
    description: 'Insert a line break without sending the message',
    keys: ['Shift', 'Enter'],
    icon: MessageSquare,
  },
  {
    id: 'new-chat',
    category: 'chat',
    title: 'Start New Conversation',
    description: 'Create a fresh chat session and focus the input',
    keys: ['⌘/Ctrl', 'K'],
    icon: Sparkles,
  },
  {
    id: 'toggle-sidebar',
    category: 'chat',
    title: 'Toggle Sidebar',
    description: 'Show or hide the chat history and folder drawer',
    keys: ['⌘/Ctrl', 'B'],
    icon: MessageSquare,
  },
  {
    id: 'shortcuts-modal',
    category: 'chat',
    title: 'Keyboard Shortcuts Help',
    description: 'Show this keyboard productivity cheat sheet',
    keys: ['?'],
    icon: Keyboard,
  },
  {
    id: 'close-modal',
    category: 'chat',
    title: 'Close Modal / Cancel',
    description: 'Dismiss any open dialog or active microphone dictation',
    keys: ['Esc'],
    icon: X,
  },

  // Tools & Intelligence
  {
    id: 'open-map',
    category: 'tools',
    title: 'Open Map Studio',
    description: 'Launch the AI Concept Graph & Geographic Explorer',
    keys: ['⌘/Ctrl', 'M'],
    icon: Compass,
  },
  {
    id: 'toggle-search',
    category: 'tools',
    title: 'Toggle Web Search',
    description: 'Turn Google Web Search Grounding ON or OFF',
    keys: ['⌘/Ctrl', 'Shift', 'G'],
    icon: Globe,
  },
  {
    id: 'open-roles',
    category: 'tools',
    title: 'Change Persona Role',
    description: 'Switch between General, Coder, Scholar, Creative, etc.',
    keys: ['⌘/Ctrl', 'Shift', 'P'],
    icon: Sparkles,
  },
  {
    id: 'open-settings',
    category: 'tools',
    title: 'Open Settings & Analytics',
    description: 'Manage token metrics, temperature, and custom instructions',
    keys: ['⌘/Ctrl', 'Shift', 'S'],
    icon: Sliders,
  },
  {
    id: 'open-people',
    category: 'tools',
    title: 'Search People Directory',
    description: 'Explore community accounts and human profiles',
    keys: ['⌘/Ctrl', 'Shift', 'F'],
    icon: Users,
  },
  {
    id: 'open-extension',
    category: 'tools',
    title: 'Browser Extension Suite',
    description: 'Download the Chrome/Edge companion extension',
    keys: ['⌘/Ctrl', 'Shift', 'E'],
    icon: Chrome,
  },
  {
    id: 'open-plus',
    category: 'tools',
    title: 'Membership & 3-Day Trials',
    description: 'View Plus & Ultra VIP infinite token perks',
    keys: ['⌘/Ctrl', 'Shift', 'U'],
    icon: Crown,
  },

  // Audio & Voice
  {
    id: 'toggle-dictation',
    category: 'audio',
    title: 'Voice Microphone Dictation',
    description: 'Start or stop real-time Web Speech dictation',
    keys: ['⌘/Ctrl', 'Shift', 'V'],
    icon: Mic,
  },
  {
    id: 'toggle-narration',
    category: 'audio',
    title: 'Auto Read-Aloud Audio',
    description: 'Toggle automatic speech narration for responses',
    keys: ['⌘/Ctrl', 'Shift', 'A'],
    icon: Headphones,
  },
  {
    id: 'toggle-theme',
    category: 'general',
    title: 'Toggle Dark / Light Theme',
    description: 'Quickly switch between dark and light color modes',
    keys: ['⌘/Ctrl', 'Shift', 'T'],
    icon: Palette,
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'chat' | 'tools' | 'audio' | 'general'>('all');

  const isMac = useMemo(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform || '');
    }
    return false;
  }, []);

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const query = search.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keys.some(k => k.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Keyboard Shortcuts</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {isMac ? 'macOS (⌘)' : 'Windows / Linux (Ctrl)'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Speed up your workflow and navigate Bolex AI without touching your mouse.
              </p>
            </div>
          </div>

          <button
            id="close-shortcuts-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/30 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="shortcuts-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts (e.g., map, search, theme, enter)..."
              className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              All Shortcuts ({SHORTCUTS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('chat')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === 'chat'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Chat & Navigation
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('tools')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === 'tools'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Tools & Modals
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('audio')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === 'audio'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Audio & Speech
            </button>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="py-10 text-center text-neutral-500 text-xs">
              No shortcuts found matching "{search}".
            </div>
          ) : (
            filteredShortcuts.map((item) => {
              const Icon = item.icon || Command;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-xs sm:max-w-md">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Key Combo Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k, idx) => {
                      let displayKey = k;
                      if (k === '⌘/Ctrl') {
                        displayKey = isMac ? '⌘' : 'Ctrl';
                      } else if (k === 'Shift') {
                        displayKey = isMac ? '⇧ Shift' : 'Shift';
                      } else if (k === 'Enter') {
                        displayKey = '↵ Enter';
                      } else if (k === 'Esc') {
                        displayKey = 'Esc';
                      }

                      return (
                        <React.Fragment key={idx}>
                          <kbd className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200 text-[11px] font-mono font-semibold shadow-xs">
                            {displayKey}
                          </kbd>
                          {idx < item.keys.length - 1 && (
                            <span className="text-neutral-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono font-bold text-neutral-300">
              ?
            </kbd>
            <span>Press anywhere outside of inputs to reopen this cheat sheet</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
