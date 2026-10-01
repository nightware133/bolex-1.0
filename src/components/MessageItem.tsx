import { useState, useEffect, useRef, memo } from 'react';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  Search, 
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  ThumbsUp,
  ThumbsDown,
  Gauge,
  Clock
} from 'lucide-react';
import { ChatMessage } from '../types';
import { AI_MODELS } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CognitiveTrace, extractCognitiveTrace } from './CognitiveTrace';
import { speechManager, SpeechState } from '../lib/speechManager';
import { getSpeechMetrics } from '../lib/speech';
import { useAuth } from '../context/AuthContext';
import { MessageFeedbackWidget } from './MessageFeedbackWidget';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  index?: number;
  totalCount?: number;
  sessionId?: string;
  sessionTitle?: string;
  userPromptSnippet?: string;
}

const SPEED_OPTIONS = [0.8, 1.0, 1.25, 1.5, 2.0];

export const MessageItem = memo(function MessageItem({
  message,
  isLastAssistant,
  onRegenerate,
  index,
  totalCount,
  sessionId = 'active-session',
  sessionTitle = 'Chat Session',
  userPromptSnippet,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>(() => speechManager.getState());
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const isUser = message.role === 'user';
  const { effectiveTier } = useAuth();
  const isQuantum = effectiveTier === 'quantum';
  const isUltra = effectiveTier === 'ultra';

  const modelInfo = message.modelVersion
    ? AI_MODELS.find((m) => m.id === message.modelVersion) || {
        name: message.modelVersion,
        versionNumber: message.modelVersion.replace('bolex-', '').toUpperCase(),
        tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      }
    : null;

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const isSpeechSupported = speechManager.isSupported();
  const isCurrentMessageSpeaking = 
    speechState.currentMessageId === message.id && speechState.status === 'speaking';
  const isCurrentMessagePaused = 
    speechState.currentMessageId === message.id && speechState.status === 'paused';
  const isThisMessageActive = isCurrentMessageSpeaking || isCurrentMessagePaused;

  useEffect(() => {
    const unsubscribe = speechManager.subscribe((state) => {
      setSpeechState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadResponse = () => {
    if (!message.content) return;
    const blob = new Blob([message.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolex-response-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleToggleReadAloud = () => {
    if (!isSpeechSupported || !message.content) return;

    if (isCurrentMessageSpeaking) {
      speechManager.pause();
    } else if (isCurrentMessagePaused) {
      speechManager.resume();
    } else {
      speechManager.speak(message.id, message.content);
    }
  };

  const handleStopSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.stop();
  };

  const handleSpeedChange = (speed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.setRate(speed);
    if (isThisMessageActive) {
      speechManager.speak(message.id, message.content, speed);
    }
  };

  const hasSources =
    message.grounding?.groundingChunks &&
    message.grounding.groundingChunks.length > 0;

  const metrics = !isUser && message.content ? getSpeechMetrics(message.content, speechState.rate) : null;

  let displayError = message.error;
  if (displayError) {
    for (let i = 0; i < 3; i++) {
      try {
        const p = JSON.parse(displayError);
        if (p?.error?.message) displayError = p.error.message;
        else if (p?.message) displayError = p.message;
        else if (p?.error) displayError = p.error;
      } catch {
        break;
      }
    }
    if (
      displayError.includes('503') ||
      displayError.includes('high demand') ||
      displayError.includes('UNAVAILABLE') ||
      displayError.includes('overloaded')
    ) {
      displayError = 'The AI service is currently experiencing high demand. Automatic failovers are active. Please click "Retry Response" to regenerate.';
    } else if (displayError.includes('429') || displayError.includes('quota') || displayError.includes('RESOURCE_EXHAUSTED')) {
      displayError = 'The upstream AI service is temporarily experiencing high request volume. Automatic failovers are active. Please click "Retry Response" to regenerate.';
    }
  }

  const isLatestMessage = totalCount !== undefined && index !== undefined && index >= totalCount - 2;
  const staggerDelay = index !== undefined
    ? isLatestMessage
      ? `${Math.max(0, (index - (totalCount - 2)) * 60)}ms`
      : `${Math.min(index * 35, 180)}ms`
    : '0ms';

  // 1. User Bubble
  if (isUser) {
    return (
      <div
        className="py-3 px-3 sm:px-6 transition-colors animate-message-fade-in flex justify-end"
        style={{
          animationDelay: isFirstMountRef.current ? staggerDelay : '0ms',
          animationFillMode: 'both',
        }}
      >
        <div className="max-w-3xl w-full flex justify-end">
          <div className="group relative max-w-[85%] sm:max-w-[75%] rounded-3xl bg-neutral-800 text-neutral-100 px-5 py-3 shadow-xs">
            {/* User Attached Image */}
            {message.image && (
              <div className="mb-2.5 inline-block max-w-full rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950">
                <img
                  src={message.image.previewUrl}
                  alt={message.image.name || 'User attachment'}
                  className="max-h-60 w-auto object-contain rounded-xl"
                />
              </div>
            )}

            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </p>

            {/* Quick Copy on Hover */}
            <div className="absolute right-2 -bottom-7 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full px-2 py-0.5 shadow-md">
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Assistant Message
  return (
    <div
      className="py-4 px-3 sm:px-6 transition-colors animate-message-fade-in"
      style={{
        animationDelay: isFirstMountRef.current ? staggerDelay : '0ms',
        animationFillMode: 'both',
      }}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4">
        {/* Assistant Avatar */}
        <div className="shrink-0 mt-0.5">
          {isQuantum ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-neutral-950 flex items-center justify-center font-bold shadow-md ring-1 ring-cyan-400/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          ) : isUltra ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-200">Bolex</span>
              {modelInfo && (
                <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${modelInfo.tagColor}`} title={modelInfo.name}>
                  {modelInfo.versionNumber}
                </span>
              )}
              {isQuantum && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  QUANTUM
                </span>
              )}
              {metrics && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-500 font-normal">
                  <span>•</span>
                  <span>{metrics.wordCount} words</span>
                </span>
              )}
            </div>
          </div>

          {/* Text Content */}
          {message.content ? (
            <div className="text-neutral-100 leading-relaxed select-text">
              {(() => {
                const { hasTrace, traceContent, finalContent, isStreamingTrace } = extractCognitiveTrace(message.content);
                return (
                  <div className="space-y-3">
                    {hasTrace && (
                      <CognitiveTrace
                        traceContent={traceContent}
                        isStreaming={message.isStreaming && isStreamingTrace}
                        defaultExpanded={true}
                      />
                    )}
                    {finalContent ? (
                      <MarkdownRenderer content={finalContent} />
                    ) : message.isStreaming && hasTrace ? null : !hasTrace ? (
                      <MarkdownRenderer content={message.content} />
                    ) : null}
                  </div>
                );
              })()}
            </div>
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2 py-1 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Thinking...</span>
            </div>
          ) : null}

          {/* Streaming active cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
          )}

          {/* Google Search Grounding Sources (Source pill cards) */}
          {hasSources && (
            <div className="mt-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2 font-medium">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Sources</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.grounding?.groundingChunks?.map((chunk, idx) => {
                  if (!chunk.web) return null;
                  const title = chunk.web.title || chunk.web.uri;
                  const domain = new URL(chunk.web.uri).hostname.replace('www.', '');
                  return (
                    <a
                      key={idx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] text-neutral-300 hover:text-white transition-colors"
                    >
                      <span className="text-blue-400 font-mono text-[10px]">{domain}</span>
                      <span className="max-w-[150px] truncate">{title}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Web Speech Active Audio Narration Bar */}
          {isThisMessageActive && (
            <div className="mt-3 p-2.5 rounded-2xl bg-neutral-900 border border-amber-500/40 shadow-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex items-end gap-1 h-4 w-5 px-1">
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-1' : 'h-1 bg-neutral-500'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-2' : 'h-2 bg-neutral-500'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-3' : 'h-1 bg-neutral-500'}`} />
                </div>
                <div>
                  <span className="font-semibold text-amber-200">
                    {isCurrentMessageSpeaking ? 'Reading aloud...' : 'Narration paused'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReadAloud}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium"
                >
                  {isCurrentMessageSpeaking ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  onClick={handleStopSpeech}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                  title="Stop"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Resilient Error Recovery Card */}
          {displayError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-300">Connection or Generation Paused</p>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">{displayError}</p>
                </div>
              </div>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Response</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom Action Toolbar */}
          {!message.isStreaming && message.content && (
            <div className="flex items-center gap-1 pt-1 text-neutral-400">
              {/* Copy */}
              <button
                id={`copy-msg-btn-${message.id}`}
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Thumbs Up */}
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={`p-1.5 rounded-lg transition-colors ${
                  feedback === 'up' ? 'text-amber-400 bg-amber-500/10' : 'hover:text-white hover:bg-neutral-800'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              {/* Thumbs Down */}
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={`p-1.5 rounded-lg transition-colors ${
                  feedback === 'down' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-white hover:bg-neutral-800'
                }`}
                title="Bad response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {/* Read Aloud */}
              {isSpeechSupported && (
                <button
                  id={`read-aloud-btn-${message.id}`}
                  type="button"
                  onClick={handleToggleReadAloud}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Regenerate */}
              {isLastAssistant && onRegenerate && (
                <button
                  id={`regen-msg-btn-${message.id}`}
                  type="button"
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Download */}
              <button
                id={`download-msg-btn-${message.id}`}
                type="button"
                onClick={handleDownloadResponse}
                className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
                title="Download markdown (.md)"
              >
                {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* 1-5 Star User Feedback & Model Improvement Widget */}
          {!isUser && !message.isStreaming && !message.error && message.content && (
            <MessageFeedbackWidget
              messageId={message.id}
              sessionId={sessionId}
              sessionTitle={sessionTitle}
              model={message.modelVersion || 'bolex-turbo'}
              userPromptSnippet={userPromptSnippet}
              assistantResponseSnippet={message.content.slice(0, 300)}
            />
          )}
        </div>
      </div>
    </div>
  );
});
