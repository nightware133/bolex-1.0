import React from 'react';
import { 
  Sparkles, 
  Code2, 
  Search, 
  FileText, 
  Lightbulb, 
  ArrowUpRight,
  Globe, 
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { PersonaRole } from '../types';

interface EmptyStateProps {
  currentRole: PersonaRole;
  onSelectPrompt: (prompt: string, requiresSearch?: boolean) => void;
  onOpenSettings: () => void;
  isBackendConnected: boolean;
}

const BOLEX_STARTER_CARDS = [
  {
    icon: Code2,
    title: 'Code & Debug',
    subtitle: 'Build functions, debug errors & write clean TypeScript',
    prompt: 'Help me write and review a high-performance, well-typed TypeScript utility function with edge case tests.',
    category: 'Engineering',
    requiresSearch: false,
  },
  {
    icon: FileText,
    title: 'Summarize & Extract',
    subtitle: 'Distill articles, notes & transcripts into key takeaways',
    prompt: 'Provide a structured executive summary of key takeaways, action items, and strategic considerations for:',
    category: 'Analysis',
    requiresSearch: false,
  },
  {
    icon: Globe,
    title: 'Web Research',
    subtitle: 'Search the live web with verified Google Search citations',
    prompt: 'Research the latest developments, benchmarks, and real-world findings on:',
    category: 'Live Search',
    requiresSearch: true,
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm & Plan',
    subtitle: 'Explore creative concepts, architecture & project roadmaps',
    prompt: 'Brainstorm 5 innovative, high-impact approaches and step-by-step implementation milestones for:',
    category: 'Strategy',
    requiresSearch: false,
  },
];

const QUICK_CHIPS = [
  { label: '⚡ Refactor & clean code', prompt: 'Refactor this code to eliminate code smells, improve TypeScript typing, and optimize performance:' },
  { label: '🏛️ System architecture blueprint', prompt: 'Design a scalable system architecture, database schema, and API contract for:' },
  { label: '📝 Executive technical summary', prompt: 'Summarize the core technical findings, trade-offs, and critical decisions from this specification:' },
  { label: '🌐 Translate technical doc', prompt: 'Translate this technical documentation into Spanish and Japanese while preserving code syntax:' },
];

export function EmptyState({
  currentRole,
  onSelectPrompt,
}: EmptyStateProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center space-y-8 select-none">
      {/* Brand Icon & Hero Header */}
      <div className="space-y-3 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          What can I help with?
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
          Powered by Bolex AI &bull; Role: <span className="text-amber-400 font-medium">{currentRole.name}</span>
        </p>
      </div>

      {/* 2x2 Starter Cards Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {BOLEX_STARTER_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              id={`starter-card-${idx}`}
              type="button"
              onClick={() => onSelectPrompt(card.prompt, card.requiresSearch)}
              className="group p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between text-left space-y-2 cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <span>{card.category}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                  {card.title}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                  {card.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="w-full space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(chip.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs transition-colors cursor-pointer"
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Multimodal & Shortcuts Tip */}
      <div className="flex items-center gap-2 text-neutral-500 text-xs pt-2">
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Attach images or paste screenshots for instant vision reasoning</span>
      </div>
    </div>
  );
}
