import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowUp, 
  Image as ImageIcon, 
  Globe, 
  X, 
  Square,
  Mic,
  Sparkles,
  Wand2,
  CheckCircle2,
  Copy,
  BrainCircuit,
  Anchor,
  Plus,
  Lock
} from 'lucide-react';
import { ImageAttachment, ContextualAnchor } from '../types';
import { AI_MODELS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { findMatchingAnchors } from '../lib/anchors';

interface ChatInputProps {
  onSendMessage: (text: string, image?: ImageAttachment) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  enableCognitiveTrace?: boolean;
  onToggleCognitiveTrace?: () => void;
  enableQuantumReasoning?: boolean;
  onToggleQuantumReasoning?: () => void;
  anchors?: ContextualAnchor[];
  onOpenAnchors?: () => void;
  disabled?: boolean;
  onOpenBolexPlus?: () => void;
  onOpenShortcuts?: () => void;
  sessionTokens?: number;
  selectedModelVersion?: string;
  onSelectModelVersion?: (modelId: string) => void;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  enableSearch,
  onToggleSearch,
  enableCognitiveTrace = true,
  onToggleCognitiveTrace,
  enableQuantumReasoning = false,
  onToggleQuantumReasoning,
  anchors = [],
  onOpenAnchors,
  disabled,
  onOpenBolexPlus,
  sessionTokens = 0,
  selectedModelVersion = 'bolex-4.0',
  onSelectModelVersion,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Magic Prompt Enhancer State
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [optimizedPreview, setOptimizedPreview] = useState<{
    optimizedPrompt: string;
    enhancements: string[];
    estimatedQualityBoost?: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { effectiveTier, isTrialActive } = useAuth();
  const isLimitReached = effectiveTier === 'free' && !isTrialActive && sessionTokens >= 60;

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognitionConstructor = 
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionConstructor) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk) {
          setInputText((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimChunk);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          setSpeechError(`Microphone notice: ${e.error || 'Check browser permissions'}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Microphone permission denied or unavailable.');
      setIsListening(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading || disabled || isLimitReached) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(inputText.trim(), attachedImage || undefined);
    setInputText('');
    setAttachedImage(null);
    setOptimizedPreview(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WebP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const commaIndex = result.indexOf(',');
        const base64Data = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;

        setAttachedImage({
          mimeType: file.type,
          data: base64Data,
          previewUrl: result,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOptimizePrompt = async () => {
    if (!inputText.trim() || isOptimizingPrompt) return;
    setIsOptimizingPrompt(true);
    try {
      const res = await fetch('/api/prompt/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawPrompt: inputText.trim(),
          style: 'masterpiece',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data) {
          setOptimizedPreview(data.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const handleApplyOptimized = () => {
    if (optimizedPreview?.optimizedPrompt) {
      setInputText(optimizedPreview.optimizedPrompt);
      setOptimizedPreview(null);
      if (textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
            textareaRef.current.focus();
          }
        }, 50);
      }
    }
  };

  const matchedAnchors = inputText.trim() ? findMatchingAnchors(anchors, inputText, false) : [];

  return (
    <div className="w-full bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pt-4 pb-3 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto flex flex-col items-center space-y-2">
        {/* Floating Input Pill Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = event.target?.result as string;
                if (result) {
                  const commaIndex = result.indexOf(',');
                  const base64Data = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;
                  setAttachedImage({
                    mimeType: file.type,
                    data: base64Data,
                    previewUrl: result,
                    name: file.name,
                  });
                }
              };
              reader.readAsDataURL(file);
            }
          }}
          className={`w-full rounded-3xl bg-neutral-900/90 border transition-all shadow-2xl backdrop-blur-md overflow-hidden ${
            isDragging 
              ? 'border-amber-400 bg-amber-500/10' 
              : 'border-neutral-700/70 focus-within:border-neutral-500'
          }`}
        >
          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-rose-500/15 border-b border-rose-500/30 text-rose-200 text-xs animate-pulse">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="font-semibold text-rose-300">Listening...</span>
                {interimTranscript && (
                  <span className="text-neutral-300 italic truncate max-w-xs">"{interimTranscript}"</span>
                )}
              </div>
              <button 
                type="button" 
                onClick={stopListening}
                className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[11px] font-medium"
              >
                Stop
              </button>
            </div>
          )}

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-2.5">
              <div className="relative inline-block">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attachment"
                  className="w-14 h-14 object-cover rounded-xl border border-neutral-700 bg-neutral-950 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700 hover:bg-neutral-800"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs">
                <p className="font-medium text-neutral-200 truncate max-w-[220px]">{attachedImage.name || 'Image'}</p>
                <p className="text-[11px] text-amber-400">Ready for vision analysis</p>
              </div>
            </div>
          )}

          {/* Prompt Studio Preview */}
          {optimizedPreview && (
            <div className="m-3 p-3 rounded-2xl bg-neutral-950 border border-amber-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Prompt Studio Enhanced</span>
                  {optimizedPreview.estimatedQualityBoost && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      {optimizedPreview.estimatedQualityBoost}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOptimizedPreview(null)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-28 overflow-y-auto p-2 rounded-lg bg-neutral-900 font-mono text-[11px] text-neutral-200 whitespace-pre-wrap">
                {optimizedPreview.optimizedPrompt}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(optimizedPreview.optimizedPrompt)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyOptimized}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          )}

          {/* Matched Anchors Bar */}
          {matchedAnchors.length > 0 && (
            <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Anchor className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-300">Memory Vault:</span>
                {matchedAnchors.map(({ anchor }) => (
                  <span key={anchor.id} className="px-2 py-0.5 rounded-full bg-neutral-900 border border-amber-500/30 text-[10px] text-neutral-200">
                    {anchor.title}
                  </span>
                ))}
              </div>
              {onOpenAnchors && (
                <button type="button" onClick={onOpenAnchors} className="text-[10px] text-amber-400 hover:underline">
                  Vault
                </button>
              )}
            </div>
          )}

          {/* Main Textarea */}
          <textarea
            id="chat-textarea"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to microphone...'
                : attachedImage
                ? 'Ask anything about this image...'
                : 'Message Bolex...'
            }
            disabled={disabled}
            className="w-full px-4 pt-3.5 pb-2 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 resize-none focus:outline-hidden leading-relaxed"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {/* Bottom Action Bar inside the Floating Pill */}
          <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
            {/* Left Quick Capability Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {/* Attach Button */}
              <button
                id="attach-image-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                title="Attach an image for vision reasoning"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Quick Model Selector Pill */}
              <div className="relative">
                <button
                  id="input-model-selector-btn"
                  type="button"
                  onClick={() => setIsModelMenuOpen((prev) => !prev)}
                  className="px-2 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 border bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 cursor-pointer"
                  title="Switch AI Model Version"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px] font-bold">
                    {AI_MODELS.find((m) => m.id === selectedModelVersion)?.versionNumber || '3.8'}
                  </span>
                </button>

                {isModelMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/90 shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 text-[10.5px] font-medium text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                      <span>Neural Model Tier</span>
                      <span className="text-[10px] text-amber-400 font-mono">Bolex Engine</span>
                    </div>
                    {AI_MODELS.map((model) => {
                      const isLocked = Boolean(model.isLockedForFree && effectiveTier === 'free' && !isTrialActive);
                      const isSelected = (selectedModelVersion === model.id) || (!selectedModelVersion && model.id === 'bolex-3.8');

                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              onOpenBolexPlus?.();
                              setIsModelMenuOpen(false);
                              return;
                            }
                            onSelectModelVersion?.(model.id);
                            setIsModelMenuOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-800 text-white font-semibold'
                              : isLocked
                              ? 'text-neutral-400 hover:bg-amber-950/20'
                              : 'text-neutral-300 hover:bg-neutral-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${model.tagColor}`}>
                              {model.versionNumber}
                            </span>
                            <span className="truncate">{model.name}</span>
                          </div>

                          {isLocked ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{model.requiredTier === 'ultra' ? 'ULTRA' : 'PLUS'}</span>
                            </span>
                          ) : isSelected ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Web Search Grounding Pill */}
              <button
                id="input-web-search-toggle"
                type="button"
                onClick={onToggleSearch}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  enableSearch
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border-neutral-800'
                }`}
                title={enableSearch ? 'Google Search grounding is active' : 'Click to enable Google Search grounding'}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px]">Search</span>
              </button>

              {/* Cognitive Trace / Reasoning Pill */}
              {onToggleCognitiveTrace && (
                <button
                  id="input-cognitive-trace-toggle"
                  type="button"
                  onClick={onToggleCognitiveTrace}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    enableCognitiveTrace
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border-neutral-800'
                  }`}
                  title={enableCognitiveTrace ? 'Cognitive Trace reasoning is ON' : 'Turn on Cognitive Trace'}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Reason</span>
                </button>
              )}

              {/* Prompt Studio Pill */}
              <button
                id="input-magic-prompt-btn"
                type="button"
                onClick={handleOptimizePrompt}
                disabled={isOptimizingPrompt || !inputText.trim()}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  isOptimizingPrompt
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                    : inputText.trim()
                    ? 'text-amber-400 hover:bg-neutral-800 border-neutral-800'
                    : 'text-neutral-500 border-transparent opacity-50'
                }`}
                title="Enhance prompt with Bolex Prompt Studio AI"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isOptimizingPrompt ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline text-[11px]">Enhance</span>
              </button>
            </div>

            {/* Right Action Icons: Mic & Circular Send Button */}
            <div className="flex items-center gap-1.5">
              {/* Mic Dictation */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={isListening ? 'Stop voice dictation' : 'Dictate with microphone'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Circular Send Arrow Button / Stop Button */}
              {isLoading ? (
                <button
                  id="stop-generation-btn"
                  type="button"
                  onClick={onStopGeneration}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 flex items-center justify-center transition-all cursor-pointer shadow-md"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  id="send-message-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={(!inputText.trim() && !attachedImage) || disabled}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() || attachedImage
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-md cursor-pointer scale-100'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Centered Disclaimer */}
        <p className="text-[11px] text-neutral-500 text-center tracking-normal">
          Bolex can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
