/**
 * Shared utilities for the Docs editor components.
 * Extracted from DocViewer and DocList to avoid duplication.
 */

import type { DocCategory } from '../types';

/** Tailwind class string for category badge colors */
export function getCategoryColor(cat: DocCategory): string {
  switch (cat) {
    case 'Security': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'Guide': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'Reference': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    case 'AI Pulse': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'System': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    default: return 'text-textMuted bg-gray-800 border-gray-700';
  }
}

/** Emoji icon for a document category */
export function getDocIcon(cat: DocCategory, emoji?: string): string {
  if (emoji) return emoji;
  switch (cat) {
    case 'Security': return '🚨';
    case 'Guide': return '📘';
    case 'Reference': return '🧠';
    case 'AI Pulse': return '📰';
    case 'System': return '⚙️';
    case 'Project': return '📁';
    default: return '📄';
  }
}

/** All available doc categories */
export const DOC_CATEGORIES: DocCategory[] = [
  'Guide', 'Security', 'Reference', 'Project', 'System', 'Spec', 'AI Pulse',
];

/** Format ISO date string to human-readable */
export function formatDocDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Relative time string (e.g. "2 hours ago", "just now") */
export function relativeTime(iso: string): string {
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return formatDocDate(iso);
  } catch {
    return iso;
  }
}

/** Generate a URL-safe filename from a title */
export function titleToFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'untitled';
}

/** Count words in a text string */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/** Count characters in a text string (excluding whitespace for "chars" count) */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length;
}

/** Common emoji set for document icon picker */
export const EMOJI_PALETTE = [
  '📄', '📝', '📘', '📗', '📕', '📙', '📓', '📒', '📋', '📑',
  '🚨', '🔒', '🛡️', '⚙️', '🧠', '💡', '📰', '📁', '📂', '🗂️',
  '🔬', '📊', '📈', '📉', '🧪', '🎯', '🚀', '💻', '🤖', '⚡',
  '🌟', '✨', '🔥', '💎', '🎨', '🏗️', '🔧', '🔩', '📌', '🏷️',
  '✅', '❌', '⚠️', '💬', '📮', '🗓️', '⏰', '🌐', '🔗', '📎',
];
