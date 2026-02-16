import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DocList } from './DocList';
import { DocViewer } from './DocViewer';
import { Doc, DocCategory } from '../types';
import * as api from '../lib/api';
import { markdownToBlockNote, blockNoteToMarkdown } from '../lib/markdownConverter';
import { formatDocDate } from '../lib/docUtils';
import { useDebouncedSave, SaveStatus } from '../lib/useDebouncedSave';
import type { PartialBlock } from '@blocknote/core';

function indexItemToDoc(item: api.DocumentIndexItem): Doc {
  return {
    id: item.filename,
    title: item.title,
    emoji: item.emoji,
    date: formatDocDate(item.created_at),
    updatedAt: item.updated_at,
    category: item.category as DocCategory,
    blocks: [],
  };
}

export const DocsTab: React.FC = () => {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentCache, setContentCache] = useState<Record<string, PartialBlock[]>>({});

  // Fetch documents index
  const refreshDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.fetchDocuments();
      const docs = items.map(indexItemToDoc);
      setDocuments(docs);
      return docs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const docs = await refreshDocuments();
      if (!cancelled && docs.length > 0 && !selectedId) {
        // Select the most-recently-updated doc (matches DocList default sort)
        const sorted = [...docs].sort((a, b) =>
          (b.updatedAt || b.date || '').localeCompare(a.updatedAt || a.date || '')
        );
        setSelectedId(sorted[0].id);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new documents every 30s (e.g. dropped by OpenClaw)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const items = await api.fetchDocuments();
        const existingIds = new Set(documents.map((d) => d.id));
        const newDocs = items
          .map(indexItemToDoc)
          .filter((d) => !existingIds.has(d.id));
        if (newDocs.length > 0) {
          setDocuments((prev) => [...newDocs, ...prev]);
        }
      } catch { /* silent — polling failure is non-critical */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, [documents]);

  // Document content loading with proper retry support
  const fetchedRef = useRef<Set<string>>(new Set());
  const loadDocContent = useCallback(async (filename: string) => {
    if (fetchedRef.current.has(filename)) return;
    try {
      const markdown = await api.fetchDocumentContent(filename);
      const blocks = await markdownToBlockNote(markdown);
      fetchedRef.current.add(filename); // Only mark as fetched on success
      setContentCache((prev) => ({ ...prev, [filename]: blocks }));
    } catch (err) {
      console.error('Failed to load document content', err);
      // Don't add to fetchedRef — allows retry on next select
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadDocContent(selectedId);
  }, [selectedId, loadDocContent]);

  const selectedDoc: Doc | null = selectedId
    ? (() => {
        const doc = documents.find((d) => d.id === selectedId);
        if (!doc) return null;
        const blocks = contentCache[selectedId];
        return { ...doc, blocks: blocks ?? [] };
      })()
    : null;

  // Debounced save for content changes
  const saveFn = useCallback(async (...args: unknown[]) => {
    const [id, newBlocks, newTitle, editedBy] = args as [string, PartialBlock[], string | undefined, string | undefined];
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const filename = id;
    const markdown = await blockNoteToMarkdown(newBlocks);
    await api.saveDocumentContent(filename, markdown, editedBy);
    // Update cache
    setContentCache((prev) => ({ ...prev, [filename]: newBlocks }));
    // Sync title to index if changed
    if (newTitle && newTitle !== doc.title) {
      try {
        await api.updateDocumentMeta(filename, { title: newTitle });
      } catch { /* non-critical */ }
    }
    // Update local state
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, blocks: newBlocks, title: newTitle ?? d.title, updatedAt: new Date().toISOString() } : d))
    );
  }, [documents]);

  const { save: debouncedSave, flush: flushSave, status: saveStatus, error: saveError } = useDebouncedSave(saveFn, { delay: 800 });

  const handleSaveDoc = useCallback(
    (id: string, newBlocks: PartialBlock[], newTitle?: string, editedBy?: string) => {
      // DON'T update contentCache here — saveFn does it after API success.
      // Eagerly updating cache here causes a feedback loop:
      // save → cache update → selectedDoc re-derives → doc prop changes → effects fire

      // Optimistic title update only (lightweight, no content change)
      if (newTitle) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
        );
      }
      debouncedSave(id, newBlocks, newTitle, editedBy);
    },
    [debouncedSave]
  );

  const handleForceSave = useCallback(() => {
    flushSave();
  }, [flushSave]);

  // Update metadata (emoji, category) immediately
  const handleUpdateMeta = useCallback(async (id: string, meta: { emoji?: string; category?: string; title?: string }) => {
    try {
      await api.updateDocumentMeta(id, meta);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...meta, category: (meta.category ?? d.category) as DocCategory, updatedAt: new Date().toISOString() } : d))
      );
    } catch (err) {
      console.error('Failed to update document meta', err);
    }
  }, []);

  // Create new document
  const handleCreateDocument = useCallback(async () => {
    try {
      const newDoc = await api.createDocument({ title: 'Untitled', emoji: '📄', category: 'Guide' });
      const doc = indexItemToDoc(newDoc);
      setDocuments((prev) => [doc, ...prev]);
      setSelectedId(doc.id);
      // Pre-populate cache so the editor doesn't show "loading"
      const blocks = await markdownToBlockNote(`# Untitled\n\n`);
      setContentCache((prev) => ({ ...prev, [doc.id]: blocks }));
      fetchedRef.current.add(doc.id);
    } catch (err) {
      console.error('Failed to create document', err);
    }
  }, []);

  // Delete document
  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      await api.deleteDocument(id);
      fetchedRef.current.delete(id);
      setContentCache((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.id !== id);
        // Select next document or null
        if (selectedId === id) {
          setSelectedId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  }, [selectedId]);

  // Duplicate document
  const handleDuplicateDocument = useCallback(async (id: string) => {
    try {
      const newDoc = await api.duplicateDocument(id);
      const doc = indexItemToDoc(newDoc);
      setDocuments((prev) => [doc, ...prev]);
      setSelectedId(doc.id);
    } catch (err) {
      console.error('Failed to duplicate document', err);
    }
  }, []);

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-textMuted">
        Loading documents...
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
        <p>{error}</p>
        <p className="text-sm text-textMuted">Make sure the API server is running: npm run api</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#0d1117] overflow-hidden">
      <DocList
        documents={documents}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateDocument={handleCreateDocument}
        onDeleteDocument={handleDeleteDocument}
        onDuplicateDocument={handleDuplicateDocument}
      />
      <DocViewer
        doc={selectedDoc}
        onSave={handleSaveDoc}
        onForceSave={handleForceSave}
        onUpdateMeta={handleUpdateMeta}
        onCreateDocument={handleCreateDocument}
        saveStatus={saveStatus}
        saveError={saveError}
      />
    </div>
  );
};
