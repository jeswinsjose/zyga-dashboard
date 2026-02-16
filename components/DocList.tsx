import React, { useState, useMemo, useCallback } from 'react';
import { Doc, DocCategory } from '../types';
import { getCategoryColor, getDocIcon } from '../lib/docUtils';

type SortKey = 'updated' | 'title' | 'category';

interface DocListProps {
  documents: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreateDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onDuplicateDocument: (id: string) => void;
}

export const DocList: React.FC<DocListProps> = ({
  documents,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  onCreateDocument,
  onDeleteDocument,
  onDuplicateDocument,
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('updated');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('zyga-doc-favorites');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('zyga-doc-favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const filteredAndSorted = useMemo(() => {
    let docs = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort favorites first, then by chosen key
    docs.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 0 : 1;
      const bFav = favorites.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'updated':
        default:
          return (b.updatedAt || b.date || '').localeCompare(a.updatedAt || a.date || '');
      }
    });

    return docs;
  }, [documents, searchQuery, sortBy, favorites]);

  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuId(docId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenuId(null);

  const handleDeleteConfirm = (id: string) => {
    onDeleteDocument(id);
    setDeleteConfirmId(null);
    closeContextMenu();
  };

  return (
    <div className="w-80 h-full flex flex-col border-r border-border bg-[#13171e]" onClick={closeContextMenu}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">Documents</h3>
          <button
            onClick={onCreateDocument}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            title="New document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full bg-[#0d1117] border border-border rounded-md py-2 pl-9 pr-3 text-sm text-textMain focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <svg className="absolute left-3 top-2.5 text-textMuted" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-1 mt-2">
          {(['updated', 'title', 'category'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sortBy === key
                  ? 'bg-primary/20 text-primary'
                  : 'text-textMuted hover:text-textMain hover:bg-[#1c2128]'
              }`}
            >
              {key === 'updated' ? 'Recent' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filteredAndSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-textMuted">
            <div className="text-3xl mb-3 opacity-30">📄</div>
            <p className="text-xs opacity-50">
              {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
            </p>
          </div>
        )}
        {filteredAndSorted.map(doc => {
          const isSelected = doc.id === selectedId;
          const isFav = favorites.has(doc.id);
          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              onContextMenu={(e) => handleContextMenu(e, doc.id)}
              className={`group p-3 rounded-md cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[#1c2128] border-primary/50 shadow-sm'
                  : 'bg-transparent border-transparent hover:bg-[#161b22] hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{getDocIcon(doc.category, doc.emoji)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className={`text-sm font-medium leading-snug truncate flex-1 ${isSelected ? 'text-white' : 'text-textMain'}`}>
                      {doc.title}
                    </h4>
                    {/* Favorite star */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id); }}
                      className={`shrink-0 text-xs transition-all ${
                        isFav
                          ? 'text-yellow-400 opacity-100'
                          : 'text-textMuted opacity-0 group-hover:opacity-50 hover:!opacity-100'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                    {/* Context menu trigger */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, doc.id); }}
                      className="shrink-0 text-textMuted opacity-0 group-hover:opacity-50 hover:!opacity-100 text-xs px-0.5 transition-all"
                      title="More options"
                    >
                      ···
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-textMuted">{doc.date}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenuId && (
        <>
          <div className="fixed inset-0 z-50" onClick={closeContextMenu} />
          <div
            className="fixed z-50 bg-[#1c2128] border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={() => { toggleFavorite(contextMenuId); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-[#30363d] transition-colors flex items-center gap-2"
            >
              {favorites.has(contextMenuId) ? '☆ Unfavorite' : '★ Favorite'}
            </button>
            <button
              onClick={() => { onDuplicateDocument(contextMenuId); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-[#30363d] transition-colors flex items-center gap-2"
            >
              📋 Duplicate
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => { setDeleteConfirmId(contextMenuId); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2"
            >
              🗑️ Delete
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1c2128] border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete document?</h3>
            <p className="text-sm text-textMuted mb-6">
              This will permanently delete "{documents.find(d => d.id === deleteConfirmId)?.title}". This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-textMuted hover:text-white hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
