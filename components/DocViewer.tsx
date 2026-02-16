import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Doc, DocCategory } from '../types';
import type { PartialBlock } from '@blocknote/core';
import { BlockNoteEditor } from './BlockNoteEditor';
import { getCategoryColor, getDocIcon, DOC_CATEGORIES, relativeTime, countWords, EMOJI_PALETTE } from '../lib/docUtils';
import { blockNoteToMarkdown } from '../lib/markdownConverter';
import type { SaveStatus } from '../lib/useDebouncedSave';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as api from '../lib/api';
import type { VersionEntry } from '../lib/api';

interface DocViewerProps {
  doc: Doc | null;
  onSave: (id: string, newBlocks: PartialBlock[], newTitle?: string, editedBy?: string) => void;
  onForceSave: () => void;
  onUpdateMeta: (id: string, meta: { emoji?: string; category?: string; title?: string }) => void;
  onCreateDocument: () => void;
  saveStatus: SaveStatus;
  saveError: string | null;
}

export const DocViewer: React.FC<DocViewerProps> = ({
  doc,
  onSave,
  onForceSave,
  onUpdateMeta,
  onCreateDocument,
  saveStatus,
  saveError,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [blocks, setBlocks] = useState<PartialBlock[]>(() => doc?.blocks ?? []);
  const [title, setTitle] = useState(() => doc?.title ?? '');
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versionPreview, setVersionPreview] = useState('');
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [tocHovered, setTocHovered] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const prevDocIdRef = useRef<string | null>(null);
  const prevBlocksLenRef = useRef<number>(0);

  // Sync state when doc changes
  useEffect(() => {
    if (!doc) return;

    const docChanged = doc.id !== prevDocIdRef.current;

    if (docChanged) {
      // New document selected — full reset
      prevDocIdRef.current = doc.id;
      prevBlocksLenRef.current = doc.blocks?.length ?? 0;
      setBlocks(doc.blocks || []);
      setTitle(doc.title);
      setIsEditing(false);
      return;
    }

    // Same doc — only update blocks if they were loaded from cache
    // (i.e. went from empty to populated, meaning async content arrived)
    const hadNoBlocks = prevBlocksLenRef.current === 0;
    const nowHasBlocks = (doc.blocks?.length ?? 0) > 0;
    if (hadNoBlocks && nowHasBlocks) {
      prevBlocksLenRef.current = doc.blocks!.length;
      setBlocks(doc.blocks!);
    }
  }, [doc]);

  // Strip leading H1 block if it matches the doc title (already shown in header)
  const displayBlocks = useMemo(() => {
    if (!blocks || blocks.length === 0 || !doc?.title) return blocks;
    const first = blocks[0] as any;
    if (first?.type === 'heading' && first?.props?.level === 1) {
      // Extract text content from the heading block
      const headingText = (first.content || [])
        .map((c: any) => c.text || '')
        .join('')
        .trim();
      if (headingText === doc.title.trim()) {
        return blocks.slice(1);
      }
    }
    return blocks;
  }, [blocks, doc?.title]);

  // Generate markdown for preview (async because BlockNote v0.46+ uses async converters)
  const [markdownContent, setMarkdownContent] = useState('');
  useEffect(() => {
    let cancelled = false;
    if (!displayBlocks || displayBlocks.length === 0) {
      setMarkdownContent('');
      return;
    }
    blockNoteToMarkdown(displayBlocks).then((md) => {
      if (!cancelled) {
        setMarkdownContent(md);
      }
    });
    return () => { cancelled = true; };
  }, [displayBlocks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!doc) return;
      // Ctrl+S = force save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onForceSave();
      }
      // Ctrl+E = toggle edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditing((p) => !p);
      }
      // Ctrl+N = new document
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onCreateDocument();
      }
      // Escape = exit edit mode
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, isEditing, onForceSave, onCreateDocument]);

  // Extract headings for TOC
  const headings = useMemo(() => {
    if (!blocks?.length) return [];
    return blocks
      .filter((b: any) => b.type === 'heading')
      .map((b: any) => ({
        id: b.id,
        level: b.props?.level ?? 1,
        text: typeof b.content === 'string'
          ? b.content
          : Array.isArray(b.content)
            ? b.content.map((c: any) => c.text || '').join('')
            : '',
      }));
  }, [blocks]);

  // Word count from blocks
  const wordCount = useMemo(() => {
    if (!blocks?.length) return 0;
    const extractText = (block: any): string => {
      let text = '';
      if (typeof block.content === 'string') {
        text = block.content;
      } else if (Array.isArray(block.content)) {
        text = block.content.map((c: any) => c.text || '').join(' ');
      }
      if (block.children?.length) {
        text += ' ' + block.children.map(extractText).join(' ');
      }
      return text;
    };
    const allText = blocks.map(extractText).join(' ');
    return countWords(allText);
  }, [blocks]);

  if (!doc) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-textMuted bg-[#0d1117]">
        <div className="text-6xl mb-6 opacity-10">📝</div>
        <p className="text-lg font-medium opacity-50 mb-4">Select a document to view or edit</p>
        <button
          onClick={onCreateDocument}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primaryHover text-white transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create your first document
        </button>
      </div>
    );
  }

  const handleBlocksChange = (newBlocks: PartialBlock[]) => {
    setBlocks(newBlocks);
    // Only persist when the user is actually editing — not during editor initialization
    if (isEditing) {
      onSave(doc.id, newBlocks, title, 'User');
    }
  };

  const handleTitleBlur = () => {
    if (title !== doc.title) {
      onSave(doc.id, blocksRef.current, title, 'User');
      onUpdateMeta(doc.id, { title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDone = () => {
    if (title !== doc.title) {
      onSave(doc.id, blocksRef.current, title, 'User');
      onUpdateMeta(doc.id, { title });
    }
    onForceSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBlocks(doc.blocks || []);
    setTitle(doc.title);
    setIsEditing(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onUpdateMeta(doc.id, { emoji });
    setShowEmojiPicker(false);
  };

  const handleCategorySelect = (category: string) => {
    onUpdateMeta(doc.id, { category });
    setShowCategoryDropdown(false);
  };

  // Save status display
  const saveStatusEl = (() => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-[10px] text-textMuted flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Saving...
        </span>;
      case 'saved':
        return <span className="text-[10px] text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Saved
        </span>;
      case 'error':
        return <span className="text-[10px] text-red-400 flex items-center gap-1" title={saveError || 'Save failed'}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed
          <button onClick={onForceSave} className="underline ml-1">Retry</button>
        </span>;
      default:
        return null;
    }
  })();

  const currentIcon = getDocIcon(doc.category, doc.emoji);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0d1117] relative">

      {/* Top Navigation Bar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-[#0d1117]/80 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-2 text-xs text-textMuted">
          <span className="hover:text-textMain cursor-pointer">Documents</span>
          <span>/</span>
          <span className="text-textMain truncate max-w-[200px]">{title || doc.title}</span>
          {isEditing ? (
             <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-medium ml-2">Editing</span>
          ) : (
             <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-medium ml-2">Preview</span>
          )}
          {saveStatusEl && <span className="ml-2">{saveStatusEl}</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Version History toggle */}
          <button
            onClick={async () => {
              const next = !showVersionHistory;
              setShowVersionHistory(next);
              if (next && doc) {
                setVersionsLoading(true);
                try {
                  const v = await api.fetchVersions(doc.id);
                  setVersions(v);
                } catch { setVersions([]); }
                setVersionsLoading(false);
              } else {
                setSelectedVersion(null);
                setVersionPreview('');
              }
            }}
            className={`p-1.5 rounded-md text-xs transition-colors ${showVersionHistory ? 'text-primary bg-primary/10' : 'text-textMuted hover:text-textMain hover:bg-[#30363d]'}`}
            title="Version history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </button>

          {/* Full width toggle */}
          <button
            onClick={() => setIsFullWidth((p) => !p)}
            className={`p-1.5 rounded-md text-xs transition-colors ${isFullWidth ? 'text-primary bg-primary/10' : 'text-textMuted hover:text-textMain hover:bg-[#30363d]'}`}
            title={isFullWidth ? 'Narrow width' : 'Full width'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullWidth ? (
                <>
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </>
              )}
            </svg>
          </button>

          {/* Edit/Done/Cancel controls */}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-textMuted hover:text-white hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary hover:bg-primaryHover text-white transition-colors shadow flex items-center gap-2"
              >
                Done
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-textMain hover:text-white hover:bg-[#30363d] border border-border transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Content + Optional TOC Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center">
          <div key={doc.id} className={`w-full ${isFullWidth ? 'max-w-6xl px-8' : 'max-w-4xl px-16'} py-12 flex flex-col transition-all`}>

            {/* Document Header */}
            <div className="mb-8 group">
              {/* Emoji icon - clickable for picker */}
              <div className="relative inline-block">
                <button
                  onClick={() => isEditing && setShowEmojiPicker((p) => !p)}
                  className={`text-6xl mb-6 select-none inline-block transition-transform origin-left ${isEditing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                  title={isEditing ? 'Change icon' : undefined}
                >
                  {currentIcon}
                </button>

                {/* Emoji picker dropdown */}
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute top-full left-0 z-40 bg-[#1c2128] border border-border rounded-xl shadow-2xl p-3 w-[280px]">
                      <p className="text-[10px] text-textMuted uppercase font-bold mb-2 px-1">Choose icon</p>
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_PALETTE.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className={`text-xl p-1.5 rounded hover:bg-[#30363d] transition-colors ${emoji === currentIcon ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Title */}
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="Untitled"
                  className="w-full bg-transparent text-4xl font-bold text-white placeholder-gray-700 border-none focus:outline-none focus:ring-0 p-0 mb-6"
                />
              ) : (
                <h1
                  className="text-4xl font-bold text-white mb-6 leading-tight cursor-text"
                  onClick={() => setIsEditing(true)}
                >
                  {title || 'Untitled'}
                </h1>
              )}

              {/* Properties Block */}
              <div className="space-y-1 mb-8 text-sm">
                <div className="flex items-center gap-4 py-1">
                  <span className="w-28 text-textMuted flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Date created
                  </span>
                  <span className="text-textMain">{doc.date}</span>
                </div>

                {doc.updatedAt && (
                  <div className="flex items-center gap-4 py-1">
                    <span className="w-28 text-textMuted flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Last edited
                    </span>
                    <span className="text-textMuted">{relativeTime(doc.updatedAt)}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 py-1 relative">
                  <span className="w-28 text-textMuted flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    Category
                  </span>
                  <button
                    onClick={() => isEditing && setShowCategoryDropdown((p) => !p)}
                    className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(doc.category)} ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
                  >
                    {doc.category}
                  </button>

                  {/* Category dropdown */}
                  {showCategoryDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowCategoryDropdown(false)} />
                      <div className="absolute left-32 top-full z-40 bg-[#1c2128] border border-border rounded-lg shadow-xl py-1 min-w-[140px] mt-1">
                        {DOC_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[#30363d] transition-colors flex items-center gap-2 ${
                              cat === doc.category ? 'text-primary' : 'text-textMain'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${getCategoryColor(cat).split(' ')[0].replace('text-', 'bg-')}`} />
                            {cat}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-border/50 mb-4"></div>
            </div>

            {/* BlockNote Editor or Preview */}
            <div className="min-h-[500px]">
              {isEditing ? (
                <BlockNoteEditor
                  docId={doc.id}
                  blocks={displayBlocks}
                  onChange={handleBlocksChange}
                  readOnly={false}
                />
              ) : (
                <div className="prose prose-invert max-w-none text-[#c9d1d9] mb-32">
                  {markdownContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-textMuted italic opacity-50">Empty document. Click Edit to add content.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Version History Slide-in Panel */}
        {showVersionHistory && (
          <div className="w-72 border-l border-border bg-[#0d1117] flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider">Version History</h4>
              <button onClick={() => { setShowVersionHistory(false); setSelectedVersion(null); setVersionPreview(''); }} className="text-textMuted hover:text-white text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {versionsLoading ? (
                <div className="p-4 text-xs text-textMuted">Loading...</div>
              ) : versions.length === 0 ? (
                <div className="p-4 text-xs text-textMuted italic">No previous versions yet. Versions are created each time you save.</div>
              ) : (
                <div className="p-2 space-y-1">
                  {versions.map((v) => (
                    <button
                      key={v.file}
                      onClick={async () => {
                        setSelectedVersion(v.file);
                        if (doc) {
                          try {
                            const content = await api.fetchVersionContent(doc.id, v.file);
                            setVersionPreview(content);
                          } catch { setVersionPreview('Failed to load version.'); }
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                        selectedVersion === v.file ? 'bg-primary/15 border border-primary/30' : 'hover:bg-[#161b22] border border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-textMain">{v.author === 'User' ? 'You' : (v.author || 'OpenClaw')}</span>
                        <span className="text-textMuted text-[10px]">{relativeTime(v.timestamp)}</span>
                      </div>
                      {v.preview && (
                        <div className="text-textMuted text-[10px] mb-1 line-clamp-2 leading-relaxed opacity-80">
                          {v.preview}
                        </div>
                      )}
                      <div className="text-[10px] text-textMuted">{(v.size / 1024).toFixed(1)} KB</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Version preview + restore */}
            {selectedVersion && versionPreview && (
              <div className="border-t border-border">
                <div className="max-h-48 overflow-y-auto p-3 custom-scrollbar">
                  <div className="prose prose-invert prose-xs max-w-none text-[10px] text-textMuted leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{versionPreview}</ReactMarkdown>
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <button
                    onClick={async () => {
                      if (!doc || !selectedVersion) return;
                      try {
                        await api.restoreVersion(doc.id, selectedVersion);
                        setShowVersionHistory(false);
                        setSelectedVersion(null);
                        setVersionPreview('');
                        window.location.reload();
                      } catch (err) { console.error('Restore failed', err); }
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-primary hover:bg-primaryHover text-white transition-colors"
                  >
                    Restore this version
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating TOC (Notion-style) — indicator strip + hover popup */}
      {headings.length > 0 && !showVersionHistory && (
        <div
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex items-start gap-2"
          onMouseEnter={() => setTocHovered(true)}
          onMouseLeave={() => setTocHovered(false)}
        >
          {/* Floating panel */}
          <div className={`transition-all duration-200 origin-right ${
            tocHovered ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-2 pointer-events-none'
          }`}>
            <div className="bg-[#1c2128] border border-border rounded-xl shadow-2xl p-4 w-56 max-h-80 overflow-y-auto custom-scrollbar">
              <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-3">On this page</h4>
              <nav className="space-y-0.5">
                {headings.map((h, i) => (
                  <button
                    key={h.id || i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Try to find by BlockNote ID (Editor mode)
                      let el = document.querySelector(`[data-id="${h.id}"]`);
                      // Fallback: find by text content (Preview mode)
                      if (!el) {
                        const headings = document.querySelectorAll(`h${h.level}`);
                        for (const heading of headings) {
                          if (heading.textContent?.trim() === h.text.trim()) {
                            el = heading;
                            break;
                          }
                        }
                      }
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add a temporary highlight effect
                        el.classList.add('bg-primary/20', 'transition-colors', 'duration-500', 'rounded');
                        setTimeout(() => el?.classList.remove('bg-primary/20'), 1000);
                      }
                    }}
                    className="block w-full text-left text-xs text-textMuted hover:text-white transition-colors truncate py-1 rounded px-1 hover:bg-[#30363d]"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 4}px` }}
                    title={h.text}
                  >
                    {h.text || 'Untitled'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Thin indicator strip */}
          <div className="flex flex-col gap-1 py-1 cursor-pointer">
            {headings.map((h, i) => (
              <div
                key={h.id || i}
                className={`rounded-full bg-textMuted/30 hover:bg-textMuted/60 transition-colors ${
                  h.level === 1 ? 'w-4 h-1' : h.level === 2 ? 'w-3 h-0.5' : 'w-2 h-0.5'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom status bar - word count */}
      <div className="h-8 px-4 flex items-center justify-between border-t border-border/50 bg-[#0d1117] text-[10px] text-textMuted shrink-0">
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          {blocks.length > 0 && <span>{blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="opacity-50">Ctrl+E edit</span>
          <span className="opacity-50">Ctrl+S save</span>
        </div>
      </div>
    </div>
  );
};
