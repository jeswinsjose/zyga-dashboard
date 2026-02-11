import React, { useState, useEffect } from 'react';
import { TaskPriority, TaskStatus, Task } from '../types';

interface NewTaskModalProps {
  columnStatus?: TaskStatus;
  taskToEdit?: Task | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'archive', label: 'Archive' },
];

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ columnStatus, taskToEdit, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setNotes(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
    } else if (columnStatus) {
      setStatus(columnStatus);
    }
  }, [taskToEdit, columnStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    if (taskToEdit) {
      onSave({ ...taskToEdit, title, description: notes, priority, status });
    } else {
      onSave({ title, description: notes, priority, status });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 flex justify-between items-center border-b border-border bg-[#1c2128]">
          <h3 className="text-lg font-semibold text-white">
            {taskToEdit ? 'Edit Task' : 'New Task'}
          </h3>
          <button onClick={onClose} className="text-textMuted hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">In list</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#161b22] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Title</label>
            <input 
              type="text" 
              autoFocus={!taskToEdit}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Description</label>
            <textarea 
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors h-32 resize-none leading-relaxed"
              placeholder="Add more details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-3">Priority</label>
            <div className="flex gap-3">
              {(['High', 'Medium', 'Low'] as TaskPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    priority === p 
                      ? p === 'High' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-sm shadow-red-900/20' 
                        : p === 'Medium' ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm shadow-orange-900/20' 
                        : 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm shadow-blue-900/20'
                      : 'bg-[#161b22] border-border text-textMuted hover:border-gray-500 hover:text-textMain'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="px-4 py-2 rounded-md text-sm font-medium text-textMuted hover:bg-[#21262d] hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               className="px-6 py-2 rounded-md text-sm font-medium bg-primary hover:bg-primaryHover text-white transition-colors shadow-lg shadow-purple-900/20"
             >
               {taskToEdit ? 'Save Changes' : 'Add Card'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
