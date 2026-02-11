
import React, { useState, useEffect, useCallback } from 'react';
import { Doc, DocCategory } from '../types';
import type { PartialBlock } from '@blocknote/core';
import { BlockNoteEditor } from './BlockNoteEditor';

interface DocViewerProps {
  doc: Doc | null;
  onSave: (id: string, newBlocks: PartialBlock[], newTitle?: string) => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({ doc, onSave }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [blocks, setBlocks] = useState<PartialBlock[]>(() => doc?.blocks ?? []);
  const [title, setTitle] = useState(() => doc?.title ?? '');

  // Sync state when doc changes
  useEffect(() => {
    if (doc) {
      setBlocks(doc.blocks || []);
      setTitle(doc.title);
    }
  }, [doc]);

  if (!doc) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-textMuted bg-[#0d1117]">
        <div className="text-6xl mb-6 opacity-10">📝</div>
        <p className="text-lg font-medium opacity-50">Select a document to view or edit</p>
      </div>
    );
  }

  const handleBlocksChange = useCallback(
    (newBlocks: PartialBlock[]) => {
      setBlocks(newBlocks);
      onSave(doc.id, newBlocks, title);
    },
    [doc.id, title, onSave]
  );

  const handleDone = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBlocks(doc.blocks || []);
    setTitle(doc.title);
    setIsEditing(false);
  };

  const getCategoryColor = (cat: DocCategory) => {
    switch (cat) {
      case 'Security': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Guide': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Reference': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'AI Pulse': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'System': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-textMuted bg-gray-800 border-gray-700';
    }
  };

  const getIcon = (cat: DocCategory) => {
    switch (cat) {
      case 'Security': return '🚨';
      case 'Guide': return '📘';
      case 'Reference': return '🧠';
      case 'AI Pulse': return '📰';
      case 'System': return '⚙️';
      case 'Project': return '📁';
      default: return '📄';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0d1117] relative">
      
      {/* Top Navigation Bar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-[#0d1117]/80 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-2 text-xs text-textMuted">
          <span className="hover:text-textMain cursor-pointer">Documents</span>
          <span>/</span>
          <span className="text-textMain truncate max-w-[200px]">{doc.title}</span>
          {isEditing && <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-medium ml-2">Editing</span>}
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center">
        <div className="w-full max-w-4xl px-16 py-12 flex flex-col">
          
          {/* Document Header - pl-7 aligns with BlockNote content (after side menu ~28px) */}
          <div className="mb-8 group pl-7">
            <div className="text-6xl mb-6 select-none cursor-default hover:scale-105 transition-transform origin-left inline-block">
              {getIcon(doc.category)}
            </div>
            
            {isEditing ? (
               <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full bg-transparent text-4xl font-bold text-white placeholder-gray-700 border-none focus:outline-none focus:ring-0 p-0 mb-6"
              />
            ) : (
              <h1 className="text-4xl font-bold text-white mb-6 leading-tight">{title}</h1>
            )}

            {/* Properties Block */}
            <div className="space-y-1 mb-8 text-sm">
              <div className="flex items-center gap-4 py-1">
                <span className="w-24 text-textMuted flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Date created
                </span>
                <span className="text-textMain">{doc.date}</span>
              </div>
              <div className="flex items-center gap-4 py-1">
                <span className="w-24 text-textMuted flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  Category
                </span>
                <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(doc.category)}`}>
                  {doc.category}
                </span>
              </div>
            </div>
            
            <div className="h-px w-full bg-border/50 mb-8"></div>
          </div>

          {/* BlockNote Editor - Notion-style block-based editing */}
          <BlockNoteEditor
            key={doc.id}
            docId={doc.id}
            blocks={blocks}
            onChange={handleBlocksChange}
            readOnly={!isEditing}
          />
          
        </div>
      </div>
    </div>
  );
};
