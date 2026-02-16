# Zyga Master Guide

## Introduction

Zyga is a personal AI dashboard that combines task management, documentation, notes, and AI-powered automation into a single workspace. Think of it as your command center for managing projects, tracking AI agent activities, and keeping documentation organized.

## Architecture

# Test Heading Works

```text
```

This is a quote block

### Frontend (React + Vite)

* Built with React and TypeScript

* Uses TailwindCSS for styling

* Vite as the build tool for fast development

* BlockNote editor for rich document editing

### Backend (Express.js)

* Simple Express server for API endpoints

* File-based storage (JSON + Markdown)

* No database required — all data lives in `data/` directory

### Key Components

* **Dashboard**: Overview with system stats, costs, and agent status

* **Docs**: Markdown document editor with preview mode

* **Notes**: Quick notes and snippets

* **Tasks**: Kanban-style task management

* **Log**: Activity and event logging

* **Overview**: High-level project summary

## Getting Started

1. Install dependencies: `npm install`

2. Start development server: `npm run dev:all`

3. Open `http://localhost:3000`

## File Structure

```text
zyga-dashboard/
├── components/     # React components
├── lib/            # Utility functions
├── server/         # Express API server
├── data/           # JSON and Markdown data files
├── types.ts        # TypeScript types
└── App.tsx         # Main application entry
```

## Features

### Document Editor

* Markdown preview with syntax highlighting

* Block-based editing via BlockNote

* Auto-save with debounced writes

* Table of contents generation

* Document categories and emoji icons

### AI Agent Integration

* Real-time agent status monitoring

* Heartbeat checks and uptime tracking

* Cron job execution tracking

* Activity logging

### Task Management

* Kanban board with drag-and-drop

* Task categories and priority levels

* Due date tracking

### jlfjsljs

jsjlsj
