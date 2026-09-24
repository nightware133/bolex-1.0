import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Sliders, 
  ShieldCheck, 
  Chrome,
  Volume2,
  Play,
  VolumeX,
  Gauge,
  Headphones,
  Activity,
  FileCode2,
  Sparkles,
  Palette,
  Sun,
  Moon,
  Laptop,
  Monitor
} from 'lucide-react';
import { speechManager } from '../lib/speechManager';
import { ChatSession } from '../types';
import { TokenUsageAnalytics } from './TokenUsageAnalytics';
import { useTheme } from '../context/ThemeContext';

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
  sessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (id: string) => void;
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
  sessions = [],
  activeSessionId,
  onSelectSession,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'analytics' | 'voice' | 'model'>('appearance');
  const [localTemp, setLocalTemp] = useState(temperature);
  const [localPrompt, setLocalPrompt] = useState(customSystemPrompt);
  const [speechState, setSpeechState] = useState(() => speechManager.getState());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);

  const { themeMode, resolvedTheme, setThemeMode, systemPreference } = useTheme();

  useEffect(() => {
    setLocalTemp(temperature);
    setLocalPrompt(customSystemPrompt);
  }, [temperature, customSystemPrompt]);

  useEffect(() => {
    const unsub = speechManager.subscribe((st) => setSpeechState(st));
    
    // Load voices
    const loadVoices = () => {
      const v = speechManager.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      unsub();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTemperature(localTemp);
    onSaveCustomPrompt(localPrompt);
    onClose();
  };

  const handleTestSpeech = () => {
    if (isTestingSpeech) {
      speechManager.stop();
      setIsTestingSpeech(false);
      return;
    }

    setIsTestingSpeech(true);
    speechManager.speak(
      'settings-voice-test',
      `Bolex Web Speech audio engine test. Speech rate is set to ${speechState.rate}x.`
    );

    const check = setInterval(() => {
      const current = speechManager.getState();
      if (current.status === 'idle') {
        setIsTestingSpeech(false);
        clearInterval(check);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Assistant Settings &amp; Analytics</h3>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 border-b border-neutral-800 bg-neutral-900/60 overflow-x-auto">
          <button
            id="tab-appearance-btn"
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'appearance'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme &amp; Appearance</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono capitalize">
              {themeMode === 'system' ? 'Auto OS' : themeMode}
            </span>
          </button>

          <button
            id="tab-token-analytics-btn"
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Token Usage &amp; History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Recharts
            </span>
          </button>

          <button
            id="tab-model-prefs-btn"
            type="button"
            onClick={() => setActiveTab('model')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'model'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Model &amp; System Prompt</span>
          </button>

          <button
            id="tab-voice-speech-btn"
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'voice'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Web Speech Voice</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {/* TAB 0: THEME & APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Interface Theme &amp; Color Scheme</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Bolex automatically detects your operating system's light or dark mode preference on load and adjusts seamlessly in real time. Use the options below for manual override.
                  </p>
                </div>

                {/* 3 Theme Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Option 1: Auto (System OS) */}
                  <button
                    id="theme-option-system-btn"
                    type="button"
                    onClick={() => setThemeMode('system')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      themeMode === 'system'
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-neutral-800 text-amber-400">
                        <Laptop className="w-4 h-4" />
                      </div>
                      {themeMode === 'system' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Auto (System OS)</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Syncs with OS ({systemPreference === 'dark' ? 'Dark' : 'Light'})
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Dark Theme */}
                  <button
                    id="theme-option-dark-btn"
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-purple-500/15 border-purple-500/80 text-purple-300 ring-1 ring-purple-500/40 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-neutral-800 text-purple-400">
                        <Moon className="w-4 h-4" />
                      </div>
                      {themeMode === 'dark' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-500/25 text-purple-300 border border-purple-500/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Dark Theme</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Deep obsidian contrast
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Light Theme */}
                  <button
                    id="theme-option-light-btn"
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-neutral-800 text-amber-400">
                        <Sun className="w-4 h-4" />
                      </div>
                      {themeMode === 'light' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Light Theme</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Clean daylight contrast
                      </div>
                    </div>
                  </button>
                </div>

                {/* Status & Live Preference Detection Banner */}
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Theme: <strong className="text-white capitalize">{resolvedTheme} Mode</strong></span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    OS Preference Detected: <strong className="text-amber-300 capitalize">{systemPreference}</strong> ({themeMode === 'system' ? 'Synced' : 'Overridden'})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: TOKEN USAGE & ANALYTICS VISUALIZATION */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <TokenUsageAnalytics
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                  onSelectSession?.(id);
                  onClose();
                }}
              />
            </div>
          )}

          {/* TAB 2: MODEL & SYSTEM PROMPT */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              {/* Unpaid / Free API Key Guide Banner */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>API Key &amp; Free Tier Compatibility</span>
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
                  <strong className="text-white font-medium">Does Bolex need an API key?</strong> Yes, Bolex communicates with the cloud intelligence engine through Gemini endpoints.
                </p>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  <strong className="text-white font-medium">Does an unpaid key work?</strong> <span className="text-emerald-300 font-medium">Yes, 100%!</span> Bolex supports standard free tier quota.
                </p>

                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-neutral-200 font-medium">How to connect:</span>{' '}
                    Keys in AI Studio are managed via the platform's <strong className="text-neutral-200">Settings &gt; Secrets</strong> menu (<code className="text-amber-300 font-mono text-[11px]">GEMINI_API_KEY</code>).
                  </div>
                </div>
              </div>

              {/* Temperature Control */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="temperature-slider" className="text-xs font-semibold text-neutral-200">
                    Creativity &amp; Temperature
                  </label>
                  <span className="font-mono text-xs text-amber-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
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

              {/* Custom System Prompt */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-system-prompt" className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Custom System Instructions (Active Session)</span>
                  </label>
                </div>
                <textarea
                  id="custom-system-prompt"
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g., Always respond with concise bullet points and provide code examples in TypeScript..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs focus:outline-hidden focus:border-amber-500/50 resize-none font-mono"
                />
                <div className="text-[11px] text-neutral-400">
                  Appended to persona instructions to customize answers for this chat.
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
          )}

          {/* TAB 3: WEB SPEECH NARRATION */}
          {activeTab === 'voice' && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                  <Volume2 className="w-4 h-4" />
                  <span>Web Speech API Narration</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestSpeech}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isTestingSpeech
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                      : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {isTestingSpeech ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Voice</span>
                    </>
                  )}
                </button>
              </div>

              {/* Auto-Narrate Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-850">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-neutral-200">Auto-Narrate Responses</div>
                    <div className="text-[11px] text-neutral-400">Automatically read AI answers aloud when completed</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speechManager.setAutoNarrate(!speechState.autoNarrate)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    speechState.autoNarrate ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      speechState.autoNarrate ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* AI Narration Pace / Read Speed Slider */}
              <div className="space-y-2.5 p-3 rounded-lg bg-neutral-900 border border-neutral-850">
                <div className="flex items-center justify-between">
                  <label htmlFor="speech-rate-slider" className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>Narration Pace &amp; Read Speed</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400">
                      {speechState.rate <= 0.75
                        ? 'Slow'
                        : speechState.rate <= 0.95
                        ? 'Relaxed'
                        : speechState.rate <= 1.05
                        ? 'Normal'
                        : speechState.rate <= 1.35
                        ? 'Brisk'
                        : speechState.rate <= 1.75
                        ? 'Fast'
                        : 'Ultra Fast'}
                    </span>
                    <span className="font-mono text-amber-400 text-xs px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-semibold">
                      {speechState.rate.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  id="speech-rate-slider"
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={speechState.rate}
                  onChange={(e) => speechManager.setReadSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.5x (Brisk)</span>
                  <span>2.0x (Fast)</span>
                  <span>2.5x (Ultra)</span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="pt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 font-medium mr-1">Presets:</span>
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => speechManager.setReadSpeed(rate)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                        Math.abs(speechState.rate - rate) < 0.02
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-xs'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-850'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selector if browser has multiple voices */}
              {availableVoices.length > 0 && (
                <div className="space-y-1 text-xs">
                  <label className="text-neutral-300 font-medium">Synthesizer Voice</label>
                  <select
                    value={speechState.voiceURI}
                    onChange={(e) => speechManager.setVoiceURI(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs focus:outline-hidden focus:border-amber-500/50"
                  >
                    <option value="">Default System Natural Voice</option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Bolex Intelligence &amp; Analytics Dashboard</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="cancel-settings-btn"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Close
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
    </div>
  );
}
