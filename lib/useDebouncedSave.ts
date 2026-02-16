/**
 * Hook for debounced document saving with status tracking.
 * Prevents excessive API calls by batching rapid changes.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseDebouncedSaveOptions {
  delay?: number;
  savedDisplayMs?: number;
}

interface UseDebouncedSaveReturn {
  save: (...args: unknown[]) => void;
  flush: () => void;
  status: SaveStatus;
  error: string | null;
}

export function useDebouncedSave(
  saveFn: (...args: unknown[]) => Promise<void>,
  options: UseDebouncedSaveOptions = {}
): UseDebouncedSaveReturn {
  const { delay = 800, savedDisplayMs = 2000 } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<unknown[] | null>(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const executeSave = useCallback(async (args: unknown[]) => {
    setStatus('saving');
    setError(null);
    try {
      await saveFnRef.current(...args);
      setStatus('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus('idle'), savedDisplayMs);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }, [savedDisplayMs]);

  const save = useCallback((...args: unknown[]) => {
    pendingArgsRef.current = args;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pendingArgsRef.current) {
        executeSave(pendingArgsRef.current);
        pendingArgsRef.current = null;
      }
    }, delay);
  }, [delay, executeSave]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingArgsRef.current) {
      executeSave(pendingArgsRef.current);
      pendingArgsRef.current = null;
    }
  }, [executeSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { save, flush, status, error };
}
