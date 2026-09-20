import { useState, memo } from 'react';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  Search, 
  AlertTriangle 
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  isLastAssistant,
  onRegenerate,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const hasSources =
    message.grounding?.groundingChunks &&
    message.grounding.groundingChunks.length > 0;

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
                {isUser ? 'You' : 'Bolex'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                id={`copy-msg-btn-${message.id}`}
                type="button"
                onClick={handleCopy}
                className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

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

          {/* Error display */}
          {message.error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">Generation Notice</p>
                <p>{message.error}</p>
              </div>
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
