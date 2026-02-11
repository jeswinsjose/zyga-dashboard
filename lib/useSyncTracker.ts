/**
 * useSyncTracker — tracks the last successful API sync and provides freshness info.
 *
 * Any component can call `recordSync()` after a successful fetch.
 * The hook re-renders every 10s to keep the displayed time and dot colour current.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export type SyncFreshness = 'fresh' | 'stale' | 'disconnected';

interface SyncState {
  lastSyncAt: number | null;       // epoch ms
  formattedTime: string;           // "1:29:43 PM"
  freshness: SyncFreshness;
  dotColor: string;                // tailwind-compatible color class
  dotEmoji: string;                // 🟢 🟡 🔴
}

function computeState(lastSyncAt: number | null): SyncState {
  if (!lastSyncAt) {
    return {
      lastSyncAt: null,
      formattedTime: '—',
      freshness: 'disconnected',
      dotColor: 'text-red-500',
      dotEmoji: '🔴',
    };
  }

  const age = Date.now() - lastSyncAt;
  const formattedTime = new Date(lastSyncAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  if (age < 60_000) {
    // < 60s — fresh
    return { lastSyncAt, formattedTime, freshness: 'fresh', dotColor: 'text-green-500', dotEmoji: '🟢' };
  }
  if (age < 300_000) {
    // 1-5 min — stale
    return { lastSyncAt, formattedTime, freshness: 'stale', dotColor: 'text-yellow-500', dotEmoji: '🟡' };
  }
  // 5+ min — disconnected
  return { lastSyncAt, formattedTime, freshness: 'disconnected', dotColor: 'text-red-500', dotEmoji: '🔴' };
}

export function useSyncTracker() {
  const lastSyncRef = useRef<number | null>(null);
  const [state, setState] = useState<SyncState>(computeState(null));

  /** Call this after any successful API fetch */
  const recordSync = useCallback(() => {
    lastSyncRef.current = Date.now();
    setState(computeState(lastSyncRef.current));
  }, []);

  // Re-compute freshness every 10 seconds so the dot/color updates over time
  useEffect(() => {
    const id = setInterval(() => {
      setState(computeState(lastSyncRef.current));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return { ...state, recordSync };
}
