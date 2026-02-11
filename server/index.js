/**
 * Zyga Dashboard API Server
 * Serves REST endpoints for tasks, notes, deliverables, activity-log, and documents.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3002;

// Data directory - use project root / data
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data', 'dashboard-data');
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, 'data', 'documents');

app.use(cors());
app.use(express.json());

// Root route — API server info (useful when visiting localhost:3001 directly)
app.get('/', (req, res) => {
  res.json({
    name: 'Zyga Dashboard API',
    version: '1.0',
    message: 'API server is running. Use the frontend at localhost:3000',
    endpoints: ['/api/tasks', '/api/notes', '/api/deliverables', '/api/activity-log', '/api/documents', '/api/overview'],
  });
});

// Helper: read JSON file
async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Helper: write JSON file
async function writeJson(filePath, obj) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

// Helper: simple UUID v4
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- TASKS API ---

const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');

/** Flatten columns to Task[] for frontend; map column key to status */
function tasksToFrontend(data) {
  if (!data?.columns) return [];
  const statusMap = { todo: 'todo', in_progress: 'in-progress', done: 'done', archive: 'archive' };
  const priorityMap = { high: 'High', medium: 'Medium', low: 'Low' };
  const tasks = [];
  for (const [colKey, col] of Object.entries(data.columns)) {
    const status = statusMap[colKey] ?? colKey;
    for (const t of col.tasks || []) {
      tasks.push({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        status,
        priority: priorityMap[t.priority] || 'Medium',
        createdAt: new Date(t.created_at).getTime(),
      });
    }
  }
  return tasks;
}

/** Map frontend task to backend format */
function taskToBackend(task, createdBy = 'user') {
  const priorityMap = { High: 'high', Medium: 'medium', Low: 'low' };
  const colMap = { todo: 'todo', 'in-progress': 'in_progress', done: 'done', archive: 'archive' };
  const now = new Date().toISOString();
  return {
    id: task.id || uuid(),
    title: task.title,
    description: task.description || '',
    priority: (priorityMap[task.priority] || 'medium').toLowerCase(),
    created_at: task.createdAt ? new Date(task.createdAt).toISOString() : now,
    updated_at: now,
    created_by: createdBy,
  };
}

// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await readJson(TASKS_PATH);
    if (!data) {
      return res.json({ columns: { todo: { name: 'To Do', tasks: [] }, in_progress: { name: 'In Progress', tasks: [] }, done: { name: 'Done', tasks: [] }, archive: { name: 'Archive', tasks: [] } } });
    }
    res.json(data);
  } catch (err) {
    console.error('GET /api/tasks', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - create
app.post('/api/tasks', async (req, res) => {
  try {
    const body = req.body;
    const task = taskToBackend({
      id: uuid(),
      title: body.title,
      description: body.description,
      priority: body.priority || 'Medium',
      status: body.status || 'todo',
      createdAt: Date.now(),
    });

    let data = await readJson(TASKS_PATH);
    if (!data || !data.columns) {
      data = {
        columns: {
          todo: { name: 'To Do', tasks: [] },
          in_progress: { name: 'In Progress', tasks: [] },
          done: { name: 'Done', tasks: [] },
          archive: { name: 'Archive', tasks: [] },
        },
      };
    }

    const colKey = { todo: 'todo', 'in-progress': 'in_progress', done: 'done', archive: 'archive' }[task.status] || 'todo';
    const col = data.columns[colKey];
    if (!col.tasks) col.tasks = [];
    col.tasks.push(task);

    await writeJson(TASKS_PATH, data);
    res.status(201).json(task);
  } catch (err) {
    console.error('POST /api/tasks', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id - update (move, edit)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let data = await readJson(TASKS_PATH);
    if (!data?.columns) return res.status(404).json({ error: 'Tasks not found' });

    let found = null;
    let fromCol = null;

    for (const [colKey, col] of Object.entries(data.columns)) {
      const idx = (col.tasks || []).findIndex((t) => t.id === id);
      if (idx >= 0) {
        found = col.tasks[idx];
        fromCol = colKey;
        break;
      }
    }

    if (!found) return res.status(404).json({ error: 'Task not found' });

    const statusToCol = { todo: 'todo', 'in-progress': 'in_progress', done: 'done', archive: 'archive' };
    const targetCol = body.status !== undefined ? (statusToCol[body.status] || body.status) : null;

    const updated = {
      ...found,
      title: body.title ?? found.title,
      description: body.description !== undefined ? body.description : found.description,
      priority: body.priority ? ({ High: 'high', Medium: 'medium', Low: 'low' }[body.priority] || found.priority) : found.priority,
      updated_at: new Date().toISOString(),
    };

    if (targetCol && targetCol !== fromCol) {
      data.columns[fromCol].tasks = data.columns[fromCol].tasks.filter((t) => t.id !== id);
      if (!data.columns[targetCol].tasks) data.columns[targetCol].tasks = [];
      data.columns[targetCol].tasks.push(updated);
    } else {
      const col = data.columns[fromCol];
      const idx = col.tasks.findIndex((t) => t.id === id);
      col.tasks[idx] = updated;
    }

    await writeJson(TASKS_PATH, data);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/tasks/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let data = await readJson(TASKS_PATH);
    if (!data?.columns) return res.status(404).json({ error: 'Tasks not found' });

    for (const col of Object.values(data.columns)) {
      const prev = (col.tasks || []).length;
      col.tasks = (col.tasks || []).filter((t) => t.id !== id);
      if (col.tasks.length < prev) {
        await writeJson(TASKS_PATH, data);
        return res.status(204).send();
      }
    }
    return res.status(404).json({ error: 'Task not found' });
  } catch (err) {
    console.error('DELETE /api/tasks/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// --- NOTES API ---

const NOTES_PATH = path.join(DATA_DIR, 'notes.json');

// GET /api/notes
app.get('/api/notes', async (req, res) => {
  try {
    const data = await readJson(NOTES_PATH);
    if (!data) return res.json({ notes: [] });
    res.json(data);
  } catch (err) {
    console.error('GET /api/notes', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes
app.post('/api/notes', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });

    let data = await readJson(NOTES_PATH);
    if (!data) data = { notes: [] };
    if (!data.notes) data.notes = [];

    const note = {
      id: uuid(),
      text: String(text).trim(),
      created_at: new Date().toISOString(),
      created_by: 'user',
      seen_by_zyga: false,
      seen_at: null,
    };
    data.notes.unshift(note);
    await writeJson(NOTES_PATH, data);
    res.status(201).json(note);
  } catch (err) {
    console.error('POST /api/notes', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let data = await readJson(NOTES_PATH);
    if (!data?.notes) return res.status(404).json({ error: 'Notes not found' });

    const prev = data.notes.length;
    data.notes = data.notes.filter((n) => n.id !== id);
    if (data.notes.length < prev) {
      await writeJson(NOTES_PATH, data);
      return res.status(204).send();
    }
    return res.status(404).json({ error: 'Note not found' });
  } catch (err) {
    console.error('DELETE /api/notes/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Placeholder routes for other tabs (return file data) ---

app.get('/api/deliverables', async (req, res) => {
  try {
    const data = await readJson(path.join(DATA_DIR, 'deliverables.json'));
    res.json(data || { deliverables: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activity-log', async (req, res) => {
  try {
    const data = await readJson(path.join(DATA_DIR, 'activity-log.json'));
    let entries = data?.entries || [];
    const date = req.query.date; // YYYY-MM-DD
    if (date) {
      entries = entries.filter((e) => {
        const ts = new Date(e.timestamp);
        const d = ts.toISOString().slice(0, 10);
        return d === date;
      });
    }
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTS API ---

const DOCUMENTS_INDEX_PATH = path.join(DOCUMENTS_DIR, 'documents-index.json');

// GET /api/documents - list from index
app.get('/api/documents', async (req, res) => {
  try {
    const data = await readJson(DOCUMENTS_INDEX_PATH);
    res.json(data || { documents: [] });
  } catch (err) {
    console.error('GET /api/documents', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:filename - read .md file content
app.get('/api/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || !filename.endsWith('.md')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(DOCUMENTS_DIR, filename);
    const safePath = path.resolve(filePath);
    if (!safePath.startsWith(path.resolve(DOCUMENTS_DIR))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const content = await fs.readFile(filePath, 'utf-8');
    res.type('text/markdown').send(content);
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Document not found' });
    console.error('GET /api/documents/:filename', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:filename - save markdown content
app.put('/api/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || !filename.endsWith('.md')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(DOCUMENTS_DIR, filename);
    const safePath = path.resolve(filePath);
    if (!safePath.startsWith(path.resolve(DOCUMENTS_DIR))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const content = typeof req.body === 'string' ? req.body : (req.body?.content ?? req.body?.markdown ?? '');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, String(content), 'utf-8');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('PUT /api/documents/:filename', err);
    res.status(500).json({ error: err.message });
  }
});

// --- OVERVIEW API (OpenClaw operational monitoring) ---
// Serves from overview-mock.json. See server/lib/openclaw-reader.js for Layer 2 (real SQLite).

const OVERVIEW_MOCK_PATH = path.join(DATA_DIR, 'overview-mock.json');

app.get('/api/overview', async (req, res) => {
  try {
    const data = await readJson(OVERVIEW_MOCK_PATH);
    if (!data) return res.status(404).json({ error: 'Overview data not found' });
    res.json(data);
  } catch (err) {
    console.error('GET /api/overview', err);
    res.status(500).json({ error: err.message });
  }
});

// --- AGENT STATUS API ---
// Mock agent status; in production reads from OpenClaw session state.

let agentStatusOverride = null; // Set via POST for dev testing

const DEFAULT_AGENT_STATUS = {
  state: 'working',
  message: 'Analyzing YouTube Data API integration requirements...',
  isOnline: true,
  hasHelpers: true,
};

app.get('/api/agent-status', (req, res) => {
  res.json(agentStatusOverride || DEFAULT_AGENT_STATUS);
});

// Dev: override status for testing avatar animations
app.post('/api/agent-status', (req, res) => {
  const { state, message } = req.body;
  const validStates = ['working', 'idle', 'thinking', 'sleeping', 'error', 'executing_cron'];
  if (state && !validStates.includes(state)) {
    return res.status(400).json({ error: `Invalid state. Must be one of: ${validStates.join(', ')}` });
  }
  if (state === null) {
    agentStatusOverride = null;
    return res.json({ message: 'Reset to default', status: DEFAULT_AGENT_STATUS });
  }

  const stateMessages = {
    working: 'Analyzing YouTube Data API integration requirements...',
    thinking: 'Processing query...',
    idle: 'Ready for tasks',
    sleeping: 'Zzz... next heartbeat at 2:00 PM',
    error: 'Connection timeout on n8n webhook',
    executing_cron: 'Running: Daily AI Pulse',
  };

  agentStatusOverride = {
    state: state || DEFAULT_AGENT_STATUS.state,
    message: message || stateMessages[state] || DEFAULT_AGENT_STATUS.message,
    isOnline: state !== 'sleeping' && state !== 'error',
    hasHelpers: state === 'working' || state === 'executing_cron',
  };
  res.json(agentStatusOverride);
});

// --- HEARTBEAT API ---
// Mock heartbeat; in production triggers OpenClaw heartbeat check.

let heartbeatState = {
  lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
  notesSeen: 0,
  tasksUpdated: 0,
  result: null, // last result message
};

app.get('/api/heartbeat-status', (req, res) => {
  res.json(heartbeatState);
});

app.post('/api/heartbeat-trigger', async (req, res) => {
  // Simulate a 1-2 second heartbeat check
  const delay = 1000 + Math.floor(Math.random() * 1000);
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Mock results — randomize for realism
  const notesSeen = Math.floor(Math.random() * 4);
  const tasksUpdated = Math.floor(Math.random() * 3);
  const now = new Date();

  heartbeatState = {
    lastRun: now.toISOString(),
    nextRun: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    notesSeen,
    tasksUpdated,
    result: notesSeen === 0 && tasksUpdated === 0
      ? 'Heartbeat OK — nothing new'
      : `Heartbeat OK — ${notesSeen} note${notesSeen !== 1 ? 's' : ''} read, ${tasksUpdated} task${tasksUpdated !== 1 ? 's' : ''} updated`,
  };

  res.json(heartbeatState);
});

// --- SYSTEM INFO API ---
// Returns real OS metrics (memory, uptime) + mock ping.

const serverStartedAt = Date.now();

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

app.get('/api/system-info', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const percentage = Math.round((usedMem / totalMem) * 100);

  // OS uptime (system-wide, not just this server)
  const uptimeSeconds = os.uptime();

  // Mock ping — slight random jitter around 22-28ms for realism
  const ping = Math.round(20 + Math.random() * 12);

  res.json({
    memory: {
      used: (usedMem / 1024 / 1024 / 1024).toFixed(1),
      total: (totalMem / 1024 / 1024 / 1024).toFixed(0),
      percentage,
    },
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds,
    ping,
  });
});

// Start server — use explicit http.createServer to ensure the process stays alive (Express 5 compat)
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Zyga Dashboard API running at http://localhost:${PORT}`);
});
server.on('error', (err) => {
  console.error('Server startup error:', err.message);
  process.exit(1);
});
