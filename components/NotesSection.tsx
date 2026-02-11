import React, { useState } from 'react';
import { Note } from '../types';

interface NotesSectionProps {
  notes: Note[];
  onAdd: (content: string) => void;
  onDelete: (id: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onAdd, onDelete }) => {
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-info"></div>
        <h3 className="text-sm font-bold text-textMain">Notes</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-textMuted mb-2">Zyga checks on every heartbeat</p>
        <div className="relative">
          <textarea
            className="w-full bg-surface border border-border rounded-md p-3 text-sm text-textMain focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-20"
            placeholder="Type a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>
        <button 
          onClick={handleAdd}
          disabled={!content.trim()}
          className="mt-2 px-4 py-1.5 bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded shadow-md transition-colors"
        >
          Add
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
        {notes.length === 0 && (
           <div className="text-center py-6 text-textMuted text-xs italic">No active notes.</div>
        )}
        {notes.map(note => (
          <div key={note.id} className="relative group bg-surface border border-border rounded-md p-3 hover:border-gray-600 transition-all">
            <p className="text-sm text-textMain whitespace-pre-wrap">{note.content}</p>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-textMuted">
                  {new Date(note.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </span>
                {note.seen && (
                  <span className="text-[10px] text-textMuted italic">(seen by Zyga)</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => onDelete(note.id)}
              className="absolute top-2 right-2 text-textMuted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
