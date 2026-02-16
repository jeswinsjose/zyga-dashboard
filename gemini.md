# Project Constitution

## Data Schemas

### Document (Doc)
```typescript
interface Doc {
  id: string; // filename
  title: string;
  emoji?: string;
  date: string;
  updatedAt?: string;
  category: DocCategory;
  isFavorite?: boolean;
  content?: string; // Legacy markdown
  blocks?: PartialBlock[]; // BlockNote JSON
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'archive';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: number;
  createdBy?: 'user' | 'zyga';
}
```

### API Endpoints
- `GET /api/documents`: Returns `DocumentIndexItem[]`
- `GET /api/documents/:filename`: Returns markdown string (content)
- `PUT /api/documents/:filename`: Saves markdown content
- `POST /api/documents`: Creates new document

## Behavioral Rules
1. **Local-First**: All data is stored in the local filesystem (via the API server). No external databases.
2. **OpenClaw Optimized**: Code should be modular, readable, and structured for agents to parse easily.
3. **Strict Types**: Use TypeScript interfaces for all data structures.
4. **Component Isolation**: UI components should handle their own rendering state but sync with parents via callbacks (avoid prop drilling where context is better, but prefer explicit props for simplicity if shallow).

## Architectural Invariants
1. **The "Data-First" Rule**: Schema must be defined before coding tools.
2. **Self-Annealing**: Analyze -> Patch -> Test -> Update Architecture.
3. **Layered Architecture**: 
   - Layer 1: SOPs (`architecture/`)
   - Layer 2: Navigation (Decision)
   - Layer 3: Tools (`tools/`)

## Maintenance Log
- **[2026-02-16]**: Initialization of System Pilot Protocol.
- **[2026-02-16]**: Defined Data Schemas for Docs and Tasks.
- **[2026-02-16]**: Fixed critical state synchronization bug in DocsTab.
- **[2026-02-16]**: Polished UI (Custom Scrollbars, Layout Consistency).
