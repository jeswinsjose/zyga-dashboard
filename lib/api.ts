/**
 * API client for Zyga Dashboard backend
 */

const API_BASE = '/api';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'archive';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  seen: boolean;
}

// Backend response types
interface TasksResponse {
  columns: Record<string, { name: string; tasks: BackendTask[] }>;
}

interface BackendTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface NotesResponse {
  notes: BackendNote[];
}

interface BackendNote {
  id: string;
  text: string;
  created_at: string;
  created_by: string;
  seen_by_zyga: boolean;
  seen_at: string | null;
}

function tasksFromResponse(data: TasksResponse): Task[] {
  const statusMap: Record<string, TaskStatus> = {
    todo: 'todo',
    in_progress: 'in-progress',
    done: 'done',
    archive: 'archive',
  };
  const priorityMap: Record<string, TaskPriority> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  const tasks: Task[] = [];
  for (const [colKey, col] of Object.entries(data.columns || {})) {
    const status = statusMap[colKey] ?? 'todo';
    for (const t of col.tasks || []) {
      tasks.push({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        status,
        priority: priorityMap[t.priority] || 'Medium',
        createdAt: new Date(t.created_at).getTime(),
        createdBy: (t.created_by === 'zyga' ? 'zyga' : 'user') as 'user' | 'zyga',
      });
    }
  }
  return tasks;
}

function notesFromResponse(data: NotesResponse): Note[] {
  return (data.notes || []).map((n) => ({
    id: n.id,
    content: n.text,
    createdAt: new Date(n.created_at).getTime(),
    seen: n.seen_by_zyga,
  }));
}

// --- Tasks API ---

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
  const data = await res.json();
  return tasksFromResponse(data);
}

export async function createTask(task: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
  const created = await res.json();
  return {
    id: created.id,
    title: created.title,
    description: created.description,
    status: (task.status as TaskStatus) || 'todo',
    priority: (task.priority as TaskPriority) || 'Medium',
    createdAt: new Date(created.created_at).getTime(),
  };
}

export async function updateTask(
  id: string,
  updates: { title?: string; description?: string; priority?: TaskPriority; status?: TaskStatus }
): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update task: ${res.status}`);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete task: ${res.status}`);
}

// --- Notes API ---

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  const data = await res.json();
  return notesFromResponse(data);
}

export async function createNote(text: string): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to create note: ${res.status}`);
  const created = await res.json();
  return {
    id: created.id,
    content: created.text,
    createdAt: new Date(created.created_at).getTime(),
    seen: created.seen_by_zyga || false,
  };
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete note: ${res.status}`);
}

// --- Documents API ---

export interface DocumentIndexItem {
  filename: string;
  title: string;
  emoji: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentsResponse {
  documents: DocumentIndexItem[];
}

export async function fetchDocuments(): Promise<DocumentIndexItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  const data: DocumentsResponse = await res.json();
  return data.documents || [];
}

export async function fetchDocumentContent(filename: string): Promise<string> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  return res.text();
}

export async function saveDocumentContent(filename: string, content: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to save document: ${res.status}`);
}

// --- Activity Log API ---

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: string;
  color: string;
  description: string;
}

export interface ActivityLogResponse {
  entries: ActivityLogEntry[];
}

export async function fetchActivityLog(date?: string): Promise<ActivityLogEntry[]> {
  const url = date
    ? `${API_BASE}/activity-log?date=${encodeURIComponent(date)}`
    : `${API_BASE}/activity-log`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch activity log: ${res.status}`);
  const data: ActivityLogResponse = await res.json();
  return data.entries || [];
}

// --- Deliverables API ---

export interface DeliverableItem {
  id: string;
  name: string;
  emoji: string;
  frequency: string;
  type: string;
  cron_expression?: string;
  enabled: boolean;
  last_run?: string;
  description?: string;
}

export interface DeliverablesResponse {
  deliverables: DeliverableItem[];
}

export async function fetchDeliverables(): Promise<DeliverableItem[]> {
  const res = await fetch(`${API_BASE}/deliverables`);
  if (!res.ok) throw new Error(`Failed to fetch deliverables: ${res.status}`);
  const data: DeliverablesResponse = await res.json();
  return data.deliverables || [];
}

// --- Overview API (OpenClaw monitoring) ---

export interface OverviewGatewayStatus {
  online: boolean;
  pid: number | null;
  uptime: string;
  memory: string;
  memoryTotal?: string;
  activeSessions: number;
}

export interface OverviewCostBreakdown {
  model: string;
  cost: number;
  percentage: number;
}

export interface OverviewCosts {
  today: number;
  allTime: number;
  projectedMonthly: number;
  breakdown: OverviewCostBreakdown[];
}

export interface OverviewCronJob {
  name: string;
  status: 'ok' | 'idle' | 'running' | 'error';
  schedule: string;
  lastRun: string;
  nextRun: string;
  duration: string;
  model: string;
}

export interface OverviewSession {
  name: string;
  model: string;
  type: string;
  contextPercent: number;
  lastActivity: string;
  tokens: number;
}

export interface OverviewTokenUsage {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  total: number;
  cost: number;
}

export interface OverviewData {
  gatewayStatus: OverviewGatewayStatus;
  costs: OverviewCosts;
  cronJobs: OverviewCronJob[];
  sessions: OverviewSession[];
  tokenUsage: OverviewTokenUsage[];
}

export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error(`Failed to fetch overview: ${res.status}`);
  return res.json();
}

// --- Agent Status API ---

export type AgentState = 'working' | 'idle' | 'thinking' | 'sleeping' | 'error' | 'executing_cron';

export interface AgentStatusResponse {
  state: AgentState;
  message: string;
  isOnline: boolean;
  hasHelpers: boolean;
}

export async function fetchAgentStatus(): Promise<AgentStatusResponse> {
  const res = await fetch(`${API_BASE}/agent-status`);
  if (!res.ok) throw new Error(`Failed to fetch agent status: ${res.status}`);
  return res.json();
}

export async function setAgentStatus(state: AgentState | null, message?: string): Promise<AgentStatusResponse> {
  const res = await fetch(`${API_BASE}/agent-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, message }),
  });
  if (!res.ok) throw new Error(`Failed to set agent status: ${res.status}`);
  return res.json();
}

// --- System Info API ---

export interface SystemInfoMemory {
  used: string;   // GB, e.g. "4.2"
  total: string;  // GB, e.g. "16"
  percentage: number; // 0-100
}

export interface SystemInfo {
  memory: SystemInfoMemory;
  uptime: string;         // formatted, e.g. "3d 12h 4m"
  uptimeSeconds: number;  // raw seconds for live tick
  ping: number;           // ms
}

export async function fetchSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${API_BASE}/system-info`);
  if (!res.ok) throw new Error(`Failed to fetch system info: ${res.status}`);
  return res.json();
}

// --- Heartbeat API ---

export interface HeartbeatStatus {
  lastRun: string;
  nextRun: string;
  notesSeen: number;
  tasksUpdated: number;
  result: string | null;
}

export async function fetchHeartbeatStatus(): Promise<HeartbeatStatus> {
  const res = await fetch(`${API_BASE}/heartbeat-status`);
  if (!res.ok) throw new Error(`Failed to fetch heartbeat status: ${res.status}`);
  return res.json();
}

export async function triggerHeartbeat(): Promise<HeartbeatStatus> {
  const res = await fetch(`${API_BASE}/heartbeat-trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger heartbeat: ${res.status}`);
  return res.json();
}
