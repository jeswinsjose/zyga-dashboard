/**
 * OpenClaw Data Reader — Operational monitoring data for Overview tab
 *
 * LAYER 1 (CURRENT): Returns mock data from overview-mock.json for development.
 * LAYER 2 (TODO): Swap for real SQLite queries from ~/.openclaw/db.sqlite and config files.
 *
 * Data sources to integrate (see mudrii/openclaw-dashboard refresh.sh):
 * - Gateway: ps aux | grep openclaw-gateway, ps -p PID -o etime=,rss=
 * - Costs: aggregate from sessions/*.jsonl usage.cost
 * - Sessions: agents/*/sessions/sessions.json
 * - Cron: openclaw/cron/jobs.json
 * - Token usage: agents/*/sessions/*.jsonl message.usage
 * - SQLite: ~/.openclaw/db.sqlite for session history, token usage tables
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/dashboard-data');
const MOCK_PATH = path.join(DATA_DIR, 'overview-mock.json');

/** Default OpenClaw home path — used when reading real data */
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw');
const DB_PATH = path.join(OPENCLAW_HOME, 'db.sqlite');

/**
 * Read overview data. Currently returns mock data.
 *
 * TODO LAYER 2: Replace with real data collection:
 * 1. Check if db.sqlite exists at OPENCLAW_HOME
 * 2. Query gateway status from process list (ps) or heartbeat file
 * 3. Query costs from SQLite: SELECT model, SUM(cost) FROM token_usage GROUP BY model
 * 4. Query sessions from SQLite or agents/*/sessions/sessions.json
 * 5. Query cron jobs from openclaw/cron/jobs.json
 * 6. Query token usage from SQLite or aggregate from sessions/*.jsonl
 */
export async function readOverviewData() {
  // LAYER 1: Mock data
  try {
    const data = await fs.readFile(MOCK_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('overview-mock.json not found');
    }
    throw err;
  }

  // TODO LAYER 2: Real data
  // const dbExists = await fs.access(DB_PATH).then(() => true).catch(() => false);
  // if (dbExists) {
  //   const sqlite3 = await import('sqlite3'); // or better-sqlite3
  //   const db = new sqlite3.Database(DB_PATH);
  //   // Query sessions, token_usage, costs...
  //   // Parse cron/jobs.json, agents/*/sessions/sessions.json
  //   return { gatewayStatus, costs, cronJobs, sessions, tokenUsage };
  // }
  // Fallback to mock if no DB
}
