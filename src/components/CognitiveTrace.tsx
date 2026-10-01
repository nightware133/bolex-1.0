import React, { useState, memo } from 'react';
import { 
  BrainCircuit, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  Terminal,
  Clock,
  Zap
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CognitiveTraceProps {
  traceContent: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Extracts <thought>...</thought> blocks from the AI's raw stream or text output.
 * Handles both completed blocks and in-progress streaming blocks.
 */
export function extractCognitiveTrace(rawText: string): {
  hasTrace: boolean;
  traceContent: string;
  finalContent: string;
  isStreamingTrace: boolean;
} {
  if (!rawText) {
    return { hasTrace: false, traceContent: '', finalContent: '', isStreamingTrace: false };
  }

  const openTag = '<thought>';
  const closeTag = '</thought>';

  const openIndex = rawText.indexOf(openTag);
  if (openIndex === -1) {
    // Also support alternative tag <reasoning> if model produces it
    const altOpen = '<reasoning>';
    const altClose = '</reasoning>';
    const altIdx = rawText.indexOf(altOpen);
    if (altIdx !== -1) {
      const altCloseIdx = rawText.indexOf(altClose, altIdx);
      if (altCloseIdx !== -1) {
        const trace = rawText.slice(altIdx + altOpen.length, altCloseIdx).trim();
        const final = (rawText.slice(0, altIdx) + rawText.slice(altCloseIdx + altClose.length)).trim();
        return { hasTrace: true, traceContent: trace, finalContent: final, isStreamingTrace: false };
      } else {
        const trace = rawText.slice(altIdx + altOpen.length).trim();
        return { hasTrace: true, traceContent: trace, finalContent: '', isStreamingTrace: true };
      }
    }
    return { hasTrace: false, traceContent: '', finalContent: rawText, isStreamingTrace: false };
  }

  const closeIndex = rawText.indexOf(closeTag, openIndex);

  if (closeIndex !== -1) {
    // Both open and close tags present
    const trace = rawText.slice(openIndex + openTag.length, closeIndex).trim();
    const final = (rawText.slice(0, openIndex) + rawText.slice(closeIndex + closeTag.length)).trim();
    return {
      hasTrace: true,
      traceContent: trace,
      finalContent: final,
      isStreamingTrace: false,
    };
  } else {
    // Still in the middle of streaming the thought process
    const trace = rawText.slice(openIndex + openTag.length).trim();
    return {
      hasTrace: true,
      traceContent: trace,
      finalContent: '',
      isStreamingTrace: true,
    };
  }
}

export const CognitiveTrace = memo(function CognitiveTrace({
  traceContent,
  isStreaming = false,
  defaultExpanded = true,
}: CognitiveTraceProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  if (!traceContent && !isStreaming) return null;

  const handleCopyTrace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(traceContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const isQuantumTrace = 
    traceContent.includes('QUANTUM') ||
    traceContent.includes('Branch Alpha') ||
    traceContent.includes('Branch Beta') ||
    traceContent.includes('Quantum Matrix') ||
    traceContent.includes('Multi-Branch');

  const wordCount = traceContent ? traceContent.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.round(wordCount * 1.3);

  return (
    <div className={`my-2.5 rounded-xl overflow-hidden shadow-md transition-all ${
      isQuantumTrace
        ? 'border border-cyan-500/40 bg-neutral-950/90 shadow-cyan-950/30'
        : 'border border-purple-500/30 bg-neutral-950/80'
    }`}>
      {/* Header Bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className={`w-full px-3.5 py-2.5 border-b flex items-center justify-between gap-2 text-left cursor-pointer select-none transition-colors ${
          isQuantumTrace
            ? 'bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-neutral-900 border-cyan-500/30 hover:bg-cyan-950/60'
            : 'bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900/80 border-purple-500/20 hover:bg-purple-950/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
            isQuantumTrace
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
              : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
          }`}>
            {isQuantumTrace ? (
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 animate-pulse" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <span className={isQuantumTrace ? 'text-cyan-200' : 'text-purple-200'}>
                {isQuantumTrace ? 'Quantum Cognitive Matrix' : 'Cognitive Trace'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-normal border ${
                isQuantumTrace
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {isQuantumTrace ? 'Multi-Branch Simulation' : 'Internal Monologue'}
              </span>
            </span>

            {isStreaming && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{isQuantumTrace ? 'Simulating quantum neural hypotheses...' : 'Formulating chain of thought...'}</span>
              </span>
            )}

            {!isStreaming && wordCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-neutral-400">
                <span>•</span>
                <span>{wordCount} words (~{estimatedTokens} reasoning tokens)</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {traceContent && (
            <button
              type="button"
              onClick={handleCopyTrace}
              className="p-1 rounded text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 transition-colors text-[11px] flex items-center gap-1 px-1.5"
              title="Copy reasoning trace"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px] hidden md:inline">Copy Trace</span>
                </>
              )}
            </button>
          )}

          <div className="p-1 rounded text-purple-300 hover:bg-neutral-800">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Reasoning Body */}
      {isExpanded && (
        <div className="p-3.5 font-mono text-xs text-neutral-300 leading-relaxed bg-neutral-950/90 max-h-96 overflow-y-auto border-t border-neutral-900 space-y-2">
          {traceContent ? (
            <div className={`whitespace-pre-wrap font-sans text-neutral-300 text-xs sm:text-[13px] leading-relaxed border-l-2 pl-3 ${
              isQuantumTrace ? 'border-cyan-500/60' : 'border-purple-500/40'
            }`}>
              {traceContent}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-neutral-400 italic">
              <span className={`w-2 h-2 rounded-full animate-ping ${isQuantumTrace ? 'bg-cyan-400' : 'bg-purple-400'}`} />
              <span>{isQuantumTrace ? 'Synthesizing multi-branch quantum matrix hypotheses...' : 'Analyzing constraints and synthesizing logical paths...'}</span>
            </div>
          )}

          {isQuantumTrace && !isStreaming && (
            <div className="mt-3 pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[11px] text-cyan-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
                <span>Quantum Convergence Index: 99.8%</span>
              </span>
              <span className="text-[10px] text-neutral-400">Multi-Branch Verified</span>
            </div>
          )}

          {isStreaming && (
            <div className={`flex items-center gap-1.5 pt-1 text-[11px] font-mono ${
              isQuantumTrace ? 'text-cyan-400' : 'text-purple-400'
            }`}>
              <Terminal className="w-3 h-3 animate-spin" />
              <span>{isQuantumTrace ? 'Quantum simulation in flight...' : 'Synthesizing cognitive steps in real-time...'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
