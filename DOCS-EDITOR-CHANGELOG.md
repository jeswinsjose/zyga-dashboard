# Docs Editor Optimization — Changelog

All changes made to transform the docs editor into a proper Notion-style clone.

---

## Phase 1: Bug Fixes

### 1.1 Title edits now persist
- **Before:** Changing the document title only updated local state. The title was never saved unless the block content also changed.
- **After:** Title saves on blur via `handleTitleBlur` in `DocViewer.tsx`. Also syncs to `documents-index.json` via the new PATCH meta endpoint.
- **Files:** `components/DocViewer.tsx`

### 1.2 Editor defaults to view mode
- **Before:** `isEditing` was initialized to `true` — the editor always started in edit mode.
- **After:** `isEditing` defaults to `false`. Users enter edit mode by clicking "Edit" or pressing Ctrl+E. Clicking the title in view mode also enters edit mode.
- **Files:** `components/DocViewer.tsx`

### 1.3 Debounced auto-save
- **Before:** Every single block change triggered an immediate PUT request to the server — excessive API calls on every keystroke.
- **After:** Saves are debounced with an 800ms delay via a new `useDebouncedSave` hook. Rapid changes are batched into a single API call.
- **Files:** `lib/useDebouncedSave.ts` (new), `components/DocsTab.tsx`

### 1.4 Title/emoji/category synced to documents-index.json
- **Before:** Changing title or metadata only updated local React state. The `documents-index.json` file was never updated, so changes were lost on refresh.
- **After:** New `PATCH /api/documents/:filename/meta` endpoint updates title, emoji, and category in the index. The PUT endpoint also updates `updated_at` timestamp.
- **Files:** `server/index.js`, `lib/api.ts`

### 1.5 Failed content loads can be retried
- **Before:** `fetchedRef` marked a document as fetched even on failure, preventing retry.
- **After:** `fetchedRef.current.add(filename)` only runs on success. Failed loads can be retried by re-selecting the document.
- **Files:** `components/DocsTab.tsx`

### 1.6 Save status indicator with error feedback
- **Before:** Save errors were only logged to `console.error` — users had no feedback.
- **After:** A status indicator in the toolbar shows "Saving..." (yellow pulse), "Saved" (green), or "Failed" (red with retry button). Uses the `SaveStatus` type from the debounce hook.
- **Files:** `components/DocViewer.tsx`, `components/DocsTab.tsx`

### 1.7 Shared utility functions extracted
- **Before:** `getCategoryColor()` and `getIcon()` were copy-pasted in both `DocViewer.tsx` and `DocList.tsx`.
- **After:** Extracted to `lib/docUtils.ts` with additional utilities: `formatDocDate`, `relativeTime`, `countWords`, `countCharacters`, `titleToFilename`, `EMOJI_PALETTE`, `DOC_CATEGORIES`.
- **Files:** `lib/docUtils.ts` (new), `components/DocViewer.tsx`, `components/DocList.tsx`

---

## Phase 2: CRUD Operations

### 2.1 Create new document
- **"+ New" button** added to the top of the document sidebar.
- **POST `/api/documents`** server endpoint creates a new `.md` file with auto-generated unique filename, adds entry to `documents-index.json`, and returns metadata.
- New document is auto-selected and pre-populated with `# Untitled` content.
- **Files:** `server/index.js`, `lib/api.ts`, `components/DocList.tsx`, `components/DocsTab.tsx`

### 2.2 Delete document
- **Context menu** (right-click or click "..." on doc list items) includes a "Delete" option.
- **Confirmation dialog** asks "Delete document?" with cancel/confirm before proceeding.
- **DELETE `/api/documents/:filename`** endpoint removes the `.md` file and its entry from the index.
- After deletion, the next document in the list is auto-selected.
- **Files:** `server/index.js`, `lib/api.ts`, `components/DocList.tsx`, `components/DocsTab.tsx`

### 2.3 Duplicate document
- **"Duplicate" option** in the document context menu.
- **POST `/api/documents/:filename/duplicate`** endpoint copies the file content and creates a new entry titled "Copy of {original title}".
- Duplicate is auto-selected after creation.
- **Files:** `server/index.js`, `lib/api.ts`, `components/DocList.tsx`, `components/DocsTab.tsx`

---

## Phase 3: Notion-like UX Enhancements

### 3.1 Emoji picker for page icon
- Clicking the page icon (in edit mode) opens an emoji picker dropdown with 50 common document-related emojis.
- Selected emoji is stored in `documents-index.json` via the PATCH meta endpoint.
- The `getDocIcon()` utility uses custom emoji if set, falling back to category-based defaults.
- **Files:** `components/DocViewer.tsx`, `lib/docUtils.ts`

### 3.2 Editable category with dropdown
- Clicking the category badge (in edit mode) opens a dropdown with all available categories: Guide, Security, Reference, Project, System, Spec, AI Pulse.
- Category change is immediately persisted via the PATCH meta endpoint.
- **Files:** `components/DocViewer.tsx`

