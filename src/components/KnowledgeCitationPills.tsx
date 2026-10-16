import React, { useState } from 'react';
import { BookOpen, Code2, ExternalLink, X, Sparkles, CheckCircle2, Globe } from 'lucide-react';
import { KnowledgeSource } from '../types';

interface KnowledgeCitationPillsProps {
  sources?: KnowledgeSource[];
}

export const KnowledgeCitationPills: React.FC<KnowledgeCitationPillsProps> = ({ sources }) => {
  const [activeSource, setActiveSource] = useState<KnowledgeSource | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Synthesized Knowledge Sources ({sources.length})</span>
      </div>

      {/* Pill buttons */}
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source) => {
          const isWiki = source.type === 'wikipedia';
          const Icon = isWiki ? Globe : Code2;

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setActiveSource(source)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                isWiki
                  ? 'bg-sky-950/40 hover:bg-sky-900/60 border-sky-800/60 text-sky-200'
                  : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800/60 text-amber-200'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="text-[10px] uppercase font-mono opacity-80">
                {isWiki ? 'Wikipedia' : 'DevDocs'}
              </span>
              <span className="max-w-[160px] truncate">{source.title}</span>
            </button>
          );
        })}
      </div>

      {/* Source Preview Modal */}
      {activeSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {activeSource.type === 'wikipedia' ? (
                  <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                ) : (
                  <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {activeSource.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {activeSource.type === 'wikipedia'
                      ? 'Wikipedia Encyclopedia Article'
                      : `Developer Documentation &bull; ${activeSource.category || 'Engineering'}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                  Retrieved Knowledge Excerpt
                </span>
                <p className="whitespace-pre-wrap text-neutral-200">
                  {activeSource.snippet}
                </p>
              </div>

              {activeSource.relevanceScore !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/40 border border-neutral-800 text-[11px] text-neutral-400">
                  <span>Semantic Match Confidence:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {Math.round(activeSource.relevanceScore * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Close
              </button>

              {activeSource.url && (
                <a
                  href={activeSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Open Full Reference</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
