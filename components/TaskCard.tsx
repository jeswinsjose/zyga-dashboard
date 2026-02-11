import React, { useState } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onMove: (id: string, direction: 'forward' | 'back') => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onArchive?: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onMove, onDelete, onEdit, onArchive }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const isArchived = task.status === 'archive';
  const isDone = task.status === 'done';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={!isArchived}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(task)}
      className={`
        group relative bg-[#21262d] hover:bg-[#30363d] border border-border rounded-lg p-3 mb-2
        transition-all duration-200 shadow-sm
        ${!isArchived ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'task-card-dragging' : ''}
      `}
    >
      {/* Labels / Priority + Created By */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide ${getPriorityBadge(task.priority)}`}>
          {task.priority}
        </span>
        {task.createdBy && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            task.createdBy === 'zyga'
              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
              : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
          }`}>
            {task.createdBy === 'zyga' ? '⚡ zyga' : '👤 user'}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-textMain leading-snug break-words">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-textMuted mt-2 line-clamp-3 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer Info (Timestamp) */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-textMuted/60">
        <span>{new Date(task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        {/* Archive button for Done cards */}
        {isDone && onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Archive this completed task?')) {
                onArchive(task.id);
              }
            }}
            className="text-[10px] text-textMuted hover:text-[#8b5cf6] transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
            title="Move to Archive"
          >
            📦 Archive
          </button>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1 bg-[#21262d] pl-1 rounded-bl-md" onClick={(e) => e.stopPropagation()}>
        {!isArchived && task.status !== 'todo' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id, 'back'); }}
            className="p-1 hover:bg-gray-700 rounded text-textMuted hover:text-white"
            title="Move Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}
        {!isArchived && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id, 'forward'); }}
            className="p-1 hover:bg-gray-700 rounded text-textMuted hover:text-white"
            title="Move Forward"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1 hover:bg-red-900/30 rounded text-textMuted hover:text-red-400"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};
