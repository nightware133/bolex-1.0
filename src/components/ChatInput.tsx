import React, { useRef, useState } from 'react';
import { 
  ArrowUp, 
  Image as ImageIcon, 
  Globe, 
  X, 
  Square,
  Paperclip
} from 'lucide-react';
import { ImageAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, image?: ImageAttachment) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  enableSearch,
  onToggleSearch,
  disabled,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      // split data:image/png;base64,DATA
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
    // reset input
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
          className={`relative rounded-xl border bg-neutral-950 transition-all ${
            isDragging
              ? 'border-amber-400/80 bg-neutral-900/90 ring-2 ring-amber-400/30'
              : 'border-neutral-800 focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-amber-500/20'
          }`}
        >
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
              // auto resize
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedImage
                ? 'Ask a question or provide instructions about this image...'
                : 'Ask anything, draft code, or brainstorm ideas...'
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
