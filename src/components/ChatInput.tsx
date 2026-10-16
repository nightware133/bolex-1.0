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
  Lock,
  ClipboardPaste,
  ShieldCheck,
  Check,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ImageAttachment, ContextualAnchor } from '../types';
import { AI_MODELS } from '../constants';
import { useAuth, PlanTier } from '../context/AuthContext';
import { findMatchingAnchors } from '../lib/anchors';
import { sanitizeAntiCopyText, readCleanClipboard } from '../lib/clipboardSanitizer';

export interface VoiceTierConfig {
  tier: PlanTier;
  name: string;
  minutes: number;
  totalSeconds: number;
  badgeClass: string;
}

export const VOICE_TIER_CONFIGS: Record<PlanTier, VoiceTierConfig> = {
  free: {
    tier: 'free',
    name: 'Free Plan',
    minutes: 2,
    totalSeconds: 2 * 60, // 120s
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  },
  plus: {
    tier: 'plus',
    name: 'Bolex Plus',
    minutes: 4,
    totalSeconds: 4 * 60, // 240s
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  ultra: {
    tier: 'ultra',
    name: 'Bolex Ultra',
    minutes: 7,
    totalSeconds: 7 * 60, // 420s
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  quantum: {
    tier: 'quantum',
    name: 'Quantum Infinity',
    minutes: 16,
    totalSeconds: 16 * 60, // 960s
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
};

interface ChatInputProps {
  onSendMessage: (text: string, images?: ImageAttachment | ImageAttachment[]) => void;
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

export const MAX_IMAGES = 6;

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
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const attachedImage = attachedImages[0] || null;
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Smart Anti-Copy Clipboard Protection & Paste-on-Focus Prompt State
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);
  const [detectedClipboard, setDetectedClipboard] = useState<{
    text: string;
    wasCleaned: boolean;
    snippet: string;
  } | null>(null);
  const lastDismissedClipboardRef = useRef<string>('');

  const [pasteOnFocusEnabled, setPasteOnFocusEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('bolex_paste_on_focus_enabled');
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  });

  // Sync settings event when toggled in Settings Modal
  useEffect(() => {
    const handleSettingChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setPasteOnFocusEnabled(e.detail);
      }
    };
    window.addEventListener('bolex_paste_on_focus_changed', handleSettingChange);
    return () => window.removeEventListener('bolex_paste_on_focus_changed', handleSettingChange);
  }, []);

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
  const activeVoiceTier = VOICE_TIER_CONFIGS[effectiveTier] || VOICE_TIER_CONFIGS.free;

  // Active voice recording countdown & timer state
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const isLimitReached = effectiveTier === 'free' && !isTrialActive && sessionTokens >= 60;

  const remainingSeconds = Math.max(0, activeVoiceTier.totalSeconds - recordingSeconds);
  const progressPercent = Math.min(100, Math.max(0, (recordingSeconds / activeVoiceTier.totalSeconds) * 100));
  const isNearLimit = remainingSeconds <= 30;
  const isCriticalLimit = remainingSeconds <= 10;

  const formatVoiceTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cleanup speech recognition and timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
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
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
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
    setRecordingSeconds(0);
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
        setRecordingSeconds(0);
        recordingStartTimeRef.current = Date.now();

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        recordingTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingSeconds(elapsed);

          // Check if user reached their tier's recording limit
          if (elapsed >= activeVoiceTier.totalSeconds) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
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
            setRecordingSeconds(activeVoiceTier.totalSeconds);
            setVoiceNotice(
              `⏱️ ${activeVoiceTier.name} voice cap reached (${activeVoiceTier.minutes} mins max). Your speech was captured safely! Upgrade to increase recording time.`
            );
            setTimeout(() => setVoiceNotice(null), 7000);
          }
        }, 500);
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
        stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError('Microphone permission denied or unavailable.');
      stopListening();
    }
  };

  const processFilesAsImages = async (fileList: FileList | File[]): Promise<ImageAttachment[]> => {
    const files = Array.from(fileList);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return [];

    const promises = imageFiles.map((file, idx) => {
      return new Promise<ImageAttachment | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            const commaIndex = result.indexOf(',');
            const base64Data = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;
            resolve({
              mimeType: file.type || 'image/png',
              data: base64Data,
              previewUrl: result,
              name: file.name && file.name !== 'image.png' ? file.name : `Image_${Date.now()}_${idx + 1}.png`,
            });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean) as ImageAttachment[];
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachedImages.length === 0) || isLoading || disabled || isLimitReached) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(inputText.trim(), attachedImages.length > 0 ? attachedImages : undefined);
    setInputText('');
    setAttachedImages([]);
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Collect all image files from clipboardData.items (screenshots or copied picture files)
    const filePromises: Promise<ImageAttachment | null>[] = [];
    const items = clipboardData.items;

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            filePromises.push(
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const result = event.target?.result as string;
                  if (result) {
                    const commaIndex = result.indexOf(',');
                    const base64Data = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;
                    resolve({
                      mimeType: file.type || 'image/png',
                      data: base64Data,
                      previewUrl: result,
                      name: file.name && file.name !== 'image.png'
                        ? file.name
                        : `Pasted_Image_${Date.now()}_${i + 1}.png`,
                    });
                  } else {
                    resolve(null);
                  }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
              })
            );
          }
        }
      }
    }

    // 2. Also check HTML for embedded inline base64 images if no direct file items found
    const htmlData = clipboardData.getData('text/html');
    if (htmlData && filePromises.length === 0) {
      const imgRegex = /<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/gi;
      let match;
      let imgCount = 0;
      while ((match = imgRegex.exec(htmlData)) !== null) {
        imgCount++;
        const dataUrl = match[1];
        const mimeMatch = dataUrl.match(/^data:(image\/[^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const commaIdx = dataUrl.indexOf(',');
        const base64 = dataUrl.slice(commaIdx + 1);
        filePromises.push(
          Promise.resolve({
            mimeType,
            data: base64,
            previewUrl: dataUrl,
            name: `Embedded_Image_${Date.now()}_${imgCount}.png`,
          })
        );
        if (imgCount >= MAX_IMAGES) break;
      }
    }

    // 3. Extract text from clipboard
    const rawPastedText = clipboardData.getData('text/plain') || clipboardData.getData('text') || '';
    const hasText = Boolean(rawPastedText && rawPastedText.length > 0);
    const sanitized = sanitizeAntiCopyText(rawPastedText);
    const textToInsert = sanitized.cleanedText;

    // If there is text to insert, always insert it cleanly into the prompt
    if (hasText) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const newText = inputText.slice(0, start) + textToInsert + inputText.slice(end);
      setInputText(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + textToInsert.length;
          textareaRef.current.selectionEnd = start + textToInsert.length;
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
      }, 0);
    }

    // If there are image attachments to process
    if (filePromises.length > 0) {
      e.preventDefault();
      const resolved = (await Promise.all(filePromises)).filter(Boolean) as ImageAttachment[];
      if (resolved.length > 0) {
        setAttachedImages((prev) => {
          const remaining = MAX_IMAGES - prev.length;
          if (remaining <= 0) {
            setPasteNotification(`⚠️ Maximum ${MAX_IMAGES} pictures already attached.`);
            setTimeout(() => setPasteNotification(null), 4000);
            return prev;
          }
          const toAdd = resolved.slice(0, remaining);
          const next = [...prev, ...toAdd];

          if (hasText) {
            setPasteNotification(
              `✨ 📷 Attached ${toAdd.length} picture${toAdd.length > 1 ? 's' : ''} & pasted your words! Ready for Vision AI.`
            );
          } else {
            setPasteNotification(
              `📷 Attached ${toAdd.length} picture${toAdd.length > 1 ? 's' : ''} from clipboard! (${next.length}/${MAX_IMAGES} pictures ready)`
            );
          }
          setTimeout(() => setPasteNotification(null), 4500);
          return next;
        });
        return;
      }
    }

    // Only text was pasted
    if (hasText) {
      if (sanitized.wasCleaned) {
        setPasteNotification('✨ Cleansed anti-copy warning and pasted clean text!');
      } else {
        setPasteNotification('✨ Pasted text!');
      }
      setTimeout(() => setPasteNotification(null), 3000);
    }
  };

  const handleAutoPaste = async () => {
    const res = await readCleanClipboard();
    if (res.error) {
      setPasteNotification(`Clipboard notice: ${res.error}`);
      setTimeout(() => setPasteNotification(null), 3000);
      return;
    }

    if (!res.text) {
      setPasteNotification('Clipboard is empty.');
      setTimeout(() => setPasteNotification(null), 3000);
      return;
    }

    setInputText((prev) => (prev ? `${prev}\n${res.text}` : res.text));
    if (res.wasCleaned) {
      setPasteNotification('✨ Auto-pasted clean text (removed anti-copy warning)!');
    } else {
      setPasteNotification('✨ Auto-pasted clipboard text!');
    }
    setTimeout(() => setPasteNotification(null), 4000);

    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
          textareaRef.current.focus();
        }
      }, 50);
    }
  };

  const checkClipboardOnFocus = async () => {
    if (!pasteOnFocusEnabled) return;

    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;

      const res = await readCleanClipboard();
      if (!res.text || res.text.trim().length < 3) return;

      const cleanCandidate = res.text.trim();
      // If already contained in prompt or dismissed for this exact text, skip
      if (inputText.includes(cleanCandidate) || lastDismissedClipboardRef.current === cleanCandidate) {
        return;
      }

      setDetectedClipboard({
        text: cleanCandidate,
        wasCleaned: res.wasCleaned,
        snippet: cleanCandidate.replace(/\s+/g, ' ').slice(0, 85),
      });
    } catch {
      // Ignore transient clipboard access restrictions
    }
  };

  const handleInsertDetectedClipboard = () => {
    if (!detectedClipboard) return;
    const toInsert = detectedClipboard.text;
    setInputText((prev) => (prev ? `${prev}\n${toInsert}` : toInsert));
    lastDismissedClipboardRef.current = toInsert;
    const wasCleaned = detectedClipboard.wasCleaned;
    setDetectedClipboard(null);
    setPasteNotification(
      wasCleaned
        ? '✨ Cleaned anti-copy warning & inserted into prompt!'
        : '✨ Inserted clipboard text into prompt!'
    );
    setTimeout(() => setPasteNotification(null), 3500);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleDismissDetectedClipboard = () => {
    if (detectedClipboard) {
      lastDismissedClipboardRef.current = detectedClipboard.text;
    }
    setDetectedClipboard(null);
  };

  const togglePasteOnFocus = () => {
    const next = !pasteOnFocusEnabled;
    setPasteOnFocusEnabled(next);
    try {
      localStorage.setItem('bolex_paste_on_focus_enabled', String(next));
      window.dispatchEvent(new CustomEvent('bolex_paste_on_focus_changed', { detail: next }));
    } catch {
      // ignore
    }
    setPasteNotification(
      next
        ? '✨ Paste-on-Focus Auto-Detection Enabled!'
        : 'Paste-on-Focus Auto-Detection Disabled'
    );
    setTimeout(() => setPasteNotification(null), 3000);
  };

  // Window Focus listener for paste-on-focus clipboard detection
  useEffect(() => {
    if (!pasteOnFocusEnabled) {
      setDetectedClipboard(null);
      return;
    }

    const onFocusWindow = () => {
      setTimeout(checkClipboardOnFocus, 120);
    };

    window.addEventListener('focus', onFocusWindow);
    return () => window.removeEventListener('focus', onFocusWindow);
  }, [pasteOnFocusEnabled, inputText]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - attachedImages.length;
    if (remaining <= 0) {
      setPasteNotification(`⚠️ Maximum ${MAX_IMAGES} pictures already attached.`);
      setTimeout(() => setPasteNotification(null), 4000);
      e.target.value = '';
      return;
    }

    const newAttachments = await processFilesAsImages(files);
    if (newAttachments.length === 0) {
      setPasteNotification('⚠️ Please select valid image files (PNG, JPEG, WebP, GIF).');
      setTimeout(() => setPasteNotification(null), 4000);
      e.target.value = '';
      return;
    }

    setAttachedImages((prev) => {
      const slots = MAX_IMAGES - prev.length;
      const toAdd = newAttachments.slice(0, slots);
      const next = [...prev, ...toAdd];
      setPasteNotification(`📷 Attached ${toAdd.length} picture${toAdd.length > 1 ? 's' : ''}! (${next.length}/${MAX_IMAGES} ready)`);
      setTimeout(() => setPasteNotification(null), 4000);
      return next;
    });

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
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (!files || files.length === 0) return;

            const remaining = MAX_IMAGES - attachedImages.length;
            if (remaining <= 0) {
              setPasteNotification(`⚠️ Maximum ${MAX_IMAGES} pictures already attached.`);
              setTimeout(() => setPasteNotification(null), 4000);
              return;
            }

            const newAttachments = await processFilesAsImages(files);
            if (newAttachments.length > 0) {
              setAttachedImages((prev) => {
                const slots = MAX_IMAGES - prev.length;
                const toAdd = newAttachments.slice(0, slots);
                const next = [...prev, ...toAdd];
                setPasteNotification(`📷 Attached ${toAdd.length} picture${toAdd.length > 1 ? 's' : ''}! (${next.length}/${MAX_IMAGES} ready)`);
                setTimeout(() => setPasteNotification(null), 4000);
                return next;
              });
            }
          }}
          className={`w-full rounded-3xl bg-neutral-900/90 border transition-all shadow-2xl backdrop-blur-md overflow-hidden ${
            isDragging 
              ? 'border-amber-400 bg-amber-500/10' 
              : 'border-neutral-700/70 focus-within:border-neutral-500'
          }`}
        >
          {/* Active Voice Listening Banner with Visual Progress Bar & Countdown Timer */}
          {isListening && (
            <div className="bg-neutral-950/95 border-b border-rose-500/30 overflow-hidden text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-bold text-rose-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      Listening to Voice...
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${activeVoiceTier.badgeClass}`}>
                      {activeVoiceTier.name} ({activeVoiceTier.minutes}m cap)
                    </span>
                    {interimTranscript && (
                      <span className="text-neutral-300 italic truncate max-w-xs text-[11px]">
                        "{interimTranscript}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {/* Countdown Timer with Dynamic Warning States */}
                  <div 
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold transition-all ${
                      isCriticalLimit
                        ? 'bg-rose-500/30 border-rose-500/60 text-rose-200 animate-bounce'
                        : isNearLimit
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                    }`}
                    title={`${formatVoiceTime(recordingSeconds)} elapsed of ${formatVoiceTime(activeVoiceTier.totalSeconds)} maximum`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isNearLimit ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span>{formatVoiceTime(remainingSeconds)} left</span>
                    <span className="text-[10px] text-neutral-400 font-sans font-normal hidden xs:inline">
                      ({formatVoiceTime(recordingSeconds)} / {formatVoiceTime(activeVoiceTier.totalSeconds)})
                    </span>
                  </div>

                  {effectiveTier !== 'quantum' && onOpenBolexPlus && (
                    <button
                      type="button"
                      onClick={onOpenBolexPlus}
                      className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 hover:text-amber-200 font-semibold cursor-pointer transition-colors hidden md:inline-flex items-center gap-1"
                      title="Upgrade plan for up to 16 minutes continuous dictation"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Upgrade for 16m</span>
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={stopListening}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Finish voice recording"
                  >
                    Stop & Keep
                  </button>
                </div>
              </div>

              {/* Visual Progress Bar Track & Fill */}
              <div 
                className="w-full h-1.5 bg-neutral-850 relative overflow-hidden" 
                role="progressbar" 
                aria-valuenow={progressPercent} 
                aria-valuemin={0} 
                aria-valuemax={100}
              >
                <div 
                  className={`h-full transition-all duration-300 ease-linear ${
                    isCriticalLimit
                      ? 'bg-rose-500 animate-pulse'
                      : isNearLimit
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Voice Notice Toast when Cap Reached */}
          {voiceNotice && (
            <div className="mx-3 sm:mx-4 mt-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 min-w-0 font-medium">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{voiceNotice}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {effectiveTier !== 'quantum' && onOpenBolexPlus && (
                  <button
                    type="button"
                    onClick={onOpenBolexPlus}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] cursor-pointer transition-colors"
                  >
                    Upgrade Tier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Attached Images Multi-Gallery Preview (Up to 6 images) */}
          {attachedImages.length > 0 && (
            <div className="mx-3 sm:mx-4 mt-2 p-3 rounded-2xl bg-neutral-950/95 border border-amber-500/40 shadow-xl animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vision Attachments ({attachedImages.length}/{MAX_IMAGES})</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    👁️ {attachedImages.length > 1 ? `${attachedImages.length} Pictures Ready` : 'Vision AI Ready'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {attachedImages.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more (up to {MAX_IMAGES})</span>
                    </button>
                  )}
                  {attachedImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAttachedImages([])}
                      className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Gallery Strip of Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {attachedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group/thumb relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-900 shadow-md transition-all hover:border-amber-400/80"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name || `Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Index badge */}
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-amber-300 border border-white/10">
                      {idx + 1}
                    </span>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                      title="Remove this picture"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {/* Title tooltip on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <p className="text-[9px] text-neutral-200 truncate">
                        {img.name || `Picture ${idx + 1}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-neutral-400 pt-0.5">
                <span>
                  Bolex will see, read, transcribe, and analyze all {attachedImages.length} image{attachedImages.length > 1 ? 's' : ''} with your prompt
                </span>
                <span className="text-amber-400 font-mono text-[10px]">
                  {MAX_IMAGES - attachedImages.length} slot{MAX_IMAGES - attachedImages.length !== 1 ? 's' : ''} left
                </span>
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

          {/* Paste-on-Focus Interactive Clipboard Prompt Banner */}
          {detectedClipboard && (
            <div className="mx-3 sm:mx-4 mt-2 p-2.5 sm:p-3 rounded-2xl bg-neutral-950/95 border border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2 z-20">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-white">Paste copied text into prompt?</span>
                    {detectedClipboard.wasCleaned && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ✨ Anti-copy warning removed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-300 italic truncate max-w-xs sm:max-w-md mt-0.5">
                    "{detectedClipboard.snippet}..."
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleDismissDetectedClipboard}
                  className="px-2.5 py-1 rounded-lg text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleInsertDetectedClipboard}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert Text</span>
                </button>
              </div>
            </div>
          )}

          {/* Anti-Copy Protection & Auto-Paste Notification Toast */}
          {pasteNotification && (
            <div className="mx-4 mt-2 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-1.5 min-w-0 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{pasteNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setPasteNotification(null)}
                className="text-neutral-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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

          {/* Main Textarea with Anti-Copy Clean Paste Interceptor */}
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
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to microphone...'
                : attachedImages.length > 1
                ? `Ask anything about these ${attachedImages.length} pictures (compare, analyze, transcribe)...`
                : attachedImages.length === 1
                ? 'Ask anything about this picture...'
                : 'Message Bolex...'
            }
            disabled={disabled}
            className="w-full px-4 pt-3.5 pb-2 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 resize-none focus:outline-hidden leading-relaxed"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
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
                title={`Attach pictures for vision reasoning (up to ${MAX_IMAGES})`}
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Auto Paste Clean Clipboard Button */}
              <button
                id="auto-paste-clean-btn"
                type="button"
                onClick={handleAutoPaste}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-200 hover:text-emerald-100 cursor-pointer shadow-xs"
                title="Auto Paste clean clipboard text (automatically removes anti-copy warnings)"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold">Auto Paste</span>
              </button>

              {/* Paste-on-Focus Auto-Detection Toggle */}
              <button
                id="toggle-autopaste-focus-btn"
                type="button"
                onClick={togglePasteOnFocus}
                className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  pasteOnFocusEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                title={
                  pasteOnFocusEnabled
                    ? 'Paste-on-Focus Auto-Detection is ON (prompts to insert copied text when focusing window)'
                    : 'Turn ON Paste-on-Focus Auto-Detection'
                }
              >
                <ShieldCheck className="w-3.5 h-3.5" />
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
                className={`p-2 rounded-full transition-all flex items-center justify-center relative cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={
                  isListening
                    ? `Recording active (${formatVoiceTime(remainingSeconds)} remaining of ${activeVoiceTier.minutes}m cap) - Click to stop`
                    : `Voice dictation (${activeVoiceTier.name}: ${activeVoiceTier.minutes}m cap, up to 16m on Quantum)`
                }
              >
                {isListening && (
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-500 text-[8.5px] font-mono font-bold text-white leading-none shadow-xs">
                    {formatVoiceTime(remainingSeconds)}
                  </span>
                )}
                <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse text-rose-400' : ''}`} />
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
                  disabled={(!inputText.trim() && attachedImages.length === 0) || disabled}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() || attachedImages.length > 0
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
