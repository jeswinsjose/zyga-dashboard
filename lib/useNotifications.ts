/**
 * useNotifications — tracks new/unread items per tab.
 *
 * Stores "last viewed" timestamp per tab in localStorage.
 * Polls lightweight API data to count items newer than lastViewed.
 * Returns badge counts and a markViewed(tab) function.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { TabId } from '../types';
import * as api from './api';

const STORAGE_KEY = 'zyga-tab-last-viewed';
const POLL_INTERVAL = 15_000; // 15 seconds

interface TabBadges {
  dashboard: number;
  docs: number;
  log: number;
  overview: number;
}

interface NotificationToast {
  id: string;
  message: string;
  timestamp: number;
}

function loadLastViewed(): Record<TabId, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Default: everything "seen" as of now
  const now = Date.now();
  return { dashboard: now, docs: now, log: now, overview: now };
}

function saveLastViewed(data: Record<TabId, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function useNotifications(activeTab: TabId) {
  const [badges, setBadges] = useState<TabBadges>({ dashboard: 0, docs: 0, log: 0, overview: 0 });
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const lastViewedRef = useRef(loadLastViewed());
  const prevLogIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // ── Mark current tab as viewed ──
  const markViewed = useCallback((tab: TabId) => {
    lastViewedRef.current = { ...lastViewedRef.current, [tab]: Date.now() };
    saveLastViewed(lastViewedRef.current);
    setBadges((prev) => ({ ...prev, [tab]: 0 }));
  }, []);

  // Auto-mark active tab as viewed whenever it changes
  useEffect(() => {
    markViewed(activeTab);
  }, [activeTab, markViewed]);

  // ── Dismiss a toast ──
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Poll APIs for new items ──
  const pollForUpdates = useCallback(async () => {
    const lv = lastViewedRef.current;

    try {
      // Fetch all sources in parallel
      const [tasks, logEntries, docs] = await Promise.all([
        api.fetchTasks().catch(() => [] as api.Task[]),
        api.fetchActivityLog().catch(() => [] as api.ActivityLogEntry[]),
        api.fetchDocuments().catch(() => [] as api.DocumentIndexItem[]),
      ]);

      // Dashboard: count tasks completed (in "done" column) after lastViewed
      const dashboardNew = tasks.filter(
        (t) => t.status === 'done' && t.createdAt > lv.dashboard
      ).length;

      // Log: count entries after lastViewed
      const logNew = logEntries.filter(
        (e) => new Date(e.timestamp).getTime() > lv.log
      ).length;

      // Docs: count documents updated after lastViewed
      const docsNew = docs.filter(
        (d) => new Date(d.updated_at).getTime() > lv.docs
      ).length;

      setBadges((prev) => ({
        ...prev,
        // Only update badges for tabs that are NOT the active tab
        dashboard: dashboardNew,
        log: logNew,
        docs: docsNew,
        overview: 0, // no badge for overview
      }));

      // ── Toast for new log entries (only after initial load) ──
      if (initialLoadDone.current) {
        const currentLogIds = new Set(logEntries.map((e) => e.id));
        const newEntries = logEntries.filter(
          (e) => !prevLogIdsRef.current.has(e.id)
        );
        if (newEntries.length > 0 && newEntries.length <= 5) {
          // Only toast for a reasonable number of new entries
          for (const entry of newEntries) {
            const toast: NotificationToast = {
              id: `toast-${entry.id}-${Date.now()}`,
              message: entry.description.length > 80
                ? entry.description.slice(0, 77) + '...'
                : entry.description,
              timestamp: Date.now(),
            };
            setToasts((prev) => [...prev.slice(-4), toast]); // max 5 toasts
          }
        }
        prevLogIdsRef.current = currentLogIds;
      } else {
        // First load — just record IDs, don't toast
        prevLogIdsRef.current = new Set(logEntries.map((e) => e.id));
        initialLoadDone.current = true;
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    pollForUpdates();
    const id = setInterval(pollForUpdates, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [pollForUpdates]);

  // ── Auto-dismiss toasts after 5 seconds ──
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismissToast(t.id), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return { badges, toasts, markViewed, dismissToast };
}
