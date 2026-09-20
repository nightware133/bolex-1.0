import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Sliders, 
  FileCode, 
  ShieldCheck, 
  ExternalLink,
  Chrome
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  onSaveTemperature: (temp: number) => void;
  customSystemPrompt: string;
  onSaveCustomPrompt: (prompt: string) => void;
  isBackendConnected: boolean;
  statusMessage: string;
  onOpenExtension?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  temperature,
  onSaveTemperature,
  customSystemPrompt,
  onSaveCustomPrompt,
  isBackendConnected,
  statusMessage,
  onOpenExtension,
}: SettingsModalProps) {
  const [localTemp, setLocalTemp] = useState(temperature);
  const [localPrompt, setLocalPrompt] = useState(customSystemPrompt);

  useEffect(() => {
    setLocalTemp(temperature);
    setLocalPrompt(customSystemPrompt);
  }, [temperature, customSystemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTemperature(localTemp);
    onSaveCustomPrompt(localPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Assistant & Engine Settings</h3>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Unpaid / Free API Key Guide Banner */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                <KeyRound className="w-4 h-4" />
                <span>API Key & Free Tier Compatibility</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  isBackendConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isBackendConnected ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Key Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Setup via Settings</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-neutral-300 text-xs leading-relaxed">
              <strong className="text-white font-medium">Does Bolex need an API key?</strong> Yes, Bolex uses an API key to communicate with the cloud intelligence engine.
            </p>
            <p className="text-neutral-300 text-xs leading-relaxed">
              <strong className="text-white font-medium">Does an unpaid key work?</strong> <span className="text-emerald-300 font-medium">Yes, 100%!</span> Bolex supports the standard free quota tier. You do <em>not</em> need paid billing or a credit card.
            </p>

            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-neutral-200 font-medium">How to connect:</span>{' '}
                Keys in AI Studio are managed via the platform's <strong className="text-neutral-200">Settings &gt; Secrets</strong> menu (<code className="text-amber-300 font-mono text-[11px]">GEMINI_API_KEY</code>). It is automatically and securely handled on the backend.
              </div>
            </div>
          </div>

          {/* Temperature Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="temperature-slider" className="text-xs font-semibold text-neutral-200">
                Creativity & Temperature
              </label>
              <span className="font-mono text-xs text-amber-400 px-2 py-0.5 rounded bg-neutral-800">
                {localTemp.toFixed(2)}
              </span>
            </div>
            <input
              id="temperature-slider"
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={localTemp}
              onChange={(e) => setLocalTemp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>0.0 (Precise / Code)</span>
              <span>0.7 (Balanced)</span>
              <span>1.5 (Creative)</span>
            </div>
          </div>

          {/* Browser Extension Promo */}
          {onOpenExtension && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Chrome className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Browser Extension Package</div>
                  <div className="text-[11px] text-neutral-400">Install Bolex directly in Chrome, Edge, or Brave</div>
                </div>
              </div>
              <button
                id="settings-open-extension-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExtension();
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-amber-400 hover:text-amber-300 text-xs font-medium border border-neutral-700 transition-colors shrink-0"
              >
                Get Extension
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-end gap-2">
          <button
            id="cancel-settings-btn"
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-settings-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
