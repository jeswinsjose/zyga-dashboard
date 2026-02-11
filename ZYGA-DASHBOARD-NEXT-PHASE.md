# Zyga Dashboard — Next Phase: Animated Avatar, Sidebar Enhancements & Polish

> Read this fully before coding. This covers multiple features to implement in order.

---

## 1. 🎭 Animated Agent Avatar with Dynamic States (TOP PRIORITY)

Replace the current static ⚡ avatar with an **animated character/emoji system** that reflects Zyga's real-time state. This is the personality centerpiece of the dashboard — it makes Zyga feel alive.

### How it works (inspired by Nate Herk's Klaus dashboard):

The avatar area in the left sidebar should show a **different animated emoji/icon** depending on Zyga's current status. Each state has its own animation.

### States and their visuals:

| State              | Emoji/Icon                       | Animation                                                         | Status Text           | Color            |
| ------------------ | -------------------------------- | ----------------------------------------------------------------- | --------------------- | ---------------- |
| **Working**        | 🔨 or ⚒️ or a custom hammer icon | Gentle pulsing glow + subtle bounce/swing animation on the emoji  | "Working"             | Orange (#d29922) |
| **Thinking**       | 🤔 or 🧠                         | Slow pulsing/breathing animation, maybe dots animating (...)      | "Thinking..."         | Purple (#8b5cf6) |
| **Idle**           | 😊 or ⚡ (default logo)          | Gentle idle float/bob animation, soft glow                        | "Idle"                | Green (#3fb950)  |
| **Sleeping**       | 😴 or 💤                         | Very slow breathing animation, dimmed/lower opacity, floating Z's | "Sleeping"            | Gray (#8b949e)   |
| **Error**          | ⚠️ or 😵                         | Shake/vibrate animation, red pulsing glow                         | "Error"               | Red (#f85149)    |
| **Executing Cron** | ⏰ or 🤖                         | Spinning/rotating animation                                       | "Running cron job..." | Blue (#58a6ff)   |

### Implementation approach:

**Option A (Recommended — CSS animated emoji):**

- Use large emoji (48-64px) as the avatar
- Wrap in a container with CSS animations per state
- The ⚡ logo stays as the background/base, emoji overlays on top based on state
- Use CSS `@keyframes` for each animation type:

```css
/* Working — pulse + subtle bounce */
@keyframes working {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px #d29922);
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 16px #d29922);
  }
}

/* Thinking — breathing + dots */
@keyframes thinking {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.98);
    opacity: 0.8;
  }
}

/* Idle — gentle float */
@keyframes idle {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* Sleeping — slow dim */
@keyframes sleeping {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.97);
  }
}

/* Error — shake */
@keyframes error {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
```

**Option B (Lottie/SVG animations — more polished but more work):**

- Create or find small Lottie animations for each state
- Use `lottie-web` or `@lottiefiles/react-lottie-player`
- More visually impressive but requires animation assets

**Go with Option A first** — it's simpler and we can upgrade to Lottie later.

### Status indicator dot:

- Green pulsing dot next to the name for "Online" states (Working, Thinking, Idle, Executing)
- Gray static dot for "Sleeping"
- Red pulsing dot for "Error"
- The dot should have a subtle CSS pulse animation:

```css
@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(63, 185, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(63, 185, 80, 0);
  }
}
```

### How the state is determined:

- Read from the API endpoint `GET /api/agent-status`
- For now, create this endpoint returning mock data with a `status` field
- Add a dropdown or buttons in a hidden dev panel to manually toggle states for testing
- Later, this will connect to OpenClaw's actual session data

### Add a dev/test control:

Add a small hidden control (click the avatar 5 times, or add a `/test-states` route) that cycles through all states every 3 seconds so we can see all animations working. This is for development only.

### Current task text below status:

- When Working: Show the actual task description (e.g., "Analyzing YouTube Data API integration requirements...")
- When Thinking: Show "Processing..." or the query being reasoned about
- When Idle: Show "Ready for tasks"
- When Sleeping: Show "Zzz... next heartbeat at [time]"
- When Error: Show error message or "Check logs"
- When Executing Cron: Show cron job name (e.g., "Running: Daily AI Pulse")

---

## 2. 🔗 Sidebar System Info — Connect to Real Data

The sidebar currently shows hardcoded System Info (Memory 4.2GB/16GB, Uptime 3d 12h 4m, Ping 24ms). Wire this to real data.

### Create API endpoint:

```
GET /api/system-info
```

**For mock mode (now):**
Return data from a config or mock file, but make it dynamic — e.g., increment uptime every minute, vary memory slightly.

**For real mode (later on VPS):**

```javascript
// lib/system-info.js
const os = require("os");
const { execSync } = require("child_process");

function getSystemInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptime = os.uptime(); // seconds

  return {
    memory: {
      used: (usedMem / 1024 / 1024 / 1024).toFixed(1), // GB
      total: (totalMem / 1024 / 1024 / 1024).toFixed(0), // GB
      percentage: Math.round((usedMem / totalMem) * 100),
    },
    uptime: formatUptime(uptime), // "3d 12h 4m"
    ping: measurePing(), // measure latency to localhost gateway
  };
}
```

### Frontend:

- Poll `/api/system-info` every 30 seconds
- Update sidebar values
- Add a subtle color change if memory is high (>80% = orange, >90% = red)
- Uptime should tick up in real-time on the frontend between polls

---

## 3. 🫀 Heartbeat Button Enhancement

The "Heartbeat check" button at the bottom of the sidebar should be more useful.

### Make it functional:

- Clicking it should call `POST /api/heartbeat-trigger`
- Show a loading spinner while processing
- After completion, show the result: "Heartbeat OK — 2 notes read, 1 task updated" or "Heartbeat OK — nothing new"
- Display last heartbeat time: "Last heartbeat: 2m ago"
- Add a subtle pulse animation to the button every 5 minutes to indicate the next heartbeat is coming

### API endpoint:

```
POST /api/heartbeat-trigger → triggers a manual heartbeat check
GET /api/heartbeat-status → { lastRun, nextRun, notesSeen, tasksUpdated }
```

For now, mock this — the real heartbeat integration happens when connected to OpenClaw on the VPS.

---

## 4. 📊 Cost Tracker Widget in Sidebar

Add a small cost summary widget in the sidebar, below System Info.

```
TODAY'S COST
$12.47  ↑ 15%

This keeps cost awareness always visible without switching to the Overview tab.
```

### Implementation:

- Read from the same `/api/overview` endpoint (or a dedicated `/api/costs/today`)
- Show today's cost in large text
- Show percentage change vs yesterday (↑ or ↓ with color)
- Green if below average, orange if above, red if significantly over budget
- Click to navigate to Overview tab

---

## 5. 🔔 Notification System

Add a notification indicator that shows when Zyga has completed tasks or needs attention.

### Visual:

- Small badge/dot on the tab labels when there's something new
- Dashboard tab: badge when new tasks are completed
- Log tab: badge showing count of new unread log entries
- Docs tab: badge when new documents are created

### Implementation:

- Track "last viewed" timestamp per tab in localStorage
- Compare against latest entry timestamps from API
- Show a small red/purple dot or count badge on the tab label
- Clear badge when user clicks on that tab

### Notification toast (optional but nice):

- When a new log entry appears (polling), show a small toast notification at the bottom right
- "Zyga completed: YouTube Dashboard MVP" with a dismiss button
- Auto-dismiss after 5 seconds

---

## 6. 🔍 Activity Log Enhancements

### Add type filter buttons:

- Row of filter pills at the top of the Log tab: All | Completed | Info | Heartbeat | Error
- Clicking a filter shows only that type
- "All" is selected by default
- Each pill shows count: "Completed (5)" "Error (1)"

### Add search:

- Search input that filters entries by description text
- Instant filtering as user types

### Entry expansion:

- Long log entries should truncate to 2 lines
- Click to expand and see full description
- Smooth expand/collapse animation

---

## 7. 📋 Kanban Drag-and-Drop

If not already implemented, add proper drag-and-drop for task cards between columns.

### Implementation:

- Use `@dnd-kit/core` and `@dnd-kit/sortable` (React) or native HTML5 drag-and-drop
- Drag a card from one column to another
- Visual feedback: card lifts on grab, destination column highlights on hover
- On drop: call `PUT /api/tasks/:id` with new column
- Smooth animation on move

### Also add:

- Click on a task card to expand/edit it (modal or inline)
- Task card shows creation date and who created it (user vs zyga)
- Archive button on Done column cards (move to Archive after confirmation)

---

## 8. ⚙️ Settings Panel (Lower Priority)

Add a settings icon (⚙️) in the top right of the navbar, next to "Last sync" and "logout".

### Settings modal/panel should include:

- **Agent Name:** Editable text field (default: "Zyga")
- **Status Override:** Dropdown to manually set agent status (for testing)
- **Theme:** Dark (current) / (future: light, custom)
- **Auto-refresh interval:** 30s / 60s / 5m / Off
- **Data paths:** Display (read-only) the configured paths for workspace, data, documents
- **About:** Version, GitHub repo link, OpenClaw version

---

## 9. 🕐 "Last Sync" Should Be Real

The top-right "Last sync: 1:29:43 PM 🟡" should reflect actual data freshness.

### Implementation:

- Track when the last API call was made
- Update the timestamp on every successful data fetch
- The dot should be:
  - 🟢 Green: synced within last 60 seconds
  - 🟡 Yellow: synced 1-5 minutes ago
  - 🔴 Red: no sync for 5+ minutes (connection issue?)
- Clicking it should trigger a manual refresh of all data

---

## 10. 📱 Responsive Design Pass

The dashboard should work on tablet-width screens (for when Jeswin checks from his phone/tablet via Tailscale).

### Key adjustments:

- Sidebar collapses to icon-only on screens < 1024px
- Kanban columns stack vertically on mobile
- Overview cards go from 4-column to 2-column on tablet, 1-column on mobile
- Tables become horizontally scrollable
- Tab navigation becomes scrollable if needed

---

## Implementation Order

Tell Cursor to implement in this order:

1. **Animated avatar + status states** (this is the fun, personality-defining feature)
2. **Sidebar real data + cost widget** (quick wins, high value)
3. **Notification badges on tabs** (improves daily usability)
4. **Log tab filters + search** (polish)
5. **Kanban drag-and-drop** (if not already done)
6. **Last Sync real implementation** (small fix)
7. **Heartbeat button** (functional enhancement)
8. **Settings panel** (nice to have)
9. **Responsive design** (future)

---

## Testing the Avatar Animations

After implementing #1, we need a way to test all states. Add this:

### Test mode toggle:

- Add a keyboard shortcut (Ctrl+Shift+D) or click the Zyga avatar 5 times rapidly
- This opens a small floating "Dev Panel" with:
  - Buttons for each state: Working | Thinking | Idle | Sleeping | Error | Cron
  - A "Cycle All" button that auto-rotates through all states every 3 seconds
  - A "Reset" button to go back to normal API-driven state
- The dev panel should be subtle (small, semi-transparent, bottom-left corner)
- This is for development/testing only but keep it in the codebase (it's useful for demos too)

---

## Summary

The dashboard is functionally complete — all 4 tabs work with real data APIs. Now we're adding **personality** (animated avatar), **polish** (notifications, filters, real sync), and **quality of life** (drag-and-drop, settings, responsive). The avatar animation is the #1 priority because it transforms the dashboard from "a monitoring tool" into "Zyga's home."
