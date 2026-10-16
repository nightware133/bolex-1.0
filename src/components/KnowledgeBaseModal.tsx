import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Globe, 
  Code2, 
  Sparkles, 
  Search, 
  Zap, 
  Layers, 
  Info, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { queryKnowledgeBase, queryWikipedia, queryDeveloperDocs, getRateLimitStatus } from '../lib/knowledgeBase';
import { analyzeNaturalLanguage, KNOWN_IDIOMS, getNLUTrainingSystemPrompt } from '../lib/nluEngine';
import { KnowledgeSource, NLUAnalysisResult } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPromptSnippet?: (snippet: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  onApplyPromptSnippet,
}) => {
  const [activeTab, setActiveTab] = useState<'kb' | 'nlu' | 'rate-limits'>('kb');
  
  // Knowledge Base Test State
  const [testQuery, setTestQuery] = useState('React 19 Actions vs traditional state');
  const [kbLoading, setKbLoading] = useState(false);
  const [testResults, setTestResults] = useState<KnowledgeSource[]>([]);
  const [kbSourceType, setKbSourceType] = useState<string>('');
  const [isCached, setIsCached] = useState(false);

  // NLU Playground State
  const [nluInput, setNluInput] = useState("Let's not bikeshed this PR, but rather tackle the heisenbug before we cut corners.");
  const [nluResult, setNluResult] = useState<NLUAnalysisResult>(() => analyzeNaturalLanguage(nluInput));

  const rateLimitStatus = getRateLimitStatus();

  if (!isOpen) return null;

  const handleRunKBQuery = async () => {
    if (!testQuery.trim()) return;
    setKbLoading(true);
    try {
      const nlu = analyzeNaturalLanguage(testQuery);
      const res = await queryKnowledgeBase(testQuery, nlu);
      setTestResults(res.sources);
      setKbSourceType(res.sourceType);
      setIsCached(res.cached);
    } catch (err) {
      console.error('KB Test Query failed:', err);
    } finally {
      setKbLoading(false);
    }
  };

  const handleNluChange = (val: string) => {
    setNluInput(val);
    setNluResult(analyzeNaturalLanguage(val));
  };

  const handleSelectExample = (phrase: string) => {
    const full = `Can you explain why we should avoid ${phrase} in our codebase?`;
    handleNluChange(full);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Knowledge Base &amp; NLU Comprehension Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Hybrid Active
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Wikipedia REST API &bull; Developer Docs Corpus &bull; Idiom &amp; Syntax Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 border-b border-neutral-800 bg-neutral-900/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kb')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'kb'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Knowledge Base Retrieval</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nlu')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'nlu'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NLU Idiom &amp; Syntax Engine</span>
            {nluResult.detectedIdioms.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {nluResult.detectedIdioms.length} found
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rate-limits')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'rate-limits'
                ? 'border-amber-500 text-amber-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rate Limits &amp; Unpaid Quota Safeguards</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              15 RPM
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: KNOWLEDGE BASE TESTER */}
          {activeTab === 'kb' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>Live Knowledge Retrieval Sandbox</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Auto-routes Wikipedia vs DevDocs
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter a topic (e.g. Fermi Paradox, ACID isolation levels, React 19)..."
                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleRunKBQuery()}
                  />
                  <button
                    type="button"
                    onClick={handleRunKBQuery}
                    disabled={kbLoading}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {kbLoading ? 'Querying...' : 'Query KB'}
                  </button>
                </div>

                {/* Quick Test Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-neutral-400">
                  <span className="text-neutral-500">Quick queries:</span>
                  {[
                    'Fermi paradox and Great Filter',
                    'React 19 Actions and useActionState',
                    'CAP theorem in distributed systems',
                    'Quantum computing superposition',
                    'ACID database isolation levels'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setTestQuery(chip);
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800/80 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Results */}
              {testResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>
                      Retrieved {testResults.length} sources (Source Type: <strong className="text-amber-400 uppercase">{kbSourceType}</strong>)
                    </span>
                    {isCached && (
                      <span className="text-emerald-400 font-mono text-[10px]">
                        &bull; Loaded from local memory cache (0 quota used)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {testResults.map((src) => {
                      const isWiki = src.type === 'wikipedia';
                      return (
                        <div
                          key={src.id}
                          className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isWiki ? (
                                <Globe className="w-3.5 h-3.5 text-sky-400" />
                              ) : (
                                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span className="font-semibold text-white">
                                {src.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md bg-neutral-800 text-[10px] text-neutral-400 uppercase font-mono">
                                {isWiki ? 'Wikipedia' : src.category || 'DevDocs'}
                              </span>
                            </div>

                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                              >
                                <span>Article</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <p className="text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                            {src.snippet}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NLU LINGUISTIC PLAYGROUND */}
          {activeTab === 'nlu' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>NLU Syntactic &amp; Idiom Resolution Analyzer</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Trained on 100+ Idioms
                  </span>
                </div>

                <textarea
                  value={nluInput}
                  onChange={(e) => handleNluChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                  placeholder="Type a sentence with idioms, metaphors, or complex clauses..."
                />

                {/* Example Idiom Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-neutral-500">Test idioms:</span>
                  {[
                    'bikeshedding',
                    'heisenbug',
                    'yak shaving',
                    'dogfooding',
                    'spaghetti code',
                    'bite the bullet',
                    'elephant in the room',
                    'play devil\'s advocate'
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleSelectExample(phrase)}
                      className="px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/20 cursor-pointer"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analysis Card */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Detected Domain Intent</span>
                    <strong className="text-white capitalize text-sm">{nluResult.intent}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Syntactic Complexity</span>
                    <strong className="text-amber-400 capitalize text-sm">{nluResult.syntacticComplexity}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Idioms Detected</span>
                    <strong className="text-sky-400 text-sm">{nluResult.detectedIdioms.length}</strong>
                  </div>
                </div>

                {/* Resolved Idioms */}
                {nluResult.detectedIdioms.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-neutral-300 block">
                      Resolved Idiomatic Expressions:
                    </span>
                    <div className="space-y-1.5">
                      {nluResult.detectedIdioms.map((idiom, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-neutral-900 border border-amber-500/30 flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-amber-300">&ldquo;{idiom.phrase}&rdquo;</span>
                            <p className="text-neutral-300 text-[11px] mt-0.5">
                              Meaning: {idiom.meaning}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 capitalize shrink-0">
                            {idiom.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Normalized Query Representation */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">
                    Semantic Normalized Transformation (Fed into Model Context):
                  </span>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px] whitespace-pre-wrap">
                    {nluResult.normalizedQuery}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RATE LIMITS & UNPAID TIER SAFEGUARDS */}
          {activeTab === 'rate-limits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-semibold text-white text-sm">
                      Unpaid API Key &amp; Rate Limit Safeguard Policy
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Protections Active
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Bolex AI is designed to run seamlessly on Gemini free-tier and unpaid API keys. Free tier keys have strict rate limit restrictions imposed by the provider. The table below details these limits and how our knowledge retrieval engine protects you.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Free Tier RPM Limit</span>
                  <div className="text-xl font-bold text-white font-mono mt-1">15 RPM</div>
                  <p className="text-[10px] text-neutral-500 mt-1">Requests per minute ceiling</p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Current Velocity</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {rateLimitStatus.queriesThisMinute} / 15
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">Rolling 60s request window</p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">Zero-Cost Sources</span>
                  <div className="text-xl font-bold text-sky-400 font-mono mt-1">Unlimited</div>
                  <p className="text-[10px] text-neutral-500 mt-1">Wikipedia &amp; DevDocs are free</p>
                </div>
              </div>

              {/* Architectural Safeguards List */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h5 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>How Bolex Optimizes Unpaid API Usage</span>
                </h5>

                <div className="space-y-2 text-[11px] text-neutral-300">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span><strong>Pre-Retrieval Caching:</strong> Frequently queried Wikipedia topics and developer docs are cached in local memory, returning instantaneous answers with 0 API tokens spent.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span><strong>Lean Grounding Chunks:</strong> Only top 2-3 most relevant snippets are synthesized into the model context, avoiding prompt token bloat.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span><strong>Automatic Model Failover:</strong> If Gemini 2.5 Flash encounters a 429 quota pause, the backend automatically fails over to fallback models without dropping the chat stream.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Hybrid Knowledge Base active for all conversations</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
