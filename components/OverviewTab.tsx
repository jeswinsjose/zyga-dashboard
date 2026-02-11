import React, { useState, useEffect } from 'react';
import * as api from '../lib/api';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const DONUT_COLORS = ['#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#34d399', '#22d3ee', '#f87171'];

export const OverviewTab: React.FC = () => {
  const [data, setData] = useState<api.OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const overview = await api.fetchOverview();
        if (!cancelled) setData(overview);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full text-textMuted">
        Loading overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
        <p>{error}</p>
        <p className="text-sm text-textMuted">Make sure the API server is running: npm run api</p>
      </div>
    );
  }

  if (!data) return null;

  const { gatewayStatus, costs, cronJobs, sessions, tokenUsage } = data;
  const memUsed = parseFloat(gatewayStatus.memory) || 0;
  const memTotal = parseFloat(gatewayStatus.memoryTotal || '16') || 16;
  const memPct = Math.min(100, Math.round((memUsed / memTotal) * 100));

  // Donut: build conic-gradient from breakdown
  const totalCost = costs.breakdown.reduce((s, b) => s + b.cost, 0) || 1;
  let grad = '';
  let cum = 0;
  costs.breakdown.forEach((b, i) => {
    const pct = (b.cost / totalCost) * 100;
    grad += `${DONUT_COLORS[i % DONUT_COLORS.length]} ${cum}% ${cum + pct}%,`;
    cum += pct;
  });
  const donutStyle = { background: `conic-gradient(${grad.slice(0, -1)})` };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'ok':
      case 'running':
        return 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]';
      case 'error':
        return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]';
      case 'idle':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'main') return 'bg-gray-600/30 text-gray-400 border-gray-500/30';
    if (t === 'cron') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (t === 'subagent') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (t === 'dm') return 'bg-primary/20 text-primary border-primary/30';
    return 'bg-surface text-textMuted border-border';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0d1117]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Overview
            </h2>
            <p className="text-sm text-textMuted mt-0.5">OpenClaw operational monitoring</p>
          </div>
        </div>

        {/* Gateway Status Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#161b22] border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Status</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  gatewayStatus.online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'
                }`}
              />
              <span className={`font-semibold ${gatewayStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                {gatewayStatus.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">PID</div>
            <div className="text-sm font-bold text-white">{gatewayStatus.pid ?? '—'}</div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Uptime</div>
            <div className="text-sm font-bold text-white">{gatewayStatus.uptime || '—'}</div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Memory</div>
            <div className="text-sm font-bold text-white">
              {gatewayStatus.memory}GB / {gatewayStatus.memoryTotal || '16'}GB
            </div>
            <div className="mt-1.5 h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${memPct}%` }}
              />
            </div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Active Sessions</div>
            <div className="text-sm font-bold text-white">{gatewayStatus.activeSessions}</div>
          </div>
        </div>

        {/* Cost Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-border rounded-lg p-4 border-t-2 border-t-primary/50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Today's Cost</div>
            <div className="text-2xl font-bold text-white">${costs.today.toFixed(2)}</div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4 border-t-2 border-t-primary/50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">All-Time Cost</div>
            <div className="text-2xl font-bold text-white">${costs.allTime.toFixed(2)}</div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4 border-t-2 border-t-primary/50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Projected Monthly</div>
            <div className="text-2xl font-bold text-white">${costs.projectedMonthly.toFixed(2)}</div>
            <div className="text-[10px] text-textMuted mt-1">Based on today's rate</div>
          </div>
          <div className="bg-[#161b22] border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full flex-shrink-0" style={donutStyle}>
              <div className="absolute inset-[22%] rounded-full bg-[#0d1117] flex items-center justify-center">
                <span className="text-sm font-bold text-white">${totalCost.toFixed(0)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-textMuted mb-2">Cost Breakdown</div>
              {costs.breakdown.slice(0, 4).map((b, i) => (
                <div key={b.model} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="text-textMuted truncate flex-1" title={b.model}>
                    {b.model.split('/').pop()}
                  </span>
                  <span className="text-white font-medium">${b.cost.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cron Jobs Table */}
        <div className="bg-[#161b22] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <h3 className="text-sm font-bold text-white">Cron Jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-textMuted border-b border-border">
                  <th className="px-4 py-3 w-16">Status</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Last Run</th>
                  <th className="px-4 py-3">Next Run</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Model</th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((job, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-[#1c2128] transition-colors">
                    <td className="px-4 py-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(job.status)}`} title={job.status} />
                    </td>
                    <td className="px-4 py-3 text-textMain font-medium">{job.name}</td>
                    <td className="px-4 py-3 text-textMuted font-mono text-xs">{job.schedule}</td>
                    <td className="px-4 py-3 text-textMuted">{job.lastRun}</td>
                    <td className="px-4 py-3 text-textMuted">{job.nextRun}</td>
                    <td className="px-4 py-3 text-textMuted">{job.duration}</td>
                    <td className="px-4 py-3 text-textMuted text-xs truncate max-w-[140px]" title={job.model}>
                      {job.model}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Sessions Table */}
        <div className="bg-[#161b22] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="text-lg">📡</span>
            <h3 className="text-sm font-bold text-white">Active Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-textMuted border-b border-border">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3 w-20">Type</th>
                  <th className="px-4 py-3 w-28">Context %</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-[#1c2128] transition-colors">
                    <td className="px-4 py-3 text-textMain font-medium truncate max-w-[200px]" title={s.name}>
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-textMuted text-xs truncate max-w-[160px]" title={s.model}>
                      {s.model}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getTypeBadgeClass(s.type)}`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.contextPercent > 80 ? 'bg-red-500' : s.contextPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, s.contextPercent)}%` }}
                          />
                        </div>
                        <span className="text-textMuted text-xs">{s.contextPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-textMuted">{s.lastActivity}</td>
                    <td className="px-4 py-3 text-right font-mono text-textMain">
                      {s.tokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Token Usage Table */}
        <div className="bg-[#161b22] border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-bold text-white">Token Usage & Cost</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-textMuted border-b border-border">
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3 text-right">Calls</th>
                  <th className="px-4 py-3 text-right">Input</th>
                  <th className="px-4 py-3 text-right">Output</th>
                  <th className="px-4 py-3 text-right">Cache</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {tokenUsage.map((u, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-[#1c2128] transition-colors">
                    <td className="px-4 py-3 text-textMain font-medium truncate max-w-[220px]" title={u.model}>
                      {u.model}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-textMuted">{u.calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-textMuted">
                      {formatTokens(u.inputTokens)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-textMuted">
                      {formatTokens(u.outputTokens)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-textMuted">
                      {formatTokens(u.cacheTokens)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-textMain">
                      {formatTokens(u.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">${u.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
