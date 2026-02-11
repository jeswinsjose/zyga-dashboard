# Zyga Dashboard

**Command center for the Zyga AI agent on OpenClaw.**

A real-time monitoring dashboard with task management, document editing, activity logging, and operational overview. Built with React + Express, styled in a dark GitHub-inspired theme.

![Zyga Dashboard](https://img.shields.io/badge/version-1.0.0-8b5cf6) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-%3E%3D18-blue)

---

## Features

### Animated Agent Avatar
Zyga's personality lives in the sidebar with 6 animated states:

| State | Face | Animation | Trigger |
|-------|------|-----------|---------|
| Working | `🫡` | Pulsing glow + bounce | Active task processing |
| Thinking | `🤔` | Slow breathing | Reasoning/planning |
| Idle | `😊` | Gentle floating | Ready for tasks |
| Sleeping | `😴` | Dim + floating Z's | Between heartbeats |
| Error | `😵‍💫` | Shake + red glow | Connection/task failure |
| Cron | `🤖` | Spinning rotation | Running scheduled job |

**Dev Panel**: Press `Ctrl+Shift+D` or click the sidebar avatar 5 times to open the dev panel, which lets you manually toggle states and cycle through all animations.

### Dashboard Tab (Kanban + Notes)
- **Kanban board** with 4 columns: To Do, In Progress, Done, Archive
- **Drag-and-drop** cards between columns with visual lift effect and drop zone highlighting
- **Task cards** show priority badge, created-by badge (user vs zyga), and creation date
- **Archive button** on Done cards to move completed tasks to archive
- **Click any card** to edit title, description, priority, and column
- **Notes section** for quick messages between user and agent
- **Scheduled Deliverables** section showing recurring tasks

### Docs Tab
- **Notion-style block editor** powered by BlockNote
- Markdown files stored on disk, auto-converted to/from BlockNote format
- Full WYSIWYG editing with headings, lists, code blocks, quotes, and more
- Document list with categories and timestamps

### Log Tab
- **Activity timeline** with color-coded entries (success, info, heartbeat, warning, error)
- **Filter pills** with counts: All | Completed | Info | Heartbeat | Error | Warning
- **Search input** for instant text filtering
- **Expandable entries** — long entries truncate to 2 lines, click to expand
- **Date filter** to view specific days

### Overview Tab
- **Gateway status** — online/offline indicator, PID, uptime, memory, active sessions
- **Cost tracking** — today's cost, all-time cost, projected monthly, cost breakdown donut chart
- **Cron jobs table** — status, schedule, last/next run, duration, model
- **Active sessions** — model, type badges, context %, tokens
- **Token usage** — per-model breakdown with costs

### Sidebar
- **Live system info** — real OS memory usage with progress bar (color-coded: green/orange/red), actual system uptime, ping
- **Cost widget** — today's cost with % change vs yesterday; click to jump to Overview tab
- **Heartbeat button** — triggers a manual heartbeat check with loading spinner and result display
- **Collapsible** — auto-collapses to icon-only mode on screens < 1024px

### Notification System
- **Purple count badges** on tab labels for unread items
- **Toast notifications** slide in from bottom-right when new log entries appear
- Persists "last viewed" timestamps per tab in `localStorage`

### Last Sync Indicator
- Real-time timestamp of the last successful API call
- Color-coded freshness: `🟢` < 60s, `🟡` 1-5 min, `🔴` 5+ min
- Click to trigger manual refresh

### Settings Panel
- **Agent name** — editable (updates sidebar + header branding)
- **Status override** — manually set agent state for testing
- **Auto-refresh interval** — 10s / 30s / 60s / 5m / Off
- **Theme** — Dark (Light coming soon)
- **Data paths** — read-only display of configured directories
- **About** — version, OpenClaw version, GitHub repo link

### Responsive Design
- Sidebar collapses to icon-only on tablet/mobile
- Tab navigation scrolls horizontally on narrow screens
- Kanban columns stack vertically on mobile
- Overview tables are horizontally scrollable
- All grids adapt from 4-column to 2-column to 1-column

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Install

```bash
git clone https://github.com/jeswin/zyga-dashboard.git
cd zyga-dashboard
npm install
```

### Run (Development)

Start both the API server and frontend dev server:

```bash
npm run dev:all
```

This runs:
- **API server** on `http://localhost:3002` (with `nodemon` for auto-restart)
- **Frontend** on `http://localhost:3000` (Vite dev server with HMR)

The frontend proxies `/api/*` requests to the API server automatically.

**Alternatively**, run them separately:

```bash
# Terminal 1 — API server
npm run api

# Terminal 2 — Frontend
npm run dev
```

### Build (Production)

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server alongside the API:

```bash
# Start API server
npm run api:once

# Serve frontend (example with npx serve)
npx serve dist -l 3000
```

---

## Project Structure

```
zyga-dashboard/
├── App.tsx                     # Main app component, routing, state management
├── index.html                  # Entry HTML with Tailwind CDN config
├── index.css                   # Custom animations (avatar, toast, heartbeat, drag)
├── index.tsx                   # React entry point
├── types.ts                    # TypeScript type definitions
├── vite.config.ts              # Vite config with API proxy
├── package.json                # Dependencies and scripts
│
├── components/
│   ├── Sidebar.tsx             # Animated avatar, system info, cost widget, heartbeat
│   ├── DashboardTab.tsx        # Kanban board + notes + deliverables
│   ├── KanbanBoard.tsx         # Drag-and-drop kanban columns
│   ├── TaskCard.tsx            # Individual task card with drag support
│   ├── NewTaskModal.tsx        # Add/edit task modal
│   ├── NotesSection.tsx        # User-agent notes panel
│   ├── ScheduledDeliverables.tsx # Recurring task list
│   ├── DocsTab.tsx             # Document list + editor
│   ├── DocList.tsx             # Document sidebar list
│   ├── DocViewer.tsx           # Document content viewer
│   ├── BlockNoteEditor.tsx     # BlockNote WYSIWYG editor wrapper
│   ├── LogTab.tsx              # Activity log with filters and search
│   ├── OverviewTab.tsx         # Operational monitoring dashboard
│   ├── DevPanel.tsx            # Hidden dev panel for avatar state testing
│   ├── SettingsPanel.tsx       # Settings modal
│   └── ToastContainer.tsx      # Toast notification stack
│
├── lib/
│   ├── api.ts                  # API client (all fetch functions + types)
│   ├── markdownConverter.ts    # Markdown ↔ BlockNote conversion
│   ├── blockConverters.ts      # Block format utilities
│   ├── useNotifications.ts     # Tab notification badges + toasts hook
│   └── useSyncTracker.ts       # Last sync freshness tracking hook
│
├── server/
│   ├── index.js                # Express API server (all endpoints)
│   └── lib/
│       └── openclaw-reader.js  # OpenClaw data reader (mock → real SQLite)
│
└── data/
    ├── dashboard-data/
    │   ├── tasks.json           # Kanban tasks (columned format)
    │   ├── notes.json           # User-agent notes
    │   ├── deliverables.json    # Scheduled deliverables
    │   ├── activity-log.json    # Activity log entries
    │   └── overview-mock.json   # Mock OpenClaw monitoring data
    └── documents/
        ├── documents-index.json # Document metadata index
        ├── zyga-master-guide.md
        ├── n8n-security-vulnerability-report.md
        └── daily-ai-pulse-jan29.md
```

---

## API Reference

All endpoints are served from the Express API server (default: port 3002).

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks (columned format) |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update task (title, description, priority, status) |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | Get all notes |
| `POST` | `/api/notes` | Create a note (`{ text }`) |
| `DELETE` | `/api/notes/:id` | Delete a note |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | List all documents (from index) |
| `GET` | `/api/documents/:filename` | Read markdown content of a document |
| `PUT` | `/api/documents/:filename` | Save markdown content (`{ content }`) |

### Activity Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity-log` | Get all log entries |
| `GET` | `/api/activity-log?date=YYYY-MM-DD` | Filter entries by date |

### Deliverables

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/deliverables` | Get scheduled deliverables |

### Overview (OpenClaw Monitoring)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/overview` | Get all monitoring data (gateway, costs, cron, sessions, tokens) |

### Agent Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agent-status` | Get current agent state |
| `POST` | `/api/agent-status` | Override agent state (`{ state, message }`) |

Valid states: `working`, `idle`, `thinking`, `sleeping`, `error`, `executing_cron`.
Send `{ state: null }` to reset to default.

### System Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/system-info` | Get real OS memory, uptime, ping |

### Heartbeat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/heartbeat-status` | Get last heartbeat info |
| `POST` | `/api/heartbeat-trigger` | Trigger a manual heartbeat check |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3002` | Port for the Express API server |
| `GEMINI_API_KEY` | — | Optional: Gemini API key (for future AI features) |

### Vite Proxy

The Vite dev server proxies `/api/*` to `http://127.0.0.1:3002`. This is configured in `vite.config.ts`. In production, you'll need to configure your reverse proxy (nginx, etc.) to route `/api` requests to the Express server.

### Data Storage

All data is stored as JSON files in the `data/` directory. This makes it easy to:
- Inspect and edit data manually
- Commit sample data to the repo
- Share data between the dashboard and the Zyga AI agent (which reads/writes the same files)

---

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:all` | Start API + frontend together (recommended) |
| `npm run dev` | Start Vite frontend only |
| `npm run api` | Start API server with nodemon (auto-restart) |
| `npm run api:once` | Start API server without nodemon |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

### Dev Tools

**Dev Panel** (`Ctrl+Shift+D` or click avatar 5x):
- Toggle between all 6 agent states
- "Cycle All" button auto-rotates every 3 seconds
- "Reset" returns to API-driven state

**Settings Panel** (`⚙️` icon in header):
- Override agent status for testing
- Change auto-refresh interval
- Edit agent name

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6 |
| UI | Tailwind CSS (CDN), custom CSS animations |
| Editor | BlockNote (Notion-style block editor) |
| Backend | Express 5, Node.js |
| Data | JSON files on disk |
| Dev Tools | nodemon, concurrently |

---

## Connecting to OpenClaw (Production)

The dashboard is designed to work with [OpenClaw](https://github.com/mudrii/openclaw-dashboard) on a VPS. To connect:

1. **Agent Status**: Point `/api/agent-status` to read from OpenClaw session state
2. **Overview Data**: Replace `overview-mock.json` reads with real SQLite queries in `server/lib/openclaw-reader.js` (see TODOs in that file)
3. **System Info**: Already uses real OS data via Node's `os` module
4. **Heartbeat**: Replace mock in `/api/heartbeat-trigger` with actual OpenClaw heartbeat mechanism
5. **Shared Data**: The Zyga agent reads/writes the same `data/*.json` files, so tasks and notes sync automatically

---

## License

MIT
