import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Download, 
  Trash2, 
  Filter, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  MessageSquare, 
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Zap,
  Clock,
  Gauge,
  Activity,
  ArrowUpDown,
  Cpu,
  Check,
  BookOpen,
  Globe,
  Code2
} from 'lucide-react';
import { MessageFeedback, FeedbackStats, FeedbackCategory, ChatSession } from '../types';
import { 
  getAllFeedback, 
  getFeedbackAnalytics, 
  exportFeedbackToCSV, 
  deleteFeedback, 
  clearAllFeedback, 
  FEEDBACK_UPDATED_EVENT 
} from '../lib/feedbackManager';
import { 
  calculatePerformanceMetrics, 
  exportPerformanceToCSV, 
  GlobalPerformanceMetrics 
} from '../lib/performanceMonitor';
import { KNOWN_IDIOMS } from '../lib/nluEngine';

interface FeedbackAnalyticsTabProps {
  sessions?: ChatSession[];
  onSelectSession?: (id: string) => void;
}

export const FeedbackAnalyticsTab: React.FC<FeedbackAnalyticsTabProps> = ({
  sessions = [],
  onSelectSession,
}) => {
  const [subView, setSubView] = useState<'overview' | 'performance' | 'feedback'>('overview');
  const [feedbacks, setFeedbacks] = useState<MessageFeedback[]>(() => getAllFeedback());
  const [stats, setStats] = useState<FeedbackStats>(() => getFeedbackAnalytics());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [sessionSearch, setSessionSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<'latency' | 'tokens' | 'speed' | 'recent'>('recent');

  const refreshData = () => {
    setFeedbacks(getAllFeedback());
    setStats(getFeedbackAnalytics());
  };

  useEffect(() => {
    window.addEventListener(FEEDBACK_UPDATED_EVENT, refreshData);
    return () => window.removeEventListener(FEEDBACK_UPDATED_EVENT, refreshData);
  }, []);

  const performance = useMemo(() => {
    return calculatePerformanceMetrics(sessions);
  }, [sessions]);

  const kbMetrics = useMemo(() => {
    let kbCitationsCount = 0;
    let idiomsResolvedCount = 0;
    for (const s of sessions) {
      for (const m of s.messages) {
        if (m.knowledgeSources && m.knowledgeSources.length > 0) {
          kbCitationsCount += m.knowledgeSources.length;
        }
        if (m.nluAnalysis?.detectedIdioms && m.nluAnalysis.detectedIdioms.length > 0) {
          idiomsResolvedCount += m.nluAnalysis.detectedIdioms.length;
        }
      }
    }
    return { kbCitationsCount, idiomsResolvedCount };
  }, [sessions]);

  const handleDelete = (id: string) => {
    if (confirm('Delete this feedback record?')) {
      deleteFeedback(id);
      refreshData();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all feedback history? This cannot be undone.')) {
      clearAllFeedback();
      refreshData();
    }
  };

  const filteredList = feedbacks.filter((item) => {
    if (ratingFilter !== 'all' && item.rating !== ratingFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = item.comment?.toLowerCase().includes(q);
      const matchTitle = item.sessionTitle?.toLowerCase().includes(q);
      const matchModel = item.model?.toLowerCase().includes(q);
      const matchSnippet = item.assistantResponseSnippet?.toLowerCase().includes(q);
      if (!matchComment && !matchTitle && !matchModel && !matchSnippet) return false;
    }
    return true;
  });

  const sortedSessionStats = useMemo(() => {
    let list = [...performance.sessionStats];
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      list = list.filter((s) => s.sessionTitle.toLowerCase().includes(q) || s.model.toLowerCase().includes(q));
    }
    if (sortKey === 'latency') {
      return list.sort((a, b) => b.avgLatencyMs - a.avgLatencyMs);
    } else if (sortKey === 'tokens') {
      return list.sort((a, b) => b.totalTokens - a.totalTokens);
    } else if (sortKey === 'speed') {
      return list.sort((a, b) => b.avgTokensPerSecond - a.avgTokensPerSecond);
    }
    return list.sort((a, b) => b.lastActive - a.lastActive);
  }, [performance.sessionStats, sessionSearch, sortKey]);

  return (
    <div className="space-y-6">
      {/* Top Header & Multi-Export Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Feedback Quality &amp; Response Performance Monitor
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time tracking of AI response latency, time-to-first-token (TTFT), token consumption, and user satisfaction ratings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => exportPerformanceToCSV(sessions)}
            disabled={performance.recentLogs.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download latency & token telemetry CSV"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Performance CSV
          </button>

          <button
            type="button"
            onClick={exportFeedbackToCSV}
            disabled={feedbacks.length === 0}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download ratings & user comments CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Feedback CSV
          </button>
        </div>
      </div>

      {/* Sub-Navigation Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 w-fit">
        <button
          type="button"
          onClick={() => setSubView('overview')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            subView === 'overview'
              ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('performance')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            subView === 'performance'
              ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Latency &amp; Token Monitor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
            {performance.sessionStats.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('feedback')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            subView === 'feedback'
              ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>User Ratings &amp; Notes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
            {stats.totalCount}
          </span>
        </button>
      </div>

      {/* 4 Primary Latency & Quality Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Avg Response Latency */}
        <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Avg Latency</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
              {performance.overallAvgLatencyMs > 0 ? (performance.overallAvgLatencyMs / 1000).toFixed(2) : '—'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">sec</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{performance.overallAvgLatencyMs < 2000 ? 'Optimal Performance' : 'Standard Speed'}</span>
          </div>
        </div>

        {/* Metric 2: Time to First Token (TTFT) */}
        <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>First Token (TTFT)</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-sky-400 font-mono tabular-nums">
              {performance.overallAvgTtftMs > 0 ? performance.overallAvgTtftMs : '—'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">ms</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2 font-mono">
            Fastest: {performance.fastestResponseMs > 0 ? `${performance.fastestResponseMs}ms` : '—'}
          </p>
        </div>

        {/* Metric 3: Total Tokens & Speed */}
        <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Tokens Generated</span>
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
              {performance.totalTokensGenerated.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-mono">
            ~{performance.overallTokensPerSecond} tok/sec
          </p>
        </div>

        {/* Metric 4: Average Satisfaction Rating */}
        <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>User Satisfaction</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
              {stats.totalCount > 0 ? stats.averageRating.toFixed(2) : '5.00'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">/ 5.0</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2 font-medium">
            {stats.totalCount > 0 ? `${stats.positivePercentage}% positive (4-5★)` : '100% baseline quality'}
          </p>
        </div>
      </div>

      {/* Connected Knowledge Base & NLU Active Health Card */}
      <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Hybrid Knowledge Base &amp; NLU Grounding Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Wikipedia REST API &bull; Developer Docs Corpus &bull; Idiom Resolver ({KNOWN_IDIOMS.length} idioms indexed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <span className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-sky-300">
            {kbMetrics.kbCitationsCount} KB citations
          </span>
          <span className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-amber-300">
            {kbMetrics.idiomsResolvedCount} idioms resolved
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            15 RPM safe
          </span>
        </div>
      </div>

      {/* VIEW 1: PERFORMANCE MONITOR & PER-SESSION TABLE */}
      {(subView === 'overview' || subView === 'performance') && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs sm:text-sm font-semibold text-white">
                  Per-Session Latency &amp; Token Usage Matrix
                </h5>
              </div>

              {/* Filters & Sorting */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Filter sessions..."
                    className="pl-7 pr-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
                  />
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSortKey('recent')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      sortKey === 'recent' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortKey('latency')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      sortKey === 'latency' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Latency
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortKey('tokens')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      sortKey === 'tokens' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Tokens
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Table */}
            {sortedSessionStats.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs">
                No active session performance data found. Start a conversation to generate metrics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                      <th className="pb-2 font-medium">Session Title</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium text-right">Messages</th>
                      <th className="pb-2 font-medium text-right">Prompt Tok</th>
                      <th className="pb-2 font-medium text-right">Completion</th>
                      <th className="pb-2 font-medium text-right">Total Tokens</th>
                      <th className="pb-2 font-medium text-right">Avg Latency</th>
                      <th className="pb-2 font-medium text-right">TTFT</th>
                      <th className="pb-2 font-medium text-right">Speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {sortedSessionStats.map((sess) => (
                      <tr
                        key={sess.sessionId}
                        onClick={() => onSelectSession?.(sess.sessionId)}
                        className="hover:bg-neutral-900/60 transition-colors group cursor-pointer text-neutral-300"
                      >
                        <td className="py-2.5 pr-2 font-medium text-white max-w-[180px] truncate group-hover:text-amber-300">
                          {sess.sessionTitle}
                        </td>
                        <td className="py-2.5 pr-2 text-[11px] text-neutral-400 font-mono truncate max-w-[100px]">
                          {sess.model}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-neutral-400">
                          {sess.messageCount}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-neutral-400">
                          {sess.promptTokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-purple-300">
                          {sess.completionTokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-white">
                          {sess.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-amber-400 font-medium">
                          {sess.avgLatencyMs > 0 ? `${sess.avgLatencyMs}ms` : '—'}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-sky-400">
                          {sess.avgTtftMs > 0 ? `${sess.avgTtftMs}ms` : '—'}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-emerald-400 text-[11px]">
                          {sess.avgTokensPerSecond > 0 ? `${sess.avgTokensPerSecond} tok/s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Response Latency Stream Log */}
          {performance.recentLogs.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Recent Response Generation Logs (Telemetry)
                </h5>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {performance.recentLogs.length} events recorded
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {performance.recentLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.messageId}
                    className="p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/60 flex items-center justify-between gap-2 text-[11px] text-neutral-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-neutral-500 font-mono tabular-nums text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-white truncate max-w-[140px] font-medium">
                        {log.sessionTitle}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                        ({log.model})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-[11px]">
                      <span className="text-amber-400">
                        {log.latencyMs}ms
                      </span>
                      <span className="text-sky-400 hidden sm:inline">
                        TTFT {log.ttftMs}ms
                      </span>
                      <span className="text-purple-300">
                        {log.completionTokens} tok
                      </span>
                      <span className="text-emerald-400 text-[10px]">
                        {log.tokensPerSecond} t/s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: USER RATINGS & FEEDBACK NOTES */}
      {(subView === 'overview' || subView === 'feedback') && (
        <div className="space-y-4">
          {/* Rating Distribution Breakdown */}
          <div className="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800">
            <h5 className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Rating Distribution Breakdown
            </h5>

            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const count = stats.distribution[rating] || 0;
                const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
                return (
                  <div key={rating} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 w-16 shrink-0 text-neutral-400 font-mono">
                      <span>{rating}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </div>

                    <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rating >= 4
                            ? 'bg-amber-400'
                            : rating === 3
                            ? 'bg-sky-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="w-16 text-right font-mono text-[11px] text-neutral-400 tabular-nums shrink-0">
                      {count} <span className="text-neutral-600">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter and Search Bar for Written Feedback */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user comments, models, or topics..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Rating Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRatingFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                    ratingFilter === 'all'
                      ? 'bg-amber-500 text-neutral-950 font-semibold'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                  }`}
                >
                  All Stars
                </button>
                {([5, 4, 3, 2, 1] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatingFilter(r)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-0.5 shrink-0 ${
                      ratingFilter === r
                        ? 'bg-amber-500 text-neutral-950 font-semibold'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{r}</span>
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback History List / Table */}
            {filteredList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-neutral-950/30 border border-neutral-800/60 text-neutral-500 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="font-medium text-neutral-400">No feedback entries found</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Rate AI messages in the chat feed to build quality analytics.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700/80 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= item.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Category */}
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-[10px] text-neutral-300 capitalize font-medium">
                          {item.category || 'general'}
                        </span>

                        {/* Model */}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {item.model}
                        </span>

                        {/* Timestamp */}
                        <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* User Written Note */}
                    {item.comment && (
                      <p className="text-neutral-200 bg-neutral-900/90 p-2 rounded-lg border border-neutral-800/80 italic text-[11px] leading-relaxed">
                        &ldquo;{item.comment}&rdquo;
                      </p>
                    )}

                    {/* Snippets */}
                    <div className="text-[10px] text-neutral-500 space-y-0.5">
                      {item.userPromptSnippet && (
                        <p className="truncate">
                          <span className="text-neutral-400 font-medium">Prompt:</span> {item.userPromptSnippet}
                        </p>
                      )}
                      {item.assistantResponseSnippet && (
                        <p className="truncate text-neutral-400">
                          <span className="text-neutral-500">Response:</span> {item.assistantResponseSnippet}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
