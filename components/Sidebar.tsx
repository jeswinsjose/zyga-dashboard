import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, AgentState } from '../types';
import * as api from '../lib/api';

interface SidebarProps {
  status: AgentStatus;
  agentName?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateToOverview?: () => void;
}

/**
 * FACE emoji shown in the large avatar circle — this is Zyga's personality.
 * Chosen for natural transitions:
 *   Working 🫡 → Thinking 🤔 → Idle 😊 → Sleeping 😴
 *   Error 😵‍💫 → back to Working 🫡
 *   Cron 🤖 → back to Idle 😊
 */
const STATE_FACE: Record<AgentState, string> = {
  working: '🫡',
  thinking: '🤔',
  idle: '😊',
  sleeping: '😴',
  error: '😵‍💫',
  executing_cron: '🤖',
};

/** Small action/tool emoji shown in the status text line below the avatar */
const STATE_ICON: Record<AgentState, string> = {
  working: '🔨',
  thinking: '🧠',
  idle: '⚡',
  sleeping: '💤',
  error: '⚠️',
  executing_cron: '⏰',
};

/** Colour for the status text line */
const STATE_TEXT_COLOR: Record<AgentState, string> = {
  working: 'text-[#d29922]',
  thinking: 'text-[#8b5cf6]',
  idle: 'text-[#3fb950]',
  sleeping: 'text-[#8b949e]',
  error: 'text-[#f85149]',
  executing_cron: 'text-[#58a6ff]',
};

/** Human-readable label for each state */
const STATE_LABEL: Record<AgentState, string> = {
  working: 'Working',
  thinking: 'Thinking...',
  idle: 'Idle',
  sleeping: 'Sleeping',
  error: 'Error',
  executing_cron: 'Running cron job...',
};

/** Border colour for the avatar ring */
const STATE_BORDER: Record<AgentState, string> = {
  working: 'border-[#d29922]',
  thinking: 'border-[#8b5cf6]',
  idle: 'border-[#3fb950]',
  sleeping: 'border-[#8b949e]/40',
  error: 'border-[#f85149]',
  executing_cron: 'border-[#58a6ff]',
};

/** Determine the status-indicator dot colour + whether it pulses */
function getDotStyle(state: AgentState): { bg: string; pulse: boolean } {
  switch (state) {
    case 'error':
      return { bg: 'bg-[#f85149]', pulse: true };
    case 'sleeping':
      return { bg: 'bg-[#8b949e]', pulse: false };
    default:
      return { bg: 'bg-[#3fb950]', pulse: true };
  }
}

