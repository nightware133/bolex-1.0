import React, { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Terminal, 
  Search, 
  FileText, 
  ArrowRight,
  KeyRound,
  Image as ImageIcon,
  Flame,
  Globe,
  Lightbulb,
  PenTool,
  TrendingUp,
  HelpCircle,
  BarChart3,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { STARTER_PROMPTS, QUICK_SUGGESTIONS } from '../constants';
import { PersonaRole } from '../types';

interface EmptyStateProps {
  currentRole: PersonaRole;
  onSelectPrompt: (prompt: string, requiresSearch?: boolean) => void;
  onOpenSettings: () => void;
  isBackendConnected: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Terminal,
  Search,
  FileText,
  Globe,
  Lightbulb,
  PenTool,
  TrendingUp,
  HelpCircle,
  BarChart3,
  Sparkles,
};

type SuggestionFilter = 'all' | 'trending' | 'research' | 'code' | 'ideation' | 'writing';

export function EmptyState({
  currentRole,
  onSelectPrompt,
  onOpenSettings,
  isBackendConnected,
}: EmptyStateProps) {
  const [activeFilter, setActiveFilter] = useState<SuggestionFilter>('all');

  const filteredSuggestions = QUICK_SUGGESTIONS.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'trending') return item.trending;
    if (activeFilter === 'research') return item.category.toLowerCase() === 'research' || item.category.toLowerCase() === 'analysis';
    if (activeFilter === 'code') return item.category.toLowerCase() === 'code' || item.category.toLowerCase() === 'engineering';
    if (activeFilter === 'ideation') return item.category.toLowerCase() === 'ideation' || item.category.toLowerCase() === 'planning';
    if (activeFilter === 'writing') return item.category.toLowerCase() === 'writing';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center text-center space-y-5 sm:space-y-7">
      {/* Icon & Title */}
      <div className="space-y-2.5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 mx-auto flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/30">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          How can I help you today?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
          Powered by <strong className="text-neutral-200">Bolex AI</strong>. Ask questions, analyze code or images, brainstorm concepts, or search the web in real time.
        </p>
      </div>

      {/* Free Tier / Unpaid Key Callout */}
      <div className="w-full max-w-xl p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 flex items-center justify-between text-left gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-neutral-200 font-medium flex items-center gap-2 flex-wrap">
              <span>Unpaid / Free API Key Compatible</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                Free Tier
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] mt-0.5 truncate">
              No credit card or paid billing required. Standard AI Studio free quota applies.
            </p>
          </div>
        </div>
        <button
          id="empty-state-key-info-btn"
          type="button"
          onClick={onOpenSettings}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
        >
          Details
        </button>
      </div>

      {/* Quick Suggestions / Trending Topics Chip Row */}
      <div className="w-full max-w-2xl space-y-2.5 text-left">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Trending Topics & Quick Suggestions</span>
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('trending')}
              className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeFilter === 'trending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              Trending
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ideation')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeFilter === 'ideation'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Ideation
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('code')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeFilter === 'code'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Code
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('research')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeFilter === 'research'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Web
            </button>
          </div>
        </div>

        {/* Scrollable / Responsive Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-0.5">
          {filteredSuggestions.map((item) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            return (
              <button
                key={item.id}
                id={`quick-chip-${item.id}`}
                type="button"
                onClick={() => onSelectPrompt(item.prompt, item.requiresSearch)}
                className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-850/95 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-all duration-150 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
                title={`Click to run: "${item.prompt}"`}
              >
                <div className="p-1 rounded-lg bg-neutral-800/90 text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-400/10 transition-colors shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {item.title}
                </span>

                {item.trending && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wide">
                    Hot
                  </span>
                )}

                <ArrowUpRight className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 transition-colors ml-0.5 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Starter Prompts In-Depth Exploration Grid */}
      <div className="w-full max-w-2xl space-y-2.5">
        <div className="text-left text-xs font-semibold text-neutral-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-neutral-400" />
          <span>In-Depth Explorations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {STARTER_PROMPTS.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            return (
              <button
                key={idx}
                id={`starter-prompt-${idx}`}
                type="button"
                onClick={() => onSelectPrompt(item.prompt, item.requiresSearch)}
                className="group p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850/90 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between text-left space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-neutral-800 text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="font-medium text-xs sm:text-sm text-neutral-200 group-hover:text-white line-clamp-2">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multimodal hint */}
      <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
        <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
        <span>Tip: Drag & drop or attach screenshots and diagrams for instant multimodal analysis</span>
      </div>
    </div>
  );
}
