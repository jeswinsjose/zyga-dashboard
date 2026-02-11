# Zyga Dashboard — Complete Project Context for Cursor

> **Read this entire document before writing any code.** This is the full context of what the project is, what has been built, what still needs to be done, and how every piece connects.

---

## What Is This Project?

This is a **custom command center dashboard** for an AI agent called **Zyga**. Zyga runs on [OpenClaw](https://github.com/openclaw/openclaw) — an open-source platform that lets you run a personal AI agent on your own server. Think of OpenClaw as the engine, and this dashboard as the cockpit.

Zyga runs on a Hostinger VPS (Ubuntu), communicates with her owner (Jeswin) via Telegram, and performs tasks like code generation, research, content creation, security audits, and automated scheduled jobs (cron). This dashboard is how Jeswin monitors and interacts with Zyga through a web browser.

**The dashboard runs at `localhost:3000` on the VPS** and is accessed through SSH tunneling or Tailscale.

---

## The Inspiration: Nate Herk's "Klaus" Dashboard

This dashboard is heavily inspired by Nate Herk's Klaus dashboard (YouTube: https://www.youtube.com/watch?v=rlJovzVhlIo&t=1249s). Klaus is another OpenClaw agent with a beautiful custom dashboard. We studied Klaus's UI extensively and built our version based on it, with modifications and additions.

**What we took from Klaus:**
- The 4-tab navigation structure (Dashboard, Docs, Log, Overview)
- Left sidebar with agent avatar, name, status, and system info
- Kanban board design on the Dashboard tab
- Scheduled Deliverables + Notes sections below the Kanban
- Document viewer/editor with sidebar list on Docs tab
- Activity Log timeline with color-coded dots on Log tab
- New Task modal design

**What we changed/added vs Klaus:**
- Added a 4th "Overview" tab for operational monitoring (Klaus only has 3 tabs)
- Our sidebar shows System Info (Memory, Uptime, Ping) persistently
- "Helpers at work" indicator for sub-agent activity
- Name is "Zyga" with ⚡ lightning bolt branding
- We plan to integrate real OpenClaw backend data (from mudrii dashboard project)

---

## What Has Been Built So Far

The current codebase has the following working features (as visible in the screenshots):

### Tab 1: Dashboard (BUILT ✅)
- **Left Sidebar:** Zyga avatar (⚡ logo), name "Zyga", "Working" status with 🔨 emoji, current task description ("Analyzing YouTube Data API integration requirements..."), "Helpers at work" green indicator, System Info section (Memory 4.2GB/16GB, Uptime 3d 12h 4m, Ping 24ms), "Heartbeat check" button at bottom
- **Kanban Board:** 4 columns — To Do (0), In Progress (1), Done (3), Archive. Each column has count badge and "+ Add a card" button. Task cards show priority badge (HIGH in red, MEDIUM in orange), title, description, and date
- **Scheduled Deliverables section:** Below Kanban on the left. Shows cron jobs: Daily AI Pulse (Daily, FOLDER), Daily SWOT Analysis (Daily, FOLDER), Security Audits (Weekly, FOLDER). Each has an emoji icon
- **Notes section:** Below Kanban on the right. Shows "Zyga checks on every heartbeat" subtitle, "Type a note..." textarea with Add button, and existing notes with timestamp + "(seen by Zyga)" tag

### Tab 2: Docs (BUILT ✅)
- **Left sidebar:** "DOCUMENTS" header, search input, document list with emoji icons, titles, dates, and category tags (Security, Guide, AI Pulse)
- **Document viewer:** Shows document title with emoji, "Date created" field, "Category" tag, full markdown rendering with headings, bold, paragraphs
- **Edit mode:** "Editing" badge in breadcrumb, Cancel/Done buttons in top right
- **Sample documents created:** n8n Security Vulnerability Report (Security), Zyga Master Guide (Guide), Daily AI Pulse — Jan 29, 2026 (AI Pulse)

### Tab 3: Log (BUILT ✅)
- **Header:** "Activity Log" title with 📋 emoji, entry count badge ("10 entries"), subtitle "A chronological record of Zyga's actions and completed tasks"
- **Timeline:** Date grouping headers ("WEDNESDAY, FEBRUARY 11"), vertical timeline with color-coded dots (green = completed, blue = info, orange = heartbeat), timestamps on left, detailed descriptions on right
- **Sample entries showing:** Heartbeat checks, Kanban improvements, UX overhauls, dashboard fixes — all with proper timestamps

### Tab 4: Overview (PLACEHOLDER — NOT BUILT YET ❌)
- Tab exists in navigation but content is not yet implemented
- This is where the mudrii dashboard monitoring data needs to be integrated

### New Task Modal (BUILT ✅)
- Modal with "New Task" header and X close button
- "IN LIST" dropdown (defaulting to "To Do")
- "TITLE" input field with purple focus border
- "DESCRIPTION" textarea
- "PRIORITY" toggle buttons: High | Medium (orange selected) | Low
- Cancel / "Add Card" (purple) buttons

### Visual Style (BUILT ✅)
- Dark navy/charcoal background
- Subtle card backgrounds (slightly lighter than page background)
- Purple/violet accent color for active tabs, buttons, focus states
- Orange accent for medium priority and working status
- Green for online status dots and success states
- Clean sans-serif typography
- Top navigation: "Zyga •" branding, tab links, "Last sync" timestamp, logout button
- Generous spacing, minimal decoration, professional look

---

## What Still Needs To Be Done

### 🔴 Critical Fixes

1. ~~**Rename "Klaus" to "Zyga" in the header/navbar.**~~ Done. The top-left now says "Zyga •" everywhere.

2. **Overview Tab — Integrate mudrii dashboard.** This is the biggest remaining task. The Overview tab needs to show operational monitoring data pulled from OpenClaw's backend. See the dedicated section below.

3. **Connect to real data files.** Currently the dashboard likely has hardcoded/sample data. It needs to read and write from JSON files that Zyga (the OpenClaw agent) also reads and writes. This is the critical integration point. See "Data Contract" section below.

### 🟡 Important Improvements

4. **Sidebar System Info should pull real data.** Memory, Uptime, and Ping values should come from the actual VPS/OpenClaw gateway status, not be hardcoded.

5. **Agent status should be dynamic.** The "Working" / "Idle" / "Thinking" / "Sleeping" status should reflect Zyga's actual state from OpenClaw's session data.

6. **"Helpers at work" should show real sub-agent data.** If OpenClaw is running sub-agents, this should reflect that. Otherwise hide it.

7. **Heartbeat check button** at the bottom of the sidebar should trigger an actual heartbeat or at minimum show last heartbeat time.

8. **Notes section** must persist to a JSON file that Zyga reads on every heartbeat cycle. When Zyga reads a note, it marks it as "seen by Zyga."

9. **Kanban board** must persist tasks to a JSON file. Zyga should be able to add tasks, move them between columns, and mark them done — all through the same JSON file.

10. **Log tab** should read from Zyga's actual activity log file, not sample data.

11. **Docs tab** should read markdown files from a documents directory in the workspace.

### 🟢 Nice-to-Have Features (Future)

12. **Chat Tab** — Web-based chat interface to talk to Zyga directly from the dashboard (instead of switching to Telegram). WebSocket connection to OpenClaw's API.

13. **Cost Tracker Widget** — Small widget in sidebar showing today's token spend.

14. **Notification Badge** — Badge on Dashboard tab when Zyga completes a task.

15. **Settings Tab** — Edit Zyga's model, personality (SOUL.md), toggle cron jobs, manage API keys from the UI.

16. **File Manager** — Simple file browser for Zyga's workspace.

---

## Overview Tab: Integrating the mudrii Dashboard

The Overview tab needs to show OpenClaw operational monitoring data. The best reference implementation is the **mudrii/openclaw-dashboard** project: https://github.com/mudrii/openclaw-dashboard

### What mudrii's dashboard provides:
- **Gateway Status Row:** Online/Offline indicator, PID, Uptime, Memory usage, Compaction mode, Active Session count
- **Cost Cards:** Today's Cost, All-Time Cost, Projected Monthly Cost
- **Cost Breakdown:** Donut/pie chart showing cost per AI model
- **Cron Jobs Table:** Status (running/idle/failed), job name, schedule expression, last run time, next run time, duration, model used
- **Active Sessions Table:** Session name, model, type badges (DM/group/cron/subagent), context window usage %, last activity, token count
- **Token Usage & Cost Table:** Per-model breakdown with call count, input tokens, output tokens, cache tokens, total tokens, cost
- **Sub-Agent Activity:** Sub-agent runs with cost, duration, status, token breakdown
- **Bottom Row:** Available models grid, installed skills list, git log

### How mudrii works technically:
- **Backend:** Python `server.py` that reads from OpenClaw's SQLite database at `~/.openclaw/db.sqlite` and OpenClaw's config at `~/.openclaw/openclaw.json`
- **Data collection:** A `refresh.sh` bash script that queries the SQLite database and OpenClaw config, outputs everything into a single `data.json`
- **Frontend:** Single `index.html` file with zero external dependencies — pure HTML/CSS/JS that fetches `/api/refresh` endpoint
- **Runs on:** `localhost:8080` by default

### How to integrate into our project:

**DO NOT iframe mudrii's dashboard.** Instead:

1. **Copy mudrii's backend data-fetching logic** — the SQLite queries and shell commands that collect gateway status, costs, sessions, cron jobs, token usage
2. **Add these as API endpoints** in our project's backend server (Express.js or whatever the current backend is)
3. **Build new frontend components** in the Overview tab that call these API endpoints
4. **Style them to match our existing dark theme** — same card styles, typography, spacing, colors as the other tabs
5. **Key data source:** OpenClaw's SQLite database at `~/.openclaw/db.sqlite` contains all session history, token usage, costs, and cron job records

### API endpoints needed for Overview tab:
```
GET /api/gateway-status    → { online, pid, uptime, memory, activeSessions }
GET /api/costs             → { today, allTime, projectedMonthly, breakdown[] }
GET /api/cron-jobs         → [{ name, status, schedule, lastRun, nextRun, duration, model }]
GET /api/sessions          → [{ name, model, type, contextPercent, lastActivity, tokens }]
GET /api/token-usage       → [{ model, calls, inputTokens, outputTokens, cacheTokens, total, cost }]
```

### Reference repo to study:
```
git clone https://github.com/mudrii/openclaw-dashboard.git
```
Look at `refresh.sh` for the data collection queries and `index.html` for how the data is displayed.

---

## Data Contract: How Dashboard ↔ Zyga Communicate

This is the most critical architectural piece. The dashboard and Zyga (the AI agent) share data through **JSON files on the filesystem**. Both read and write to the same files.

### File Structure

All data files live in the OpenClaw workspace directory. The typical path is:
```
~/.openclaw/workspace/
├── dashboard-data/
│   ├── tasks.json            ← Kanban board tasks
│   ├── notes.json            ← Async notes between user and Zyga
│   ├── deliverables.json     ← Scheduled deliverables/cron job config
│   └── activity-log.json     ← Activity timeline entries
├── documents/
│   ├── zyga-master-guide.md  ← Docs tab reads these
│   ├── soul.md               ← Zyga's personality definition
│   ├── user.md               ← User profile/preferences
│   └── *.md                  ← Any other documents
└── ...
```

### JSON Schemas

#### tasks.json
```json
{
  "columns": {
    "todo": {
      "name": "To Do",
      "tasks": [
        {
          "id": "uuid-v4-string",
          "title": "Task title",
          "description": "Optional description",
          "priority": "high",
          "created_at": "2026-02-11T23:27:00Z",
          "updated_at": "2026-02-11T23:27:00Z",
          "created_by": "user"
        }
      ]
    },
    "in_progress": {
      "name": "In Progress",
      "tasks": []
    },
    "done": {
      "name": "Done",
      "tasks": []
    },
    "archive": {
      "name": "Archive",
      "tasks": []
    }
  }
}
```
- **Dashboard writes:** When user creates/moves/deletes tasks via UI
- **Zyga writes:** When Zyga creates tasks for herself, moves tasks to done, or archives completed work
- **Priority values:** `"high"`, `"medium"`, `"low"`
- **created_by values:** `"user"` or `"zyga"`

#### notes.json
```json
{
  "notes": [
    {
      "id": "uuid-v4-string",
      "text": "testing if this works. when you see this, tell me a joke about dinosaurs.",
      "created_at": "2026-02-11T23:27:00Z",
      "created_by": "user",
      "seen_by_zyga": true,
      "seen_at": "2026-02-11T23:28:00Z"
    }
  ]
}
```
- **Dashboard writes:** When user types a note and clicks Add
- **Zyga reads:** On every heartbeat cycle, checks for unseen notes (seen_by_zyga: false)
- **Zyga writes:** Sets `seen_by_zyga: true` and `seen_at` timestamp after reading

#### deliverables.json
```json
{
  "deliverables": [
    {
      "id": "uuid-v4-string",
      "name": "Daily AI Pulse",
      "emoji": "🤖",
      "frequency": "Daily",
      "type": "folder",
      "cron_expression": "0 8 * * *",
      "enabled": true,
      "last_run": "2026-02-11T08:00:00Z",
      "description": "Daily briefing on AI industry news and developments"
    },
    {
      "id": "uuid-v4-string",
      "name": "Daily SWOT Analysis",
      "emoji": "📊",
      "frequency": "Daily",
      "type": "folder",
      "cron_expression": "0 9 * * *",
      "enabled": true,
      "last_run": "2026-02-11T09:00:00Z",
      "description": "Business analysis of opportunities and threats"
    },
    {
      "id": "uuid-v4-string",
      "name": "Security Audits",
      "emoji": "🔒",
      "frequency": "Weekly",
      "type": "folder",
      "cron_expression": "0 10 * * 1",
      "enabled": true,
      "last_run": "2026-02-10T10:00:00Z",
      "description": "Weekly security vulnerability scan and report"
    }
  ]
}
```

#### activity-log.json
```json
{
  "entries": [
    {
      "id": "uuid-v4-string",
      "timestamp": "2026-02-11T23:19:00Z",
      "type": "heartbeat",
      "color": "orange",
      "description": "Heartbeat: Checked YouTube dashboard - MVP complete, all phases done except Twitter/X integration (blocked). Dashboard live at youtube.agentassisting.com"
    },
    {
      "id": "uuid-v4-string",
      "timestamp": "2026-02-11T23:14:00Z",
      "type": "completed",
      "color": "green",
      "description": "Implemented Kanban UI improvements: (1) Notes now span full card width instead of being constrained by flex row, (2) Added collapse/expand all button to hide/show notes across all cards"
    },
    {
      "id": "uuid-v4-string",
      "timestamp": "2026-02-11T23:09:00Z",
      "type": "info",
      "color": "blue",
      "description": "UX overhaul: Redesigned kanban task cards with cleaner minimal design - removed cluttered buttons, simplified layout, better text handling"
    }
  ]
}
```
- **Color values:** `"green"` (completed/success), `"blue"` (info/update), `"orange"` (heartbeat/routine), `"red"` (error/attention)
- **Type values:** `"completed"`, `"info"`, `"heartbeat"`, `"error"`, `"task_created"`, `"task_moved"`, `"note_seen"`
- **Zyga writes:** Appends entries after every action she takes
- **Dashboard reads:** Displays entries in the Log tab timeline

### Documents Directory
- The Docs tab reads all `.md` files from the documents directory
- Each document has frontmatter or is categorized by a `documents-index.json`:

```json
{
  "documents": [
    {
      "filename": "n8n-security-vulnerability-report.md",
      "title": "n8n Security Vulnerability Report",
      "emoji": "🚨",
      "category": "Security",
      "created_at": "2026-01-29",
      "updated_at": "2026-01-29"
    },
    {
      "filename": "zyga-master-guide.md",
      "title": "Zyga Master Guide",
      "emoji": "📘",
      "category": "Guide",
      "created_at": "2026-01-29",
      "updated_at": "2026-02-11"
    }
  ]
}
```

---

## Backend Architecture

The project needs a backend server that:

1. **Serves the frontend** (HTML/CSS/JS or React app) on `localhost:3000`
2. **Provides REST API endpoints** for:
   - CRUD operations on tasks, notes, deliverables (reading/writing JSON files)
   - Reading activity log entries
   - Reading/listing documents from the documents directory
   - Reading/writing document content (for the edit feature)
   - OpenClaw monitoring data (gateway status, costs, sessions, tokens — from SQLite DB)
3. **Watches for file changes** (optional but ideal) — if Zyga modifies a JSON file, the dashboard updates automatically (WebSocket or SSE push, or polling)

### Suggested API Routes

```
# Dashboard Tab
GET    /api/tasks                    → Read tasks.json
POST   /api/tasks                    → Create new task
PUT    /api/tasks/:id                → Update task (move column, edit)
DELETE /api/tasks/:id                → Delete task

GET    /api/notes                    → Read notes.json
POST   /api/notes                    → Create new note
DELETE /api/notes/:id                → Delete note

GET    /api/deliverables             → Read deliverables.json

# Docs Tab
GET    /api/documents                → List all documents (from index)
GET    /api/documents/:filename      → Read document content
PUT    /api/documents/:filename      → Save edited document

# Log Tab
GET    /api/activity-log             → Read activity-log.json
GET    /api/activity-log?date=2026-02-11  → Filter by date

# Overview Tab (OpenClaw monitoring)
GET    /api/gateway-status           → Gateway health from OpenClaw
GET    /api/costs                    → Cost tracking data
GET    /api/cron-jobs                → Cron job status
GET    /api/sessions                 → Active sessions
GET    /api/token-usage              → Token usage per model

# System
GET    /api/system-info              → Memory, uptime, ping for sidebar
GET    /api/agent-status             → Zyga's current status (working/idle/etc)
```

### Tech Stack
- **Backend:** Node.js with Express (or any lightweight HTTP server)
- **Frontend:** Vanilla HTML/CSS/JS or React — whatever the current codebase uses
- **Database reads:** SQLite3 queries on `~/.openclaw/db.sqlite` for the Overview tab
- **File I/O:** Read/write JSON files for Dashboard, Notes, Log, Docs data
- **No external dependencies required** for the core dashboard — keep it lightweight

---

## Visual Design Specification

### Color Palette
```
Background (page):     #0d1117 (dark navy/charcoal)
Background (cards):    #161b22 (slightly lighter)
Background (sidebar):  #0d1117 or slightly darker
Border (cards):        #30363d (subtle gray border)
Text (primary):        #e6edf3 (light gray/white)
Text (secondary):      #8b949e (muted gray)
Text (muted):          #484f58 (dark gray)

Accent (primary):      #8b5cf6 (purple/violet — buttons, active states, focus rings)
Accent (hover):        #7c3aed (darker purple)

Status green:          #3fb950 (online, success, completed)
Status orange:         #d29922 (warning, in-progress, heartbeat)
Status red:            #f85149 (error, high priority)
Status blue:           #58a6ff (info, links)

Priority high:         #f85149 (red badge)
Priority medium:       #d29922 (orange badge)
Priority low:          #3fb950 (green badge)
```

### Typography
- Clean sans-serif system fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`
- Page title / agent name: 20-24px, bold
- Tab labels: 14-16px, medium weight
- Card titles: 14-16px, semibold
- Body text: 14px, regular
- Timestamps / metadata: 12-13px, muted color
- Monospace for code/technical: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`

### Card Style
- Background: #161b22
- Border: 1px solid #30363d
- Border radius: 8-12px
- Padding: 16-20px
- No heavy glass morphism — clean and minimal
- Subtle box-shadow on hover (optional)

### Spacing
- Page padding: 24-32px
- Card gap: 16-20px
- Section gap: 24-32px
- Generous whitespace — nothing should feel cramped

---

## Project Structure (Suggested)

```
zyga-dashboard/
├── README.md
├── package.json
├── server.js                    ← Express server (API + static file serving)
├── .env.example                 ← Environment variables template
├── .gitignore                   ← Exclude node_modules, .env, data files
│
├── public/                      ← Frontend files served statically
│   ├── index.html               ← Main dashboard page
│   ├── css/
│   │   └── styles.css           ← All styles
│   ├── js/
│   │   ├── app.js               ← Main app logic, tab switching
│   │   ├── dashboard.js         ← Kanban, notes, deliverables logic
│   │   ├── docs.js              ← Document viewer/editor logic
│   │   ├── log.js               ← Activity log rendering
│   │   └── overview.js          ← Monitoring data display
│   └── assets/
│       └── zyga-avatar.svg      ← ⚡ logo
│
├── data/                        ← JSON data files (gitignored in production)
│   ├── tasks.json
│   ├── notes.json
│   ├── deliverables.json
│   ├── activity-log.json
│   └── documents-index.json
│
├── documents/                   ← Markdown documents for Docs tab
│   ├── zyga-master-guide.md
│   └── ...
│
├── lib/                         ← Backend utilities
│   ├── openclaw-reader.js       ← SQLite queries for OpenClaw data
│   ├── file-manager.js          ← JSON file read/write helpers
│   └── system-info.js           ← Memory, uptime, ping helpers
│
├── DATA-CONTRACT.md             ← JSON schema documentation
├── ZYGA-INTEGRATION.md          ← How Zyga connects to the dashboard
└── CHANGELOG.md
```

---

## Environment Configuration

```env
# .env
PORT=3000
OPENCLAW_PATH=/home/zyga/.openclaw
WORKSPACE_PATH=/home/zyga/.openclaw/workspace
DATA_PATH=/home/zyga/.openclaw/workspace/dashboard-data
DOCUMENTS_PATH=/home/zyga/.openclaw/workspace/documents
SQLITE_DB_PATH=/home/zyga/.openclaw/db.sqlite
```

The paths may vary per installation. Use environment variables so it's configurable.

---

## Git Workflow

- **Repository:** https://github.com/artistic-zyga/zyga-dashboard
- **Main branch:** Always stable/working
- **Feature branches:** `feature/overview-tab`, `feature/real-data-integration`, etc.
- **Commit often** with clear messages
- **NEVER commit:** API keys, tokens, passwords, .env files, node_modules
- **.gitignore should exclude:** `node_modules/`, `.env`, `data/*.json` (production data), but include `data/*.example.json` (schema examples)

---

## Implementation Priority

### Phase 1: Fix & Polish (CURRENT PRIORITY)
- [x] Rename all "Klaus" references to "Zyga"
- [ ] Ensure all 4 tabs work with proper routing
- [ ] Create the JSON data files with proper schemas
- [ ] Wire up Dashboard tab to read/write tasks.json and notes.json
- [ ] Wire up Log tab to read activity-log.json
- [ ] Wire up Docs tab to read from documents directory

### Phase 2: Overview Tab
- [ ] Study mudrii/openclaw-dashboard source code
- [ ] Implement backend API endpoints for OpenClaw monitoring data
- [ ] Build Overview tab frontend with: gateway status, cost cards, cron jobs table, sessions table, token usage table
- [ ] Style consistently with existing tabs

### Phase 3: Real Data Integration
- [ ] Connect sidebar System Info to real VPS data
- [ ] Connect agent status to OpenClaw session state
- [ ] Make Heartbeat button functional
- [ ] Add auto-refresh / live updates (polling or WebSocket)
- [ ] Add "Last sync" timestamp that reflects actual data freshness

### Phase 4: Enhancements
- [ ] Cost tracker widget in sidebar
- [ ] Notification badges
- [ ] Document search functionality
- [ ] Activity log filtering by type/date
- [ ] Kanban drag-and-drop (if not already implemented)
- [ ] Responsive design for tablet/mobile

---

## Key Reference Links

| Resource | URL |
|----------|-----|
| mudrii dashboard (integrate into Overview tab) | https://github.com/mudrii/openclaw-dashboard |
| OpenClaw main repo | https://github.com/openclaw/openclaw |
| Klaus dashboard video (inspiration) | https://www.youtube.com/watch?v=rlJovzVhlIo&t=1249s |
| OpenClaw docs | https://docs.openclaw.ai |
| Our GitHub repo | https://github.com/artistic-zyga/zyga-dashboard |

---

## Summary for Cursor

**You are working on a 4-tab dashboard for an AI agent called Zyga that runs on OpenClaw.**

**What exists:** Dashboard tab (Kanban + notes + deliverables), Docs tab (document viewer/editor), Log tab (activity timeline), and a New Task modal — all with a polished dark theme. The Overview tab navigation exists but has no content yet.

**What you need to do:**
1. ~~Rename "Klaus" → "Zyga" everywhere~~ Done
2. Create proper JSON data files and wire the existing UI to read/write from them via API endpoints
3. Build the Overview tab by integrating monitoring components from the mudrii/openclaw-dashboard project (clone it, study the data collection in `refresh.sh` and display in `index.html`, then rebuild those components in our style)
4. Connect the sidebar system info and agent status to real data
5. Keep the existing visual style — it's already good. Don't redesign, just complete and connect.

**The architectural principle:** Dashboard and Zyga (the AI agent) communicate through shared JSON files on the filesystem. The dashboard is the UI layer; Zyga is the agent layer. Both read and write the same data files. The Overview tab additionally reads from OpenClaw's SQLite database for operational monitoring data.
