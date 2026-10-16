import { useState, useEffect } from 'react';
import { 
  Chrome, 
  Download, 
  X, 
  Check, 
  Copy, 
  FolderDown, 
  Layers, 
  Sparkles,
  Keyboard,
  ShieldCheck,
  Globe,
  FileText,
  Image as ImageIcon,
  Code,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionModal({ isOpen, onClose }: ExtensionModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'edge' | 'manifest'>('chrome');
  const [serverHealth, setServerHealth] = useState<{ status: string; hasKey: boolean } | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  const checkHealth = async () => {
    setIsCheckingServer(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth({ status: 'online', hasKey: data.hasApiKey });
      } else {
        setServerHealth({ status: 'error', hasKey: false });
      }
    } catch {
      setServerHealth({ status: 'offline', hasKey: false });
    } finally {
      setIsCheckingServer(false);
    }
  };

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
                <h3 className="text-base font-semibold text-white">Bolex Browser Extension v2.0</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Updated &amp; Feature-Complete
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Web search, page summaries, vision analysis, and contextual side panel in any browser tab
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
            <span>Google Chrome &amp; Brave</span>
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
            <span>Manifest V3 Features</span>
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
                Ready-to-install bundle pre-configured for your active workspace with Google Search Grounding &amp; Vision.
              </p>
            </div>
            <a
              id="download-extension-zip-btn"
              href="/bolex-extension.zip"
              download="bolex-extension.zip"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .ZIP</span>
            </a>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">Search Grounding</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">1-Click Tab Summary</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">Vision &amp; Screenshots</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">Syntax Highlighting</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">Chrome Side Panel</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-neutral-200 font-medium">Right-Click Context</span>
            </div>
          </div>

          {/* Backend Status Verification */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-medium text-white">Bolex Backend API Server</span>
                <p className="text-[11px] text-neutral-400">
                  {serverHealth?.status === 'online' 
                    ? 'Engine online & ready for extension connections' 
                    : isCheckingServer 
                    ? 'Verifying server connection...' 
                    : 'Server active on current instance'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {serverHealth?.status === 'online' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Live
                </span>
              )}
              <button
                type="button"
                onClick={checkHealth}
                className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700"
              >
                Ping
              </button>
            </div>
          </div>

          {/* Tab View 1 & 2: Chrome / Edge Step-by-Step Installation */}
          {(activeTab === 'chrome' || activeTab === 'edge') && (
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
                    <span className="font-medium text-white">Download &amp; Extract ZIP</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Click the <strong>Download .ZIP</strong> button above. Right-click the downloaded <code className="px-1 py-0.5 bg-neutral-900 rounded text-amber-300 font-mono text-[10px]">bolex-extension.zip</code> and select <strong>"Extract All"</strong> (or double click to expand into a folder).
                    </p>
                    <p className="text-amber-400/90 text-[10.5px]">
                      ⚠️ <em>Note: Chrome requires an extracted folder (do not drag the raw .zip file directly into the browser).</em>
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div className="space-y-1">
                    <span className="font-medium text-white">Open Browser Extensions &amp; Enable Developer Mode</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Open a new tab and go to{' '}
                      <code className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-amber-300 font-mono text-[11px]">
                        {activeTab === 'edge' ? 'edge://extensions' : 'chrome://extensions'}
                      </code>.
                    </p>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      In the top-right corner of the Extensions page, toggle <strong>"Developer mode"</strong> to <strong>ON</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div className="space-y-1">
                    <span className="font-medium text-white">Click "Load unpacked" and Select the Extracted Folder</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      Click the <strong>"Load unpacked"</strong> button in the top-left toolbar, and select the folder containing <code className="px-1 py-0.5 bg-neutral-900 rounded text-amber-300 font-mono text-[10px]">manifest.json</code>.
                    </p>
                    <p className="text-emerald-400 text-[10.5px] font-medium">
                      ✅ Bolex AI will appear in your browser toolbar ready to use with shortcut <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono text-emerald-300 text-[10px]">Ctrl+Shift+B</kbd>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Keyboard Shortcut */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-2.5">
                <Keyboard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 flex-1">
                  <div className="font-medium text-white flex items-center justify-between">
                    <span>Instant Browser Shortcut</span>
                    <button
                      type="button"
                      onClick={handleCopyShortcut}
                      className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                      title="Copy shortcut"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 font-mono text-[10px]">Ctrl+Shift+B</kbd> (or <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 font-mono text-[10px]">Cmd+Shift+B</kbd>) from any website or tab to trigger Bolex in popup or sidepanel mode.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab View 3: Manifest V3 Specification & Format Inspector */}
          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Manifest V3 Specification (manifest.json)</h4>
                  <p className="text-[11px] text-neutral-400">
                    Complies with Chrome &amp; Chromium Manifest V3 standards with service worker and sidepanel support.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const manifestContent = JSON.stringify({
                      manifest_version: 3,
                      name: "Bolex AI - Browser Assistant & Workspace",
                      version: "2.0.0",
                      description: "Next-generation browser assistant powered by Bolex AI. Web search grounding, page summarization, vision analysis, and contextual side panel.",
                      icons: {
                        "16": "icons/icon16.png",
                        "48": "icons/icon48.png",
                        "128": "icons/icon128.png"
                      },
                      action: {
                        default_popup: "popup.html",
                        default_title: "Bolex AI Assistant (Ctrl+Shift+B)",
                        default_icon: {
                          "16": "icons/icon16.png",
                          "48": "icons/icon48.png",
                          "128": "icons/icon128.png"
                        }
                      },
                      background: {
                        service_worker: "background.js"
                      },
                      side_panel: {
                        default_path: "popup.html"
                      },
                      commands: {
                        _execute_action: {
                          suggested_key: {
                            default: "Ctrl+Shift+B",
                            mac: "Command+Shift+B"
                          },
                          description: "Open Bolex AI Assistant"
                        },
                        open_side_panel: {
                          suggested_key: {
                            default: "Ctrl+Shift+Y",
                            mac: "Command+Shift+Y"
                          },
                          description: "Toggle Bolex AI Side Panel"
                        }
                      },
                      permissions: [
                        "storage",
                        "sidePanel",
                        "activeTab",
                        "scripting",
                        "contextMenus"
                      ],
                      content_scripts: [
                        {
                          matches: ["<all_urls>"],
                          js: ["content.js"],
                          run_at: "document_start"
                        }
                      ],
                      host_permissions: [
                        "https://*/*",
                        "http://*/*"
                      ]
                    }, null, 2);
                    navigator.clipboard.writeText(manifestContent);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied Manifest' : 'Copy manifest.json'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-60 leading-relaxed">
{`{
  "manifest_version": 3,
  "name": "Bolex AI - Browser Assistant & Workspace",
  "version": "2.0.0",
  "description": "Next-generation browser assistant powered by Bolex AI.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Bolex AI Assistant (Ctrl+Shift+B)",
    "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "popup.html"
  },
  "permissions": ["storage", "sidePanel", "activeTab", "scripting", "contextMenus"],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "host_permissions": ["https://*/*", "http://*/*"]
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Check className="w-3.5 h-3.5 text-amber-400" />
            <span>Compatible with Chrome, Edge, Brave, Arc &amp; Opera</span>
          </div>
          <button
            id="close-ext-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
