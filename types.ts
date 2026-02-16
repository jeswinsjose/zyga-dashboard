
export type TabId = 'dashboard' | 'docs' | 'log' | 'overview';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archive';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  createdBy?: 'user' | 'zyga';
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  seen: boolean;
}

export interface Deliverable {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  tag: string;
  icon: string; // Emoji char
}

export type AgentState = 'working' | 'idle' | 'thinking' | 'sleeping' | 'error' | 'executing_cron';

export interface AgentStatus {
  state: AgentState;
  message: string;
  isOnline: boolean;
  hasHelpers: boolean;
}

export type DocCategory = 'Guide' | 'Security' | 'Reference' | 'Project' | 'System' | 'Spec' | 'AI Pulse';

export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletListItem' | 'numberedListItem' | 'quote' | 'code' | 'divider' | 'todo' | 'callout';

export interface Block {
  id: string;
  type: BlockType;
  content: string; // HTML content (legacy) - BlockNote uses structured content
  properties?: Record<string, any>; // e.g. checked: boolean
}

export interface Doc {
  id: string;
  title: string;
  emoji?: string;
  date: string;
  updatedAt?: string;
  category: DocCategory;
  isFavorite?: boolean;
  content?: string; // Legacy markdown (for migration only)
  /** BlockNote JSON block array - canonical storage format */
  blocks?: import('@blocknote/core').PartialBlock[];
}

export type LogType = 'success' | 'info' | 'warning' | 'error' | 'heartbeat';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  message: string;
}
