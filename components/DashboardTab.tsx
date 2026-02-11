import React, { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { ScheduledDeliverables } from './ScheduledDeliverables';
import { NotesSection } from './NotesSection';
import { Task, Deliverable, Note } from '../types';
import * as api from '../lib/api';

function mapDeliverable(item: api.DeliverableItem): Deliverable {
  const tag = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Folder';
  return {
    id: item.id,
    title: item.name,
    frequency: (item.frequency as 'Daily' | 'Weekly' | 'Monthly') || 'Daily',
    tag,
    icon: item.emoji || '📁',
  };
}

const STATUS_ORDER: Task['status'][] = ['todo', 'in-progress', 'done', 'archive'];

export const DashboardTab: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks, notes, and deliverables on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, notesData, deliverablesData] = await Promise.all([
          api.fetchTasks(),
          api.fetchNotes(),
          api.fetchDeliverables(),
        ]);
        if (!cancelled) {
          setTasks(tasksData);
          setNotes(notesData);
          setDeliverables(deliverablesData.map(mapDeliverable));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onMoveTask = useCallback((id: string, direction: 'forward' | 'back') => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const idx = STATUS_ORDER.indexOf(task.status);
    let nextIdx = direction === 'forward' ? idx + 1 : idx - 1;
    nextIdx = Math.max(0, Math.min(nextIdx, STATUS_ORDER.length - 1));
    const newStatus = STATUS_ORDER[nextIdx];
    api.updateTask(id, { status: newStatus }).then(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    }).catch((e) => console.error('Failed to move task', e));
  }, [tasks]);

  const onDropTask = useCallback((id: string, status: Task['status']) => {
    api.updateTask(id, { status }).then(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }).catch((e) => console.error('Failed to move task', e));
  }, []);

  const onDeleteTask = useCallback((id: string) => {
    api.deleteTask(id).then(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }).catch((e) => console.error('Failed to delete task', e));
  }, []);

  const onSaveTask = useCallback((taskData: Partial<Task>, taskToEdit: Task | null) => {
    if (taskToEdit) {
      api.updateTask(taskToEdit.id, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
      }).then(() => {
        setTasks((prev) => prev.map((t) => (t.id === taskToEdit.id ? { ...t, ...taskData } as Task : t)));
      }).catch((e) => console.error('Failed to update task', e));
    } else {
      api.createTask({
        title: taskData.title!,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
      }).then((created) => {
        setTasks((prev) => [created, ...prev]);
      }).catch((e) => console.error('Failed to create task', e));
    }
  }, []);

  const handleAddNote = useCallback((content: string) => {
    api.createNote(content).then((created) => {
      setNotes((prev) => [created, ...prev]);
    }).catch((e) => console.error('Failed to create note', e));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    api.deleteNote(id).then(() => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }).catch((e) => console.error('Failed to delete note', e));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-textMuted">
        Loading...
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
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      {/* Top Section: Kanban (Takes up ~60% of height) */}
      <div className="flex-1 min-h-[50%]">
        <KanbanBoard
          tasks={tasks}
          onMoveTask={onMoveTask}
          onDropTask={onDropTask}
          onDeleteTask={onDeleteTask}
          onSaveTask={onSaveTask}
        />
      </div>

      {/* Bottom Section: Deliverables & Notes (Takes up remaining space) */}
      <div className="h-[40%] flex gap-6 min-h-[300px]">
        {/* Left: Deliverables */}
        <div className="w-1/3 bg-[#13171e] border border-border rounded-lg p-4 shadow-sm">
          <ScheduledDeliverables items={deliverables} />
        </div>

        {/* Right: Notes */}
        <div className="w-2/3 bg-[#13171e] border border-border rounded-lg p-4 shadow-sm">
          <NotesSection notes={notes} onAdd={handleAddNote} onDelete={handleDeleteNote} />
        </div>
      </div>
    </div>
  );
};
