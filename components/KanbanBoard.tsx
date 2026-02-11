import React, { useState, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { NewTaskModal } from './NewTaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (id: string, direction: 'forward' | 'back') => void;
  onDropTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onSaveTask: (taskData: Partial<Task>, taskToEdit: Task | null) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onMoveTask, onDropTask, onDeleteTask, onSaveTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<TaskStatus | undefined>(undefined);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [recentlyDropped, setRecentlyDropped] = useState<string | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  // Column definitions
  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
    { id: 'archive', label: 'Archive' },
  ];

  const handleMoveTask = (id: string, direction: 'forward' | 'back') => {
    onMoveTask(id, direction);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    dragCounterRef.current[status] = 0;
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(taskId, status);
      // Trigger drop animation
      setRecentlyDropped(taskId);
      setTimeout(() => setRecentlyDropped(null), 300);
    }
  };

  // Use a counter to handle nested drag enter/leave correctly
  const handleDragEnter = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    dragCounterRef.current[colId] = (dragCounterRef.current[colId] || 0) + 1;
    setDragOverCol(colId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (colId: string) => {
    dragCounterRef.current[colId] = (dragCounterRef.current[colId] || 0) - 1;
    if (dragCounterRef.current[colId] <= 0) {
      dragCounterRef.current[colId] = 0;
      setDragOverCol(null);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(id);
    }
  };

  const handleArchiveTask = (id: string) => {
    onDropTask(id, 'archive');
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    onSaveTask(taskData, taskToEdit);
    setIsModalOpen(false);
    setTaskToEdit(null);
    setModalColumn(undefined);
  };

  const openAddModal = (status: TaskStatus) => {
    setTaskToEdit(null);
    setModalColumn(status);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setModalColumn(undefined);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 overflow-x-auto overflow-y-auto md:overflow-y-hidden pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isArchive = col.id === 'archive';
          const isDragOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`w-full md:w-80 flex-shrink-0 flex flex-col md:h-full md:max-h-full rounded-xl transition-all duration-200 ${
                isDragOver
                  ? 'bg-[#1c2128] ring-2 ring-primary/50 scale-[1.01]'
                  : 'bg-[#161b22] border border-border/50'
              }`}
              onDragEnter={(e) => handleDragEnter(e, col.id)}
              onDragOver={handleDragOver}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-textMain text-sm tracking-wide">{col.label}</h3>
                <span className="text-xs text-textMuted bg-[#0d1117] px-2 py-0.5 rounded-full border border-border">
                  {colTasks.length}
                </span>
              </div>

              {/* Drop zone hint when dragging */}
              {isDragOver && (
                <div className="mx-3 mb-2 border-2 border-dashed border-primary/40 rounded-lg py-3 text-center text-xs text-primary/60 font-medium">
                  Drop here
                </div>
              )}

              {/* Archive Toggle Logic */}
              {isArchive && (
                <div className="px-3 pb-2 shrink-0">
                  <button
                    onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
                    className="w-full py-1.5 bg-[#0d1117] hover:bg-[#21262d] text-textMuted text-xs font-medium rounded border border-border transition-colors flex items-center justify-center gap-2"
                  >
                    {isArchiveExpanded ? 'Hide' : 'Show'} Archived Items
                    <span className="text-[10px]">{isArchiveExpanded ? '▲' : '▼'}</span>
                  </button>
                </div>
              )}

              {/* Task List (Scrollable) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-2 min-h-[50px]">
                {(!isArchive || isArchiveExpanded) &&
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={recentlyDropped === task.id ? 'card-drop-anim' : ''}
                    >
                      <TaskCard
                        task={task}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                        onEdit={openEditModal}
                        onArchive={col.id === 'done' ? handleArchiveTask : undefined}
                      />
                    </div>
                  ))}

                {(!isArchive || isArchiveExpanded) && colTasks.length === 0 && !isDragOver && (
                  <div className="h-full flex flex-col items-center justify-center text-textMuted/30 text-xs italic py-10">
                    No cards
                  </div>
                )}
              </div>

              {/* Add Card Button (Footer) */}
              {!isArchive && (
                <div className="p-3 pt-2 shrink-0">
                  <button
                    onClick={() => openAddModal(col.id)}
                    className="w-full py-2 flex items-center justify-start gap-2 px-3 text-textMuted hover:bg-[#21262d] hover:text-textMain rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg leading-none">+</span>
                    <span>Add a card</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <NewTaskModal
          columnStatus={modalColumn}
          taskToEdit={taskToEdit}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
};
