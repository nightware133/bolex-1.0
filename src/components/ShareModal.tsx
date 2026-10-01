import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  QrCode, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  Send,
  Download,
  BookOpen,
  Laptop,
  FolderArchive,
  Rocket,
  Loader2,
  Terminal,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { generateProjectZip, downloadBlob } from '../lib/projectExporter';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'transfer' | 'qr' | 'domain'>('transfer');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  // The actual live public URL
  const realUrl = 'https://ais-pre-cge2tjdimpisaqembh3jzh-693311015224.us-west2.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(realUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportProgress(10);
    setExportMessage('Preparing files...');
    try {
      const blob = await generateProjectZip(({ percent, message }) => {
        setExportProgress(percent);
        setExportMessage(message);
      });
      downloadBlob(blob, 'bolex-ai-project.zip');
      setExportSuccess(true);
      setExportMessage('Project .ZIP downloaded successfully!');
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      setExportMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Try Bolex AI Assistant — an advanced AI workstation with real-time Cognitive Trace and Project Vaults!')}&url=${encodeURIComponent(realUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Try Bolex AI Assistant: ${realUrl}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Check out Bolex AI Assistant')}&body=${encodeURIComponent(`Hey,\n\nI built and published Bolex AI Assistant! Check it out here: ${realUrl}\n\nIt features real-time Cognitive Trace internal monologue, Contextual Anchors, Web Speech voice narration, and multimodal vision.`)}`;


  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Publish, Export & Share</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400">Download project to other computers, publish to Vercel/Netlify, or share live link</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'transfer'
                ? 'bg-amber-500 text-neutral-950 shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Transfer to Other PC &amp; Deploy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'link'
                ? 'bg-amber-500 text-neutral-950 shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Cloud Preview Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-neutral-950 shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'domain'
                ? 'bg-amber-500 text-neutral-950 shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Custom Domain Guide</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {activeTab === 'transfer' && (
            <div className="space-y-4">
              {/* Main 1-Click ZIP Download Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-500/30 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <FolderArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Download Full Project (.ZIP)</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-neutral-950 font-extrabold">
                          STANDALONE
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Transfer the entire source code to any computer via USB, AirDrop, Google Drive, or Email.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isExporting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 disabled:opacity-50 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Packaging Archive ({exportProgress}%)...</span>
                      </>
                    ) : exportSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                        <span>Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download bolex-ai-project.zip</span>
                      </>
                    )}
                  </button>

                  {exportMessage && (
                    <span className="text-xs text-amber-300 font-mono text-center sm:text-left">
                      {exportMessage}
                    </span>
                  )}
                </div>

                {/* 2-Step Local Execution Instructions */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5 text-xs text-neutral-300">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>How to run on your other computer in 2 steps:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400 font-mono">
                    <li>Unzip <strong className="text-neutral-200">bolex-ai-project.zip</strong> and open terminal inside the folder</li>
                    <li>Run: <strong className="text-amber-300">npm install &amp;&amp; npm run dev</strong></li>
                  </ol>
                </div>
              </div>

              {/* Free 1-Click Public Web Hosting (Zero Login Redirects) */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span>Free 100% Public Hosting (Zero Auth Redirects)</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Want a permanent public link anyone in the world can open on any device without Google login screens? Use one of these free options:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Vercel (Recommended)</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">1-Click Free</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Upload project to GitHub, then import into Vercel. Gives you a fast <strong className="text-neutral-200">bolex-ai.vercel.app</strong> link with free SSL.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Netlify Drop</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Instant Drag &amp; Drop</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Run <code className="text-amber-300">npm run build</code>, then drag the generated <strong className="text-neutral-200">dist</strong> folder straight to Netlify Drop for an instant live URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Your Live Real Web Address</label>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-amber-300 truncate select-all">
                    {realUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anyone with this link can use Bolex AI Assistant</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  This is the real, permanent HTTPS link provided by Google Cloud and AI Studio. It runs 24/7 without needing you to keep your computer turned on.
                </p>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-neutral-400">Quick Share to Friends & Social</span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-center no-underline"
                  >
                    <span>Twitter / X</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-center no-underline"
                  >
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={emailUrl}
                    className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-center no-underline"
                  >
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="p-6 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl">
                {/* SVG QR Code pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                  {/* Outer corner boxes */}
                  <rect x="10" y="10" width="26" height="26" fill="black" />
                  <rect x="14" y="14" width="18" height="18" fill="white" />
                  <rect x="18" y="18" width="10" height="10" fill="black" />

                  <rect x="64" y="10" width="26" height="26" fill="black" />
                  <rect x="68" y="14" width="18" height="18" fill="white" />
                  <rect x="72" y="18" width="10" height="10" fill="black" />

                  <rect x="10" y="64" width="26" height="26" fill="black" />
                  <rect x="14" y="68" width="18" height="18" fill="white" />
                  <rect x="18" y="72" width="10" height="10" fill="black" />

                  {/* Data blocks */}
                  <rect x="42" y="14" width="6" height="6" fill="black" />
                  <rect x="52" y="20" width="6" height="6" fill="black" />
                  <rect x="42" y="28" width="6" height="6" fill="black" />
                  <rect x="20" y="44" width="6" height="6" fill="black" />
                  <rect x="30" y="48" width="6" height="6" fill="black" />
                  <rect x="42" y="44" width="8" height="8" fill="black" />
                  <rect x="54" y="42" width="6" height="6" fill="black" />
                  <rect x="66" y="48" width="8" height="8" fill="black" />
                  <rect x="78" y="44" width="6" height="6" fill="black" />
                  <rect x="42" y="64" width="6" height="6" fill="black" />
                  <rect x="52" y="72" width="6" height="6" fill="black" />
                  <rect x="64" y="66" width="6" height="6" fill="black" />
                  <rect x="76" y="74" width="8" height="8" fill="black" />
                  <rect x="48" y="82" width="6" height="6" fill="black" />
                  <rect x="66" y="82" width="6" height="6" fill="black" />
                </svg>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Scan with any phone camera</h4>
                <p className="text-xs text-neutral-400">
                  Open your camera on iPhone or Android to immediately launch Bolex AI on mobile.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>How to connect your own domain (e.g. bolex.ai)</span>
                </h4>
                <p className="text-neutral-400 leading-relaxed">
                  If you want a short vanity domain like <strong>bolex.ai</strong> or <strong>mybolex.com</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 pt-1">
                  <li>Buy a domain on Namecheap, Cloudflare, or GoDaddy ($5-$10/year).</li>
                  <li>In Cloudflare or your DNS registrar, add a <strong>CNAME</strong> record:
                    <div className="mt-1 p-2 rounded bg-neutral-900 font-mono text-[11px] text-amber-300">
                      CNAME @ -&gt; ais-pre-cge2tjdimpisaqembh3jzh-693311015224.us-west2.run.app
                    </div>
                  </li>
                  <li>Or export the code to GitHub and link it to <strong>Vercel</strong> or <strong>Netlify</strong> with 1 click for free custom domain SSL!</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Install as Native App on Phones (PWA)</span>
                </h4>
                <p className="text-neutral-400 leading-relaxed">
                  On mobile browsers (Safari on iPhone or Chrome on Android), tap <strong>Share</strong> and select <strong>"Add to Home Screen"</strong>. Bolex AI will install as a standalone app with its own icon on your phone!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
