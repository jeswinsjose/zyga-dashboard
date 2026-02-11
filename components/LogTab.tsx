import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogEntry, LogType } from '../types';
import * as api from '../lib/api';

function mapApiEntryToLog(entry: api.ActivityLogEntry): LogEntry {
  const typeMap: Record<string, LogType> = {
    completed: 'success',
    success: 'success',
    info: 'info',
    heartbeat: 'heartbeat',
    warning: 'warning',
    error: 'error',
  };
  return {
    id: entry.id,
    timestamp: new Date(entry.timestamp).getTime(),
    type: typeMap[entry.type] || 'info',
    message: entry.description,
  };
}

// ── Filter pill definitions ──
type FilterKey = 'all' | LogType;

interface FilterDef {
  key: FilterKey;
  label: string;
  color: string;        // pill active bg
  activeText: string;   // pill active text
}

const FILTERS: FilterDef[] = [
  { key: 'all',       label: 'All',       color: 'bg-[#8b5cf6]/20 border-[#8b5cf6]/50', activeText: 'text-[#8b5cf6]' },
  { key: 'success',   label: 'Completed', color: 'bg-green-500/15 border-green-500/40',  activeText: 'text-green-400' },
  { key: 'info',      label: 'Info',      color: 'bg-blue-500/15 border-blue-500/40',    activeText: 'text-blue-400' },
  { key: 'heartbeat', label: 'Heartbeat', color: 'bg-yellow-500/15 border-yellow-500/40', activeText: 'text-yellow-400' },
  { key: 'error',     label: 'Error',     color: 'bg-red-500/15 border-red-500/40',      activeText: 'text-red-400' },
  { key: 'warning',   label: 'Warning',   color: 'bg-orange-500/15 border-orange-500/40', activeText: 'text-orange-400' },
];

// ── Expandable log entry ──
const ExpandableEntry: React.FC<{ log: LogEntry; dotColor: string }> = ({ log, dotColor }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = log.message.length > 140;

  return (
    <div className="relative pl-8 group">
      <div
        className={`absolute -left-[7px] top-4 w-3.5 h-3.5 rounded-full border-2 border-[#0d1117] ${dotColor} z-10 transition-transform group-hover:scale-125`}
      />
      <div
        className={`bg-[#161b22] border border-border rounded-lg p-4 shadow-sm hover:border-gray-600 transition-all duration-200 ${isLong ? 'cursor-pointer' : ''}`}
        onClick={isLong ? () => setExpanded((p) => !p) : undefined}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-20 pt-0.5">
            <span className="text-xs font-mono font-medium text-primary/80">
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm text-textMain leading-relaxed transition-all duration-300 ${
                !expanded && isLong ? 'line-clamp-2' : ''
              }`}
            >
              {log.message}
            </p>
            {isLong && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
                className="text-[11px] text-[#8b5cf6] hover:text-[#a78bfa] mt-1 font-medium transition-colors"
              >
                {expanded ? '▲ Show less' : '▼ Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogTab: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.fetchActivityLog(dateFilter || undefined);
        if (!cancelled) {
          setEntries(data.map(mapApiEntryToLog));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity log');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dateFilter]);

  // ── Compute type counts from all entries (before filtering) ──
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }
    return counts;
  }, [entries]);

  // ── Apply type filter + search ──
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.message.toLowerCase().includes(q));
    }
    return result;
  }, [entries, typeFilter, searchQuery]);

  // ── Group by date ──
  const groupedLogs: Record<string, LogEntry[]> = {};
  filteredEntries.forEach((log) => {
    const date = new Date(log.timestamp);
    const dateStr = date
      .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      .toUpperCase();
    if (!groupedLogs[dateStr]) groupedLogs[dateStr] = [];
    groupedLogs[dateStr].push(log);
  });

  const getDotColor = (type: LogType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'info':
        return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
      case 'warning':
        return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
      case 'heartbeat':
        return 'bg-yellow-500 border-yellow-200';
      case 'error':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-textMuted">
        Loading activity log...
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

  return (
    <div className="flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-[#0d1117] sticky top-0 z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-white">Activity Log</h2>
            </div>
            <p className="text-sm text-textMuted mt-1">
              A chronological record of Zyga's actions and completed tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#161b22] border border-border rounded-md px-3 py-1.5 text-sm text-textMain focus:outline-none focus:border-primary"
            />
            <span className="bg-[#161b22] border border-border text-textMuted px-3 py-1 rounded-full text-xs font-medium">
              {filteredEntries.length} entries
            </span>
          </div>
        </div>

        {/* Search + Filter pills row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="bg-[#161b22] border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary w-52 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-textMuted hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Filter pills */}
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? entries.length : (typeCounts[f.key] || 0);
            if (f.key !== 'all' && count === 0) return null; // hide empty filters
            const isActive = typeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                  isActive
                    ? `${f.color} ${f.activeText}`
                    : 'border-border text-textMuted hover:text-textMain hover:border-textMuted'
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-12 text-textMuted text-sm">
              {searchQuery || typeFilter !== 'all'
                ? 'No entries match your filters.'
                : 'No entries found.'}
            </div>
          ) : (
            Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date} className="mb-10 animate-fade-in-up">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-lg">🗓️</span>
                  <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">{date}</h3>
                  <div className="h-px bg-border flex-1 ml-2"></div>
                </div>

                {/* Timeline Container */}
                <div className="relative border-l-2 border-border/40 ml-4 space-y-6 pb-2">
                  {logs.map((log) => (
                    <ExpandableEntry key={log.id} log={log} dotColor={getDotColor(log.type)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
