import { useState } from 'react';
import { 
  Chrome, 
  Download, 
  X, 
  Check, 
  Copy, 
  FolderDown, 
  Layers, 
  Sparkles,
  ExternalLink,
  Keyboard,
  ShieldCheck
} from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionModal({ isOpen, onClose }: ExtensionModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'edge' | 'manifest'>('chrome');

  if (!isOpen) return null;

  const handleCopyShortcut = () => {
    navigator.clipboard.writeText('Ctrl+Shift+B');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Chrome className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Bolex Browser Extension</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Chrome & Edge Ready
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Use Bolex in any browser tab, sidebar, or quick popup
              </p>
            </div>
          </div>
          <button
            id="close-extension-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950/40 text-xs">
          <button
            id="ext-tab-chrome"
            type="button"
            onClick={() => setActiveTab('chrome')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'chrome'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span>Google Chrome & Brave</span>
          </button>
          <button
            id="ext-tab-edge"
            type="button"
            onClick={() => setActiveTab('edge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'edge'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Microsoft Edge</span>
          </button>
          <button
            id="ext-tab-manifest"
            type="button"
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'manifest'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Manifest V3 Details</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Download Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white text-sm">Download Bolex Extension Package (.ZIP)</span>
              </div>
              <p className="text-xs text-neutral-300">
                Ready-to-install Manifest V3 extension bundle with sidebar assistant and shortcut support.
              </p>
            </div>
            <a
              id="download-extension-zip-btn"
              href="/bolex-extension.zip"
              download="bolex-extension.zip"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download .ZIP</span>
            </a>
          </div>

          {/* Installation Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              3-Step Installation Guide (Under 30 Seconds)
            </h4>

            <div className="space-y-2.5 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div className="space-y-1">
                  <span className="font-medium text-white">Unzip the downloaded package</span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Click the download button above, right-click the downloaded <code className="px-1 py-0.5 bg-neutral-900 rounded text-amber-300 font-mono text-[10px]">bolex-extension.zip</code>, and select <strong>"Extract All"</strong> (or double click on Mac).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div className="space-y-1">
                  <span className="font-medium text-white">Open your browser Extensions management page</span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Navigate to{' '}
                    <code className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-amber-300 font-mono text-[11px]">
                      {activeTab === 'edge' ? 'edge://extensions' : 'chrome://extensions'}
                    </code>{' '}
                    and toggle on <strong>"Developer mode"</strong> in the top-right corner.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div className="space-y-1">
                  <span className="font-medium text-white">Click "Load unpacked"</span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Click the <strong>"Load unpacked"</strong> button in your browser and select the extracted folder. Bolex will immediately appear in your browser toolbar!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Features / Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5">
              <Keyboard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-medium text-white flex items-center gap-1.5">
                  <span>Quick Keyboard Shortcut</span>
                  <button
                    type="button"
                    onClick={handleCopyShortcut}
                    className="text-neutral-400 hover:text-white"
                    title="Copy shortcut"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 font-mono text-[10px]">Ctrl+Shift+B</kbd> (or <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 font-mono text-[10px]">Cmd+Shift+B</kbd>) from any website to invoke Bolex instantly.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-medium text-white">Manifest V3 & Privacy Safe</span>
                <p className="text-[11px] text-neutral-400">
                  Uses modern Chrome SidePanel API. Runs directly in your browser with local session security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Check className="w-3.5 h-3.5 text-amber-400" />
            <span>Works alongside all your web browsing tabs</span>
          </div>
          <button
            id="close-ext-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
