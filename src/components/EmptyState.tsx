import { 
  Sparkles, 
  Brain, 
  Terminal, 
  Search, 
  FileText, 
  ArrowRight,
  KeyRound,
  Image as ImageIcon
} from 'lucide-react';
import { STARTER_PROMPTS } from '../constants';
import { PersonaRole } from '../types';

interface EmptyStateProps {
  currentRole: PersonaRole;
  onSelectPrompt: (prompt: string, requiresSearch?: boolean) => void;
  onOpenSettings: () => void;
  isBackendConnected: boolean;
}

const ICON_MAP: Record<string, any> = {
  Brain,
  Terminal,
  Search,
  FileText,
};

export function EmptyState({
  currentRole,
  onSelectPrompt,
  onOpenSettings,
  isBackendConnected,
}: EmptyStateProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center space-y-6 sm:space-y-8">
      {/* Icon & Title */}
      <div className="space-y-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-500/20">
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
      <div className="w-full max-w-xl p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-left gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-neutral-200 font-medium flex items-center gap-2">
              <span>Unpaid / Free API Key Compatible</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                Free Tier
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] mt-0.5">
              No credit card or paid billing required. Standard AI Studio free quota applies.
            </p>
          </div>
        </div>
        <button
          id="empty-state-key-info-btn"
          type="button"
          onClick={onOpenSettings}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors"
        >
          Details
        </button>
      </div>

      {/* Starter Prompts Grid */}
      <div className="w-full max-w-2xl space-y-2">
        <div className="text-left text-xs font-semibold text-neutral-400 px-1 uppercase tracking-wider">
          Suggested Explorations
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
                className="group p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between text-left space-y-2"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-neutral-800 text-amber-400">
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
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Tip: Drag & drop or attach screenshots and diagrams for instant multimodal analysis</span>
      </div>
    </div>
  );
}