/** Format seconds to "Xd Yh Zm" */
function formatUptime(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

/** Get memory percentage colour */
function getMemoryColor(percentage: number): string {
  if (percentage >= 90) return 'text-[#f85149]';   // red
  if (percentage >= 80) return 'text-[#d29922]';   // orange
  return 'text-textMain';                           // default
}

function getMemoryBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-[#f85149]';
  if (percentage >= 80) return 'bg-[#d29922]';
  return 'bg-[#3fb950]';
}

const SYSTEM_POLL_INTERVAL = 30_000; // 30s
const COST_POLL_INTERVAL = 60_000;   // 60s

export const Sidebar: React.FC<SidebarProps> = ({ status, agentName = 'Zyga', collapsed = false, onToggleCollapse, onNavigateToOverview }) => {
  const { state } = status;
  const dot = getDotStyle(state);

  // ── System Info state ──
  const [memUsed, setMemUsed] = useState('—');
  const [memTotal, setMemTotal] = useState('—');
  const [memPercent, setMemPercent] = useState(0);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const lastFetchedUptime = useRef<{ seconds: number; at: number } | null>(null);

  // ── Cost widget state ──
  const [todayCost, setTodayCost] = useState<number | null>(null);
  const [yesterdayCost] = useState<number>(10.82); // mock "yesterday" for % change

  // ── Heartbeat state ──
  const [heartbeatLoading, setHeartbeatLoading] = useState(false);
  const [heartbeatResult, setHeartbeatResult] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const [nextHeartbeat, setNextHeartbeat] = useState<number | null>(null);
  const [heartbeatAgo, setHeartbeatAgo] = useState<string>('—');

  // ── Poll /api/system-info ──
  const fetchSystemInfo = useCallback(async () => {
    try {
      const info = await api.fetchSystemInfo();
      setMemUsed(info.memory.used);
      setMemTotal(info.memory.total);
      setMemPercent(info.memory.percentage);
      setUptimeSeconds(info.uptimeSeconds);
      setPing(info.ping);
      lastFetchedUptime.current = { seconds: info.uptimeSeconds, at: Date.now() };
    } catch {
      // keep last known values
    }
  }, []);

  useEffect(() => {
    fetchSystemInfo();
    const id = setInterval(fetchSystemInfo, SYSTEM_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchSystemInfo]);

  // ── Live uptime tick (every 60s between polls) ──
  useEffect(() => {
    const id = setInterval(() => {
      if (lastFetchedUptime.current) {
        const elapsed = Math.floor((Date.now() - lastFetchedUptime.current.at) / 1000);
        setUptimeSeconds(lastFetchedUptime.current.seconds + elapsed);
      }
    }, 60_000); // tick every minute
    return () => clearInterval(id);
  }, []);

  // ── Poll /api/overview for today's cost ──
  const fetchCost = useCallback(async () => {
    try {
      const data = await api.fetchOverview();
      setTodayCost(data.costs.today);
    } catch {
      // keep last known
    }
  }, []);

  useEffect(() => {
    fetchCost();
    const id = setInterval(fetchCost, COST_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchCost]);

  // ── Fetch heartbeat status on mount ──
  const fetchHeartbeat = useCallback(async () => {
    try {
      const hb = await api.fetchHeartbeatStatus();
      setLastHeartbeat(new Date(hb.lastRun).getTime());
      setNextHeartbeat(new Date(hb.nextRun).getTime());
      if (hb.result) setHeartbeatResult(hb.result);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchHeartbeat();
  }, [fetchHeartbeat]);

  // ── Trigger heartbeat ──
  const handleHeartbeat = useCallback(async () => {
    if (heartbeatLoading) return;
    setHeartbeatLoading(true);
    setHeartbeatResult(null);
    try {
      const hb = await api.triggerHeartbeat();
      setLastHeartbeat(new Date(hb.lastRun).getTime());
      setNextHeartbeat(new Date(hb.nextRun).getTime());
      setHeartbeatResult(hb.result || 'Heartbeat OK');
    } catch {
      setHeartbeatResult('Heartbeat failed');
    } finally {
      setHeartbeatLoading(false);
    }
  }, [heartbeatLoading]);

  // ── Tick "X ago" every 30s ──
  useEffect(() => {
    const compute = () => {
      if (!lastHeartbeat) { setHeartbeatAgo('—'); return; }
      const diff = Math.floor((Date.now() - lastHeartbeat) / 1000);
      if (diff < 60) setHeartbeatAgo('just now');
      else if (diff < 3600) setHeartbeatAgo(`${Math.floor(diff / 60)}m ago`);
      else setHeartbeatAgo(`${Math.floor(diff / 3600)}h ago`);
    };
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [lastHeartbeat]);

  // Should the button pulse? Pulse when within 30s of next heartbeat
  const shouldPulse = nextHeartbeat !== null && nextHeartbeat - Date.now() < 30_000 && !heartbeatLoading;

  // ── Computed values ──
  const uptimeDisplay = uptimeSeconds !== null ? formatUptime(uptimeSeconds) : '—';
  const pingColor = ping !== null && ping < 50 ? 'text-green-400' : ping !== null && ping < 100 ? 'text-[#d29922]' : 'text-[#f85149]';

  // Cost change %
  const costChange = todayCost !== null && yesterdayCost > 0
    ? Math.round(((todayCost - yesterdayCost) / yesterdayCost) * 100)
    : null;
  const costUp = costChange !== null && costChange >= 0;
  const costColor = costChange === null
    ? 'text-textMuted'
    : costChange > 30
      ? 'text-[#f85149]'  // red — significantly over
      : costChange > 0
        ? 'text-[#d29922]' // orange — above
        : 'text-[#3fb950]'; // green — below

  // ── Collapsed (icon-only) sidebar ──
  if (collapsed) {
    return (
      <div className="w-16 h-full bg-surface border-r border-border flex flex-col shrink-0 items-center py-4 gap-4">
        {/* Avatar mini */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-full bg-[#21262d] flex items-center justify-center border-2 ${STATE_BORDER[state]} avatar-ring-${state}`}>
            <span className={`text-xl select-none avatar-anim-${state}`}>{STATE_FACE[state]}</span>
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${dot.bg} ${dot.pulse ? 'status-dot-pulse' : ''}`}
            style={dot.pulse ? ({ '--dot-color': state === 'error' ? 'rgba(248,81,73,0.5)' : 'rgba(63,185,80,0.5)' } as React.CSSProperties) : undefined}
          />
        </div>

        {/* Expand button */}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="text-textMuted hover:text-white transition-colors text-lg" title="Expand sidebar">
            »
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Heartbeat mini */}
        <button
          onClick={handleHeartbeat}
          disabled={heartbeatLoading}
          className="text-lg hover:scale-110 transition-transform"
          title="Heartbeat check"
        >
          {heartbeatLoading ? '⏳' : '🫀'}
        </button>
      </div>
    );
  }

  // ── Full sidebar ──
  return (
    <div className="w-64 h-full bg-surface border-r border-border flex flex-col shrink-0">
      {/* Collapse button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-2 right-2 z-20 text-textMuted hover:text-white text-xs p-1 transition-colors hidden lg:block"
          title="Collapse sidebar"
        >
          «
        </button>
      )}

      {/* ─── Header / Animated Avatar ─── */}
      <div className="p-6 flex flex-col items-center border-b border-border/50 relative">
        {/* Avatar circle */}
        <div className="relative mb-3">
          <div
            className={`
              w-20 h-20 rounded-full bg-[#21262d] flex items-center justify-center
              border-2 ${STATE_BORDER[state]} shadow-lg transition-colors duration-500
              avatar-ring-${state}
            `}
          >
            {/* Animated face — Zyga's personality */}
            <span className={`text-4xl select-none avatar-anim-${state}`}>
              {STATE_FACE[state]}
            </span>

            {/* Floating Z's for sleeping */}
            {state === 'sleeping' && (
              <span className="absolute top-0 right-0">
                <span className="sleeping-z">💤</span>
                <span className="sleeping-z">💤</span>
                <span className="sleeping-z">💤</span>
              </span>
            )}
          </div>

          {/* Status dot */}
          <div
            className={`
              absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface
              ${dot.bg} ${dot.pulse ? 'status-dot-pulse' : ''}
            `}
            style={
              dot.pulse
                ? ({ '--dot-color': state === 'error' ? 'rgba(248,81,73,0.5)' : 'rgba(63,185,80,0.5)' } as React.CSSProperties)
                : undefined
            }
          />
        </div>

        <h2 className="text-xl font-bold text-white tracking-wide">{agentName}</h2>

        {/* Status Line — small action icon + label */}
        <div className={`mt-2 flex items-center space-x-2 ${STATE_TEXT_COLOR[state]} font-medium text-sm transition-colors duration-300`}>
          <span>{STATE_ICON[state]}</span>
          <span>{STATE_LABEL[state]}</span>
        </div>

        {/* Current Task Description */}
        <div className="mt-4 px-3 py-2 bg-background rounded-md border border-border w-full text-center">
          <p className="text-xs text-textMuted leading-relaxed">{status.message}</p>
        </div>

        {/* Helpers Indicator */}
        {status.hasHelpers && (
          <div className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-purple-900/20 border border-purple-500/30 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-xs text-purple-200 font-medium">Helpers at work</span>
          </div>
        )}
      </div>

      {/* ─── System Info (live data) ─── */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        <div>
          <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-3">System Info</div>
          <div className="space-y-3 text-sm">
            {/* Memory */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-textMuted">Memory</span>
                <span className={`font-mono text-xs ${getMemoryColor(memPercent)}`}>
                  {memUsed}GB / {memTotal}GB
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getMemoryBarColor(memPercent)}`}
                  style={{ width: `${memPercent}%` }}
                />
              </div>
              {memPercent >= 80 && (
                <p className={`text-[10px] mt-0.5 ${getMemoryColor(memPercent)}`}>
                  {memPercent >= 90 ? 'Critical memory usage' : 'High memory usage'}
                </p>
              )}
            </div>

            {/* Uptime */}
            <div className="flex justify-between">
              <span className="text-textMuted">Uptime</span>
              <span className="font-mono text-xs text-textMain">{uptimeDisplay}</span>
            </div>

            {/* Ping */}
            <div className="flex justify-between">
              <span className="text-textMuted">Ping</span>
              <span className={`font-mono text-xs ${pingColor}`}>
                {ping !== null ? `${ping}ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Cost Tracker Widget ─── */}
        <div
          className={`p-3 bg-background rounded-lg border border-border ${onNavigateToOverview ? 'cursor-pointer hover:border-[#8b5cf6]/50 transition-colors' : ''}`}
          onClick={onNavigateToOverview}
          title={onNavigateToOverview ? 'View full cost breakdown in Overview' : undefined}
        >
          <div className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-1.5">Today's Cost</div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white font-mono">
              {todayCost !== null ? `$${todayCost.toFixed(2)}` : '—'}
            </span>
            {costChange !== null && (
              <span className={`text-xs font-medium ${costColor} flex items-center gap-0.5`}>
                {costUp ? '↑' : '↓'} {Math.abs(costChange)}%
              </span>
            )}
          </div>
          {onNavigateToOverview && (
            <p className="text-[10px] text-textMuted/50 mt-1">Click for details →</p>
          )}
        </div>
      </div>

      {/* ─── Heartbeat Section ─── */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleHeartbeat}
          disabled={heartbeatLoading}
          className={`
            w-full py-2.5 px-4 rounded border bg-background text-sm transition-all duration-200 flex items-center justify-center gap-2
            ${heartbeatLoading
              ? 'border-[#8b5cf6]/40 text-[#8b5cf6] cursor-wait'
              : shouldPulse
                ? 'heartbeat-pulse-anim text-textMuted hover:bg-[#21262d] hover:text-textMain'
                : 'border-border text-textMuted hover:bg-[#21262d] hover:text-textMain'
            }
          `}
        >
          {heartbeatLoading ? (
            <>
              <span className="heartbeat-spinner" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <span>🫀</span>
              <span>Heartbeat check</span>
            </>
          )}
        </button>

        {/* Result message */}
        {heartbeatResult && !heartbeatLoading && (
          <p className={`text-[11px] text-center leading-relaxed ${
            heartbeatResult.includes('failed') ? 'text-[#f85149]' : 'text-[#3fb950]'
          }`}>
            {heartbeatResult}
          </p>
        )}

        {/* Last heartbeat time */}
        <p className="text-[10px] text-textMuted/50 text-center">
          Last heartbeat: {heartbeatAgo}
        </p>
      </div>
    </div>
  );
};
