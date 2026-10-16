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
  Clock,
  Maximize2,
  X,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ChatMessage } from '../types';
import { AI_MODELS } from '../constants';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CognitiveTrace, extractCognitiveTrace } from './CognitiveTrace';
import { speechManager, SpeechState } from '../lib/speechManager';
import { getSpeechMetrics } from '../lib/speech';
import { useAuth } from '../context/AuthContext';
import { MessageFeedbackWidget } from './MessageFeedbackWidget';
import { KnowledgeCitationPills } from './KnowledgeCitationPills';

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>(() => speechManager.getState());
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const isUser = message.role === 'user';
  const messageImages = (message.images && message.images.length > 0)
    ? message.images
    : (message.image ? [message.image] : []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft' && messageImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : messageImages.length - 1));
      } else if (e.key === 'ArrowRight' && messageImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null && prev < messageImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, messageImages.length]);
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
            {/* User Attached Image with Vision AI Badge & Lightbox Zoom */}
            {/* User Attached Images (Supports up to 6 pictures with Responsive Grid & Lightbox) */}
            {messageImages.length > 0 && (
              <div className="mb-2.5 space-y-2">
                {messageImages.length === 1 ? (
                  // Single image presentation
                  <div 
                    onClick={() => setLightboxIndex(0)}
                    className="group/img relative inline-block max-w-full rounded-2xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-md cursor-pointer hover:border-amber-500/50 transition-all"
                    title="Click to expand picture"
                  >
                    <img
                      src={messageImages[0].previewUrl}
                      alt={messageImages[0].name || 'User picture'}
                      className="max-h-64 sm:max-h-72 w-auto object-contain rounded-2xl group-hover/img:scale-[1.01] transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                      <Maximize2 className="w-4 h-4 text-amber-400" />
                      <span>Expand Picture</span>
                    </div>
                  </div>
                ) : (
                  // Multi-image responsive grid (2 to 6 images)
                  <div className={`grid gap-2 ${
                    messageImages.length === 2 ? 'grid-cols-2 max-w-md' :
                    messageImages.length === 3 ? 'grid-cols-3 max-w-lg' :
                    messageImages.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                    'grid-cols-3'
                  }`}>
                    {messageImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="group/thumb relative aspect-square rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-sm cursor-pointer hover:border-amber-400 transition-all"
                        title={`Click to expand picture ${idx + 1}`}
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.name || `Picture ${idx + 1}`}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-amber-300 border border-white/10">
                          {idx + 1}/{messageImages.length}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                          <Maximize2 className="w-4 h-4 text-amber-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10.5px] text-neutral-400 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>Multimodal Vision Input {messageImages.length > 1 ? `(${messageImages.length} pictures)` : ''}</span>
                  </span>
                  {messageImages.length === 1 && messageImages[0].name && (
                    <span className="truncate max-w-[180px] text-neutral-400" title={messageImages[0].name}>
                      {messageImages[0].name}
                    </span>
                  )}
                </div>

                {/* Lightbox Modal with Next/Previous Navigation */}
                {lightboxIndex !== null && messageImages[lightboxIndex] && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-default"
                    onClick={() => setLightboxIndex(null)}
                  >
                    <div 
                      className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative flex items-center justify-center w-full">
                        {messageImages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : messageImages.length - 1))}
                            className="absolute -left-2 sm:-left-12 z-10 p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white transition-all cursor-pointer shadow-xl"
                            title="Previous image (Left arrow)"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}

                        <img
                          src={messageImages[lightboxIndex].previewUrl}
                          alt={messageImages[lightboxIndex].name || 'Full screen preview'}
                          className="max-w-full max-h-[78vh] object-contain rounded-2xl border border-neutral-800 shadow-2xl"
                        />

                        {messageImages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLightboxIndex((prev) => (prev !== null && prev < messageImages.length - 1 ? prev + 1 : 0))}
                            className="absolute -right-2 sm:-right-12 z-10 p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white transition-all cursor-pointer shadow-xl"
                            title="Next image (Right arrow)"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-neutral-300">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-200 truncate max-w-xs sm:max-w-md">
                            {messageImages[lightboxIndex].name || `Picture ${lightboxIndex + 1}`}
                          </span>
                          {messageImages.length > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10.5px] border border-neutral-700">
                              {lightboxIndex + 1} of {messageImages.length}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={messageImages[lightboxIndex].previewUrl}
                            download={messageImages[lightboxIndex].name || `picture_${lightboxIndex + 1}.png`}
                            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(null)}
                            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
                            title="Close preview (Esc)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Synthesized Knowledge Base Sources (Wikipedia & Developer Docs) */}
          <KnowledgeCitationPills sources={message.knowledgeSources} />

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
