import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DocList } from './DocList';
import { DocViewer } from './DocViewer';
import { Doc, DocCategory } from '../types';
import * as api from '../lib/api';
import { markdownToBlockNote, blockNoteToMarkdown } from '../lib/markdownConverter';
import type { PartialBlock } from '@blocknote/core';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function indexItemToDoc(item: api.DocumentIndexItem): Doc {
  return {
    id: item.filename,
    title: item.title,
    date: formatDate(item.updated_at || item.created_at),
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await api.fetchDocuments();
        const docs = items.map(indexItemToDoc);
        if (!cancelled) {
          setDocuments(docs);
          if (docs.length > 0 && !selectedId) {
            setSelectedId(docs[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchedRef = useRef<Set<string>>(new Set());
  const loadDocContent = useCallback(async (filename: string) => {
    if (fetchedRef.current.has(filename)) return;
    fetchedRef.current.add(filename);
    try {
      const markdown = await api.fetchDocumentContent(filename);
      const blocks = markdownToBlockNote(markdown);
      setContentCache((prev) => ({ ...prev, [filename]: blocks }));
    } catch (err) {
      console.error('Failed to load document content', err);
      fetchedRef.current.delete(filename);
      setContentCache((prev) => ({ ...prev, [filename]: [{ type: 'paragraph', content: 'Failed to load document.' }] }));
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

  const handleSaveDoc = useCallback(
    async (id: string, newBlocks: PartialBlock[], newTitle?: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const filename = id;
      try {
        const markdown = blockNoteToMarkdown(newBlocks);
        await api.saveDocumentContent(filename, markdown);
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, blocks: newBlocks, title: newTitle ?? d.title } : d))
        );
        setContentCache((prev) => ({ ...prev, [filename]: newBlocks }));
      } catch (err) {
        console.error('Failed to save document', err);
      }
    },
    [documents]
  );

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-textMuted">
        Loading documents...
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
    <div className="flex h-full w-full bg-[#0d1117] overflow-hidden">
      <DocList
        documents={documents}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <DocViewer doc={selectedDoc} onSave={handleSaveDoc} />
    </div>
  );
};
