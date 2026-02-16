# OpenClaw → Zyga Docs Integration Guide

OpenClaw can create documents that automatically appear in the Zyga Dashboard Docs tab by simply dropping `.md` files into the `data/documents/` directory.

## Quick Start

1. Write a `.md` file with optional YAML frontmatter
2. Save it to `data/documents/your-doc-name.md`
3. It appears in the Docs tab within 30 seconds (or on next page load)

## Frontmatter Format

Add YAML frontmatter at the top of any `.md` file to control its metadata:

```markdown
---
title: "Daily AI Pulse — Jan 29, 2026"
emoji: "📰"
category: "AI Pulse"
---

# Daily AI Pulse — Jan 29, 2026

Your content here...
```

### Supported Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `title` | No | Extracted from `# Heading` or filename | Display title in sidebar |
| `emoji` | No | `📄` | Icon shown next to the title |
| `category` | No | Auto-detected or `Guide` | Category badge (e.g. Guide, Security, AI Pulse, Report) |

If no frontmatter is present, the system:
- Extracts title from the first `# Heading` line
- Falls back to the filename (hyphens replaced with spaces)
- Auto-detects category from title keywords (security → Security, pulse/daily → AI Pulse, report → Report)

## Filename Conventions

- Use **lowercase, hyphenated** names: `my-new-document.md`
- Must end with `.md`
- Avoid spaces and special characters
- Keep it under 60 characters

## Supported Markdown

The editor uses [BlockNote](https://blocknotejs.org/) internally. The following GFM features are fully supported:

- **Headings**: `#`, `##`, `###` (H1-H3)
- **Bold/Italic**: `**bold**`, `*italic*`
- **Lists**: `- item` (bullet), `1. item` (numbered)
- **Code blocks**: ` ```lang ... ``` `
- **Inline code**: `` `code` ``
- **Blockquotes**: `> quoted text`
- **Tables**: Standard GFM pipe tables
- **Horizontal rules**: `---`
- **Links**: `[text](url)`

### Formatting Notes

- BlockNote saves lists with blank lines between items (loose lists). This is normal.
- The `blocksToMarkdownLossy` conversion may slightly reformat markdown on save — the rendered output is always identical between Preview and Edit modes.
- Frontmatter is automatically preserved across edits — users won't see or modify it.

## Auto-Discovery Flow

```
OpenClaw writes .md → server detects on 30s sync → index updated → frontend polls → doc appears in sidebar
```

The server runs `syncDocumentsIndex()`:
1. On startup
2. Every 30 seconds
3. On every `GET /api/documents` request

The frontend polls `GET /api/documents` every 30 seconds and merges new entries into the sidebar.

## API Endpoints

OpenClaw can also use the REST API directly:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST /api/documents` | Create a new document with `{ title, emoji?, category?, content? }` |
| `GET /api/documents` | List all documents (triggers auto-sync) |
| `GET /api/documents/:filename` | Read content (frontmatter stripped) |
| `PUT /api/documents/:filename` | Update (`{ content, editedBy }`) — snapshots previous version & updates author attribution |
| `PATCH /api/documents/:filename/meta` | Update title/emoji/category |
| `DELETE /api/documents/:filename` | Delete a document |