### 3.3 "Last edited" relative time
- A new "Last edited" property row displays relative time (e.g., "2h ago", "just now", "3d ago").
- Uses the `relativeTime()` utility from `lib/docUtils.ts`.
- Only shown when `updatedAt` is available in the document data.
- **Files:** `components/DocViewer.tsx`, `lib/docUtils.ts`

### 3.4 Word and block count
- Bottom status bar shows live word count and block count.
- Calculated from BlockNote blocks using recursive text extraction.
- **Files:** `components/DocViewer.tsx`

### 3.5 Table of contents sidebar
- Toggle button in the toolbar (list icon) opens/closes a right-side TOC panel.
- Auto-generated from heading blocks with proper indentation by heading level.
- Click a heading to scroll to it in the editor.
- Only appears when the document has headings.
- **Files:** `components/DocViewer.tsx`

### 3.6 Keyboard shortcuts
- **Ctrl+S** — Force save (flushes debounce timer immediately)
- **Ctrl+E** — Toggle edit/view mode
- **Ctrl+N** — Create new document
- **Escape** — Exit edit mode
- Shortcuts displayed in the bottom status bar.
- **Files:** `components/DocViewer.tsx`

### 3.7 Document favorites and sorting
- **Star toggle** on each document in the sidebar — favorites are pinned to the top.
- Favorites persisted in `localStorage` under `zyga-doc-favorites`.
- **Sort controls** (pill buttons): Recent, Title, Category — favorites always sort first.
- **Files:** `components/DocList.tsx`

### 3.8 Empty state with CTA
- When no document is selected, a welcoming empty state shows "Create your first document" button.
- When the document list is empty, a subtle message appears in the sidebar.
- **Files:** `components/DocViewer.tsx`, `components/DocList.tsx`

### 3.9 Full-width toggle
- Toggle button in the toolbar switches between narrow (`max-w-4xl`) and full-width (`max-w-6xl`) layout.
- Matches Notion's page width toggle behavior.
- **Files:** `components/DocViewer.tsx`

---

## Phase 4: Code Quality

### 4.1 Shared utilities library
- `lib/docUtils.ts` — Single source of truth for category colors, icons, date formatting, relative time, word counting, emoji palette, and category list.
- **Files:** `lib/docUtils.ts` (new)

### 4.2 Debounced save hook
- `lib/useDebouncedSave.ts` — Reusable hook with status tracking (`idle` / `saving` / `saved` / `error`), configurable delay, and `flush()` for force-save.
- **Files:** `lib/useDebouncedSave.ts` (new)

### 4.3 Extended Doc type
- Added `emoji?`, `updatedAt?`, and `isFavorite?` fields to the `Doc` interface.
- **Files:** `types.ts`

---

## New Files Created

| File | Purpose |
|------|---------|
| `lib/docUtils.ts` | Shared utilities (colors, icons, formatting, emoji palette) |
| `lib/useDebouncedSave.ts` | Debounced save hook with status tracking |

## Files Modified

| File | Changes |
|------|---------|
| `components/DocsTab.tsx` | Debounced save, retry logic, create/delete/duplicate handlers, meta updates |
| `components/DocViewer.tsx` | View mode default, title blur save, save indicator, emoji picker, category dropdown, TOC, word count, keyboard shortcuts, full-width toggle, empty state |
| `components/DocList.tsx` | New page button, sort controls, favorites, context menu, delete confirmation, empty state |
| `lib/api.ts` | Added `createDocument`, `deleteDocument`, `updateDocumentMeta`, `duplicateDocument` |
| `server/index.js` | Added POST, DELETE, PATCH, duplicate endpoints; updated PUT to sync `updated_at` |
| `types.ts` | Extended `Doc` with `emoji`, `updatedAt`, `isFavorite` |

---

## New Server Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/documents` | Create new document (file + index entry) |
| DELETE | `/api/documents/:filename` | Delete document (file + index entry) |
| PATCH | `/api/documents/:filename/meta` | Update title/emoji/category in index |
| POST | `/api/documents/:filename/duplicate` | Duplicate a document |
| POST | `/api/documents/:filename/duplicate` | Duplicate a document |
| PUT | `/api/documents/:filename` | *(modified)* Now also updates `updated_at` in index |

---

## Phase 5: Version History & Attribution

### 5.1 Author Attribution
- **Feature**: Tracks who made each edit ("User" vs "OpenClaw").
- **Implementation**: `PUT` endpoint now accepts `editedBy` parameter and persists it in `last_edited_by` frontmatter.
- **Files**: `server/index.js`, `lib/api.ts`, `components/DocsTab.tsx`

### 5.2 Version History Panel
- **Feature**: Slide-in panel showing all past versions with timestamps and file sizes.
- **Implementation**: `GET /versions` endpoint scans `.versions/` directory. Frontend displays list.
- **Files**: `server/index.js`, `components/DocViewer.tsx`

### 5.3 Content Preview
- **Feature**: Text snippet preview for each version in the history list.
- **Implementation**: Server extracts first 100 chars of stripped markdown.
- **Files**: `server/index.js`

### 5.4 Floating Table of Contents
- **Feature**: Replaced sidebar TOC with Notion-style floating TOC on the right edge.
- **Implementation**: Hover-to-reveal strip, auto-hides when history panel is open.
- **Files**: `components/DocViewer.tsx`
