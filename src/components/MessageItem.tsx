import { useState, useEffect, memo } from 'react';
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
  Gauge,
  Clock,
  FileText
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speechManager, SpeechState } from '../lib/speechManager';
import { getSpeechMetrics } from '../lib/speech';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
}

const SPEED_OPTIONS = [0.8, 1.0, 1.25, 1.5, 2.0];

export const MessageItem = memo(function MessageItem({
  message,
  isLastAssistant,
  onRegenerate,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>(() => speechManager.getState());
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const isUser = message.role === 'user';

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
    // If this message is active, restart with new speed
    if (isThisMessageActive) {
      speechManager.speak(message.id, message.content, speed);
    }
  };

  const hasSources =
    message.grounding?.groundingChunks &&
    message.grounding.groundingChunks.length > 0;

  const metrics = !isUser && message.content ? getSpeechMetrics(message.content, speechState.rate) : null;

  // Clean error text from unescaped JSON if present
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

  return (
    <div
      className={`py-4 px-3 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-neutral-900/40 border-y border-neutral-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-300">
                {isUser ? 'You' : 'Bolex AI'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {!isUser && metrics && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-neutral-400 font-normal">
                  <span>•</span>
                  <span>{metrics.wordCount} words</span>
                  <span>•</span>
                  <Clock className="w-2.5 h-2.5 inline text-neutral-400" />
                  <span>~{metrics.displayDuration} listen</span>
                </span>
              )}
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-1">
              {/* Web Speech API Read-Aloud button */}
              {!isUser && message.content && isSpeechSupported && !message.isStreaming && (
                <button
                  id={`read-aloud-btn-${message.id}`}
                  type="button"
                  onClick={handleToggleReadAloud}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isThisMessageActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent'
                  }`}
                  title={
                    isCurrentMessageSpeaking
                      ? 'Pause narration'
                      : isCurrentMessagePaused
                      ? 'Resume narration'
                      : 'Listen with Web Speech read-aloud'
                  }
                >
                  {isCurrentMessageSpeaking ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-300">Pause</span>
                    </>
                  ) : isCurrentMessagePaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-[11px] font-semibold text-amber-300">Resume</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-400" />
                      <span className="hidden sm:inline text-[11px]">Read Aloud</span>
                    </>
                  )}
                </button>
              )}

              {/* Download response */}
              {!isUser && message.content && !message.isStreaming && (
                <button
                  id={`download-msg-btn-${message.id}`}
                  type="button"
                  onClick={handleDownloadResponse}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Download response as Markdown (.md)"
                >
                  {downloaded ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Copy message */}
              <button
                id={`copy-msg-btn-${message.id}`}
                type="button"
                onClick={handleCopy}
                className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Copy message to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Regenerate message */}
              {!isUser && isLastAssistant && onRegenerate && !message.isStreaming && (
                <button
                  id={`regen-msg-btn-${message.id}`}
                  type="button"
                  onClick={onRegenerate}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* User Attached Image */}
          {message.image && (
            <div className="my-2 inline-block max-w-sm rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950">
              <img
                src={message.image.previewUrl}
                alt={message.image.name || 'User attachment'}
                className="max-h-60 w-auto object-contain rounded"
              />
            </div>
          )}

          {/* Text Content */}
          {message.content ? (
            <div>
              {isUser ? (
                <p className="text-sm sm:text-base leading-relaxed text-neutral-100 whitespace-pre-wrap">
                  {message.content}
                </p>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2 py-1 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Thinking & formulating answer...</span>
            </div>
          ) : null}

          {/* Streaming active cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
          )}

          {/* Web Speech Active Audio Narration Bar */}
          {isThisMessageActive && (
            <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/30 border border-amber-500/40 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                {/* Equalizer Sound Waves */}
                <div className="flex items-end gap-1 h-5 w-6 px-1">
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-1' : 'h-1 bg-neutral-500'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-2' : 'h-2 bg-neutral-500'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-3' : 'h-1 bg-neutral-500'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full ${isCurrentMessageSpeaking ? 'animate-eq-4' : 'h-3 bg-neutral-500'}`} />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-200">
                      {isCurrentMessageSpeaking ? 'Reading Aloud...' : 'Narration Paused'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {speechState.rate}x speed
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Web Speech Synthesis Engine
                  </div>
                </div>
              </div>

              {/* Narration Controls */}
              <div className="flex items-center gap-2">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={handleToggleReadAloud}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center gap-1 text-xs transition-colors"
                >
                  {isCurrentMessageSpeaking ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                {/* Stop */}
                <button
                  type="button"
                  onClick={handleStopSpeech}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-300 text-neutral-300 font-medium flex items-center gap-1 text-xs transition-colors"
                  title="Stop read-aloud"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>

                {/* Speed Toggle Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeedControls((prev) => !prev)}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 text-xs font-mono transition-colors"
                    title="Change speaking speed"
                  >
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>{speechState.rate}x</span>
                  </button>

                  {showSpeedControls && (
                    <div className="absolute right-0 bottom-full mb-1 z-20 flex gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={(e) => {
                            handleSpeedChange(speed, e);
                            setShowSpeedControls(false);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            speechState.rate === speed
                              ? 'bg-amber-500 text-neutral-950 font-bold'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error display with inline Retry */}
          {displayError && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-rose-200">Generation Notice</p>
                  <p className="leading-relaxed text-rose-300/90 break-words">{displayError}</p>
                </div>
              </div>
              {onRegenerate && (
                <button
                  id={`retry-error-btn-${message.id}`}
                  type="button"
                  onClick={onRegenerate}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/70 text-rose-100 font-medium text-xs transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Response</span>
                </button>
              )}
            </div>
          )}

          {/* Google Search Grounding Sources */}
          {hasSources && (
            <div className="mt-3 pt-3 border-t border-neutral-800/80">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2 font-medium">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Web Sources Consulted:</span>
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 text-[11px] text-neutral-300 hover:text-white transition-colors"
                    >
                      <span className="text-blue-400 font-mono text-[10px]">{domain}</span>
                      <span className="max-w-[160px] truncate">{title}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
