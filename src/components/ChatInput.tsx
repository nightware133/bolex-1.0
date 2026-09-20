import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowUp, 
  Image as ImageIcon, 
  Globe, 
  X, 
  Square,
  Mic,
  MicOff,
  Sparkles,
  Crown,
  AlertCircle
} from 'lucide-react';
import { ImageAttachment } from '../types';
import { useAuth } from '../context/AuthContext';

interface ChatInputProps {
  onSendMessage: (text: string, image?: ImageAttachment) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  disabled?: boolean;
  onOpenBolexPlus?: () => void;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  enableSearch,
  onToggleSearch,
  disabled,
  onOpenBolexPlus,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isContinuousRef = useRef(false);

  const { profile } = useAuth();
  const isPlus = Boolean(profile?.isBolexPlus || profile?.planTier === 'plus');

  isListeningRef.current = isListening;
  isContinuousRef.current = isPlus;

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
    isListeningRef.current = false;
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

    // Check browser support for Web Speech API
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
        isListeningRef.current = true;
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
          setInputText((prev) => {
            const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
            const updated = prev + (needsSpace ? ' ' : '') + finalChunk.trim();
            // Automatically adjust textarea height to fit content
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
              }
            }, 0);
            return updated;
          });
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimChunk);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error === 'no-speech') {
          // In standard mode, if no speech detected for a while, keep listening or finish
          if (!isContinuousRef.current) {
            // Keep status without error
          }
        } else if (event.error !== 'aborted') {
          setSpeechError(`Voice dictation issue: ${event.error}`);
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        // If Bolex Plus continuous perk is active and not explicitly stopped, restart recognition
        if (isListeningRef.current && isContinuousRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // ignore
          }
        }
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechError(err?.message || 'Failed to start microphone dictation.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const base64Data = result.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedImage) || isLoading || disabled) {
      return;
    }
    
    // Stop voice dictation if active
    if (isListening) {
      stopListening();
    }

    onSendMessage(trimmed, attachedImage || undefined);
    setInputText('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-neutral-900/80 border-t border-neutral-800 backdrop-blur-md">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Drag overlay state */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border bg-neutral-950 transition-all overflow-hidden ${
            isDragging
              ? 'border-amber-400/80 bg-neutral-900/90 ring-2 ring-amber-400/30'
              : isListening
              ? 'border-rose-500/60 ring-1 ring-rose-500/30'
              : 'border-neutral-800 focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-amber-500/20'
          }`}
        >
          {/* Active Voice Dictation Banner */}
          {isListening && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-950/60 via-neutral-950 to-neutral-950 border-b border-rose-500/30 text-rose-300 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-200 shrink-0">
                  {isPlus ? 'Bolex Plus Pro Dictation' : 'Listening with Web Speech...'}
                </span>
                {interimTranscript && (
                  <span className="text-neutral-400 truncate italic max-w-[280px]">
                    "{interimTranscript}"
                  </span>
                )}
              </div>
              <button 
                type="button" 
                onClick={stopListening}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-medium transition-colors shrink-0"
              >
                Stop Mic
              </button>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-neutral-400 hover:text-white text-[11px] underline shrink-0 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Attached image preview */}
          {attachedImage && (
            <div className="p-2.5 pb-0 flex items-center gap-2">
              <div className="relative group inline-block">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attachment preview"
                  className="w-14 h-14 object-cover rounded-lg border border-neutral-700 bg-neutral-900"
                />
                <button
                  id="remove-attachment-btn"
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700 hover:bg-neutral-800 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-neutral-400 truncate max-w-[200px]">
                <p className="font-medium text-neutral-300 truncate">{attachedImage.name || 'Image'}</p>
                <p className="text-[11px] text-emerald-400">Attached for vision reasoning</p>
              </div>
            </div>
          )}

          {/* Text Area */}
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
                ? 'Speaking... your speech will appear here in real-time.'
                : attachedImage
                ? 'Ask a question or provide instructions about this image...'
                : 'Ask anything, dictate with your microphone, or brainstorm ideas...'
            }
            disabled={disabled}
            className="w-full px-3.5 pt-3 pb-2 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 resize-none focus:outline-hidden leading-relaxed"
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {/* Bottom Toolbar inside the box */}
          <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Web Speech API Microphone Dictation Button */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/40 animate-pulse'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title={
                  isListening 
                    ? 'Click to stop voice dictation' 
                    : 'Dictate message using your device microphone (Web Speech API)'
                }
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-rose-400 animate-bounce" />
                ) : (
                  <Mic className="w-4 h-4 text-neutral-400 group-hover:text-amber-400" />
                )}
                <span className="hidden sm:inline text-[11px] font-medium">
                  {isListening ? 'Listening...' : 'Dictate'}
                </span>
              </button>

              {/* Attach Image Button */}
              <button
                id="attach-image-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors flex items-center gap-1 text-xs"
                title="Attach an image for vision reasoning"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Image</span>
              </button>

              {/* Web Grounding Toggle */}
              <button
                id="input-web-search-toggle"
                type="button"
                onClick={onToggleSearch}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                  enableSearch
                    ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
                title={enableSearch ? 'Google Search grounding is active' : 'Click to enable Google Search grounding'}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">
                  {enableSearch ? 'Web Search ON' : 'Web Search OFF'}
                </span>
              </button>

              {/* Bolex Plus Perks Badge / Upgrade trigger */}
              {onOpenBolexPlus && (
                isPlus ? (
                  <button
                    id="input-bolex-plus-active-btn"
                    type="button"
                    onClick={onOpenBolexPlus}
                    className="p-1 sm:px-2 sm:py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 flex items-center gap-1 text-xs transition-colors"
                    title="Bolex Plus member perks active: Continuous Voice & Priority Turbo"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px] font-semibold">Plus Active</span>
                  </button>
                ) : (
                  <button
                    id="input-bolex-plus-upgrade-btn"
                    type="button"
                    onClick={onOpenBolexPlus}
                    className="p-1 sm:px-2 sm:py-1 rounded-lg bg-neutral-900 hover:bg-amber-500/10 border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-amber-300 flex items-center gap-1 text-xs transition-colors"
                    title="View Bolex Plus perks: Continuous voice dictation, turbo inference, and deep reasoning"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px] font-medium">Bolex Plus</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-neutral-400">
                Enter ↵ to send
              </span>

              {isLoading ? (
                <button
                  id="stop-generation-btn"
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                  title="Stop response"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  id="send-message-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={(!inputText.trim() && !attachedImage) || disabled}
                  className={`p-2 rounded-lg transition-all ${
                    inputText.trim() || attachedImage
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-xs cursor-pointer'
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
      </div>
    </div>
  );
}
