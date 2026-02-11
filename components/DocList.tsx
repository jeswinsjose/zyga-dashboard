import React from 'react';
import { Doc, DocCategory } from '../types';

interface DocListProps {
  documents: Doc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const DocList: React.FC<DocListProps> = ({ 
  documents, 
  selectedId, 
  onSelect, 
  searchQuery, 
  onSearchChange 
}) => {
  
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

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full flex flex-col border-r border-border bg-[#13171e]">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Documents</h3>
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
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filteredDocs.map(doc => {
          const isSelected = doc.id === selectedId;
          return (
            <div 
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`p-3 rounded-md cursor-pointer transition-all border ${
                isSelected 
                  ? 'bg-[#1c2128] border-primary/50 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-[#161b22] hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{getIcon(doc.category)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium leading-snug truncate ${isSelected ? 'text-white' : 'text-textMain'}`}>
                    {doc.title}
                  </h4>
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
    </div>
  );
};
