import React, { useState } from 'react';
import {
  X,
  Cpu,
  Download,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Zap,
  Terminal,
  Layers,
  Database,
  Code2,
  Share2,
  HardDrive
} from 'lucide-react';
import {
  COLAB_TEMPLATES,
  ColabTemplate,
  createJupyterNotebook,
  downloadNotebook,
  exportCodeToColab,
} from '../lib/colabExporter';

interface ColabStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
}

export function ColabStudioModal({
  isOpen,
  onClose,
  initialCode = '',
  initialLanguage = 'python',
}: ColabStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'guide'>('editor');
  const [code, setCode] = useState(
    initialCode.trim() ||
      `# Bolex AI Python Script for Google Colab
import numpy as np
import pandas as pd
import time

print("⚡ Initializing high-speed compute session...")
data = np.random.randn(1000, 5)
df = pd.DataFrame(data, columns=['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'])

print("Data Summary:")
print(df.describe())
print("\\n✅ Execution complete on Google Colab!")`
  );
  const [notebookTitle, setNotebookTitle] = useState('Bolex_Colab_Session');
  const [selectedHardware, setSelectedHardware] = useState<'T4 GPU' | 'TPU' | 'Standard CPU'>('T4 GPU');
  const [selectedTemplate, setSelectedTemplate] = useState<ColabTemplate>(COLAB_TEMPLATES[0]);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadActive = () => {
    exportCodeToColab(code, initialLanguage, notebookTitle);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleDownloadTemplate = (template: ColabTemplate) => {
    const json = createJupyterNotebook(template.cells, template.title);
    downloadNotebook(json, `${template.id}.ipynb`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Google Colab Cloud Accelerator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GPU / TPU
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Push Bolex AI to the next level with cloud GPUs, deep learning &amp; Jupyter notebooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://colab.research.google.com/#create=true"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Launch Colab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Notebook Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pre-Built Templates ({COLAB_TEMPLATES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Why Google Colab?</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Notebook Filename
                  </label>
                  <input
                    type="text"
                    value={notebookTitle}
                    onChange={(e) => setNotebookTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-xs focus:outline-hidden focus:border-amber-500/60"
                    placeholder="Bolex_Notebook"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Hardware Target
                  </label>
                  <div className="flex gap-1.5">
                    {(['T4 GPU', 'TPU', 'Standard CPU'] as const).map((hw) => (
                      <button
                        key={hw}
                        type="button"
                        onClick={() => setSelectedHardware(hw)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                          selectedHardware === hw
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {hw}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(code)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700/60"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadActive}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {downloadSuccess ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadSuccess ? 'Downloaded!' : 'Export .ipynb'}</span>
                  </button>
                </div>
              </div>

              {/* Code Editor / Preview */}
              <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono">
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Python Cell (Pre-configured for Google Colab)</span>
                  </span>
                  <span className="text-[10px] uppercase text-neutral-400">
                    Target: {selectedHardware}
                  </span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={14}
                  className="w-full p-3.5 bg-transparent text-neutral-200 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Quick Launch Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    <strong>1-Click Colab Workflow:</strong> Click <strong>Export .ipynb</strong>, then open Google Colab and choose <strong>Upload</strong>. You get instant access to free NVIDIA T4 GPUs &amp; TPUs!
                  </p>
                </div>
                <a
                  href="https://colab.research.google.com/#create=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1.5"
                >
                  <span>Open Colab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-neutral-400 text-xs">
                Select a ready-to-run Google Colab template tailored for high-compute workloads:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COLAB_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-xs">{tmpl.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                            {tmpl.hardware}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px] leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {tmpl.packages.slice(0, 3).map((pkg) => (
                            <span
                              key={pkg}
                              className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[9px]"
                            >
                              {pkg}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCode(
                                tmpl.cells
                                  .filter((c) => c.type === 'code')
                                  .map((c) => c.content)
                                  .join('\n\n')
                              );
                              setNotebookTitle(tmpl.title);
                              setActiveTab('editor');
                            }}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(tmpl);
                            }}
                            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>.ipynb</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Template Preview */}
              <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-white font-semibold text-xs">
                    Preview: {selectedTemplate.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate(selectedTemplate)}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-[11px] overflow-x-auto text-neutral-300">
                  {selectedTemplate.cells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border ${
                        cell.type === 'markdown'
                          ? 'bg-neutral-900/50 border-neutral-800/80 text-amber-200/90'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono uppercase text-neutral-400 block mb-1">
                        [{cell.type === 'markdown' ? 'Markdown Cell' : 'Code Cell'}]
                      </span>
                      <pre className="whitespace-pre-wrap font-mono">{cell.content}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">
                    How Google Colab Supercharges Bolex AI
                  </h4>
                </div>
                <p className="text-xs text-neutral-300">
                  While Bolex AI runs inside your browser and server with real-time web search and Gemini 3.8 reasoning, Google Colab provides an auxiliary cloud runtime with **free high-performance hardware** that browser apps cannot match alone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <Cpu className="w-4 h-4" />
                    <span>Free Cloud GPUs &amp; TPUs</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Run PyTorch and TensorFlow deep learning models with NVIDIA Tesla T4 or A100 GPUs without paying hardware or cloud hosting fees.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                    <HardDrive className="w-4 h-4" />
                    <span>Google Drive Integration</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Mount your Google Drive directly into the Colab filesystem (<code className="text-amber-200">drive.mount()</code>) to save multi-gigabyte models, training checkpoints, and outputs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <Database className="w-4 h-4" />
                    <span>Heavy Data Analysis</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Process millions of rows with Pandas, NumPy, and Polars that would crash standard browser memory.
                  </p>
                </div>
              </div>

              {/* 3 Step Workflow */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <h5 className="font-semibold text-white text-xs">
                  The Seamless 3-Step Workflow:
                </h5>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-neutral-300">
                  <li>
                    <strong>Generate in Bolex:</strong> Ask Bolex AI to write any Python model, data analysis pipeline, or scraper.
                  </li>
                  <li>
                    <strong>Click &quot;Run in Colab&quot;:</strong> Click the Colab badge on any code block to download a pre-formatted <code className="text-amber-200 font-mono">.ipynb</code> notebook with all <code className="text-amber-200 font-mono">!pip install</code> dependencies included.
                  </li>
                  <li>
                    <strong>Execute in Colab:</strong> Drag and drop the notebook into <a href="https://colab.research.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">Google Colab</a>, connect to a free GPU, and run all cells!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            <span>Colab notebooks are saved locally as valid Jupyter .ipynb format</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
            <a
              href="https://colab.research.google.com/#create=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Go to Google Colab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
