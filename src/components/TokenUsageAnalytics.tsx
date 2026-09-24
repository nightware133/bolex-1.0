import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Activity,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Zap,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileText,
  Info,
} from 'lucide-react';
import { ChatSession } from '../types';
import { calculateOverallTokenMetrics, SessionTokenStats } from '../lib/tokenUsage';

interface TokenUsageAnalyticsProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (id: string) => void;
}

type ChartViewType = 'bars' | 'timeline' | 'distribution';
type SortOrderType = 'recent' | 'tokens' | 'messages';

export function TokenUsageAnalytics({
  sessions,
  activeSessionId,
  onSelectSession,
}: TokenUsageAnalyticsProps) {
  const [chartView, setChartView] = useState<ChartViewType>('bars');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('recent');

  const { overall, sessionStats } = useMemo(() => {
    return calculateOverallTokenMetrics(sessions);
  }, [sessions]);

  // Prepared data for BarChart (Session breakdown)
  const sortedSessions = useMemo(() => {
    const list = [...sessionStats];
    if (sortOrder === 'recent') {
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortOrder === 'tokens') {
      return list.sort((a, b) => b.totalTokens - a.totalTokens);
    } else {
      return list.sort((a, b) => b.messageCount - a.messageCount);
    }
  }, [sessionStats, sortOrder]);

  // Chart data for Bar Chart (limiting to last 10 for clean readability)
  const barChartData = useMemo(() => {
    return sortedSessions.slice(0, 10).map((s) => ({
      name: s.shortTitle,
      fullName: s.title,
      id: s.id,
      promptTokens: s.promptTokens,
      completionTokens: s.completionTokens,
      totalTokens: s.totalTokens,
      messages: s.messageCount,
      date: s.dateLabel,
    }));
  }, [sortedSessions]);

  // Timeline cumulative data (sorted by creation time ascending)
  const timelineData = useMemo(() => {
    const chronological = [...sessionStats].sort((a, b) => a.createdAt - b.createdAt);
    let cumulative = 0;
    return chronological.map((s, idx) => {
      cumulative += s.totalTokens;
      return {
        sessionIndex: `S${idx + 1}`,
        name: s.shortTitle,
        fullName: s.title,
        sessionTokens: s.totalTokens,
        cumulativeTokens: cumulative,
        promptTokens: s.promptTokens,
        completionTokens: s.completionTokens,
        date: s.dateLabel,
      };
    });
  }, [sessionStats]);

  // Distribution data for Pie Chart
  const distributionData = useMemo(() => {
    return [
      { name: 'Prompt (Input)', value: overall.totalPromptTokens, color: '#f59e0b' },
      { name: 'Completion (Output)', value: overall.totalCompletionTokens, color: '#06b6d4' },
    ];
  }, [overall]);

  const hasAnyTokens = overall.totalTokens > 0;

  // Custom Dark Tooltip for Bar & Area charts
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-950/95 border border-neutral-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
          <div className="font-semibold text-neutral-200 border-b border-neutral-800/80 pb-1.5 flex items-center justify-between gap-2">
            <span className="truncate max-w-[150px]">{data.fullName || data.name}</span>
            <span className="text-[10px] text-neutral-400 font-mono shrink-0">{data.date}</span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Prompt Tokens:
              </span>
              <span>{data.promptTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                Completion Tokens:
              </span>
              <span>{data.completionTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-white font-semibold pt-1 border-t border-neutral-850">
              <span>Total Tokens:</span>
              <span>{data.totalTokens.toLocaleString()}</span>
            </div>
          </div>
          {data.messages !== undefined && (
            <div className="text-[10px] text-neutral-400 pt-0.5">
              {data.messages} message{data.messages === 1 ? '' : 's'} in conversation
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-950/95 border border-neutral-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
          <div className="font-semibold text-neutral-200 border-b border-neutral-800/80 pb-1.5 flex items-center justify-between">
            <span className="truncate max-w-[150px]">{data.fullName}</span>
            <span className="text-[10px] text-neutral-400 font-mono">{data.date}</span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-amber-400">
              <span>Session Tokens:</span>
              <span>{data.sessionTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-cyan-400 font-semibold pt-1 border-t border-neutral-850">
              <span>Cumulative Total:</span>
              <span>{data.cumulativeTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
      {/* Header with Title and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">Token Usage & Activity Analytics</h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Recharts Engine
          </span>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartView('bars')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'bars'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
            title="Session Comparison (Prompt vs Completion)"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('timeline')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'timeline'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
            title="Cumulative Activity Growth Timeline"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('distribution')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'distribution'
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
            title="Prompt vs Completion Distribution"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Ratio</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-850 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span>Total Tokens</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
            {overall.totalTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Free Tier Compatible</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-850 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span>Prompt Tokens</span>
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-300 tracking-tight">
            {overall.totalPromptTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">
            {overall.totalTokens > 0
              ? `${Math.round((overall.totalPromptTokens / overall.totalTokens) * 100)}% of total`
              : '0% input'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-850 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span>Output Tokens</span>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-cyan-300 tracking-tight">
            {overall.totalCompletionTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">
            {overall.totalTokens > 0
              ? `${Math.round((overall.totalCompletionTokens / overall.totalTokens) * 100)}% of total`
              : '0% output'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-850 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span>Avg / Session</span>
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-neutral-200 tracking-tight">
            {overall.avgTokensPerSession.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400">
            Across {overall.sessionCount} session{overall.sessionCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Visual Chart Area */}
      {hasAnyTokens ? (
        <div className="p-3 sm:p-4 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-2">
          {/* Chart View 1: Stacked Bar Chart */}
          {chartView === 'bars' && (
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 px-1">
                <span className="font-medium text-neutral-300">
                  Tokens per Session (Prompt vs Completion)
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Showing top {barChartData.length} sessions
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(val) => (
                        <span className="text-neutral-300 capitalize">{val}</span>
                      )}
                    />
                    <Bar
                      dataKey="promptTokens"
                      name="Prompt Tokens"
                      fill="#f59e0b"
                      stackId="tokens"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="completionTokens"
                      name="Completion Tokens"
                      fill="#06b6d4"
                      stackId="tokens"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart View 2: Cumulative Area Timeline */}
          {chartView === 'timeline' && (
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 px-1">
                <span className="font-medium text-neutral-300">
                  Cumulative Token Activity Growth
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Chronological session progression
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="sessionIndex"
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeTokens"
                      name="Cumulative Tokens"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#tokenGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart View 3: Distribution Ratio */}
          {chartView === 'distribution' && (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#171717" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} tokens (${
                          overall.totalTokens > 0
                            ? Math.round((Number(val) / overall.totalTokens) * 100)
                            : 0
                        }%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#0a0a0a',
                        borderColor: '#262626',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f5f5f5',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 text-xs w-full max-w-xs">
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Prompt (Input)
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {overall.totalPromptTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: `${
                          overall.totalTokens > 0
                            ? (overall.totalPromptTokens / overall.totalTokens) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-cyan-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                      Completion (Output)
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {overall.totalCompletionTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{
                        width: `${
                          overall.totalTokens > 0
                            ? (overall.totalCompletionTokens / overall.totalTokens) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 px-4 rounded-xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto" />
          <div className="text-xs font-semibold text-neutral-300">No token activity recorded yet</div>
          <div className="text-[11px] text-neutral-400 max-w-sm mx-auto">
            Start chatting with Bolex AI to visualize prompt consumption, output token counts, and session history over time.
          </div>
        </div>
      )}

      {/* Per Session Detailed List with Sorting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Session Token Log ({sortedSessions.length})</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <ArrowUpDown className="w-3 h-3 text-neutral-400" />
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrderType)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-hidden"
            >
              <option value="recent">Most Recent</option>
              <option value="tokens">Highest Tokens</option>
              <option value="messages">Message Count</option>
            </select>
          </div>
        </div>

        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {sortedSessions.map((session) => {
            const isSelected = activeSessionId === session.id;
            const maxSessionTokens = overall.highestUsageSession?.totalTokens || 1;
            const percentageOfMax = Math.min(100, Math.round((session.totalTokens / maxSessionTokens) * 100));

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession?.(session.id)}
                className={`p-2 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-850 hover:border-neutral-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-neutral-200 truncate">{session.title}</span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                    <span className="font-semibold text-white">
                      {session.totalTokens.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400">tokens</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span>{session.dateLabel} {session.timeLabel}</span>
                    <span>•</span>
                    <span>{session.messageCount} msg{session.messageCount === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-amber-400/90">In: {session.promptTokens.toLocaleString()}</span>
                    <span>/</span>
                    <span className="text-cyan-400/90">Out: {session.completionTokens.toLocaleString()}</span>
                  </div>
                </div>

                {/* Relative Token Meter Bar */}
                <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, percentageOfMax)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Footnote */}
      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-neutral-900/40 border border-neutral-850/60 text-[11px] text-neutral-400">
        <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
        <span>
          Token calculations reflect subword character &amp; multimodal token heuristics compatible with Gemini models to help track prompt lengths and context capacity.
        </span>
      </div>
    </div>
  );
}
