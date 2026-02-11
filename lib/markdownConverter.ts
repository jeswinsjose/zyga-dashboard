/**
 * BlockNote ↔ Markdown conversion for document persistence.
 * Uses BlockNote's native converters via a headless editor instance.
 */

import { BlockNoteEditor } from '@blocknote/core';
import type { PartialBlock } from '@blocknote/core';

let _converterEditor: BlockNoteEditor | null = null;

function getConverterEditor(): BlockNoteEditor {
  if (!_converterEditor) {
    _converterEditor = BlockNoteEditor.create();
  }
  return _converterEditor;
}

/** Convert Markdown string to BlockNote PartialBlock[] */
export function markdownToBlockNote(markdown: string): PartialBlock[] {
  const editor = getConverterEditor();
  const blocks = editor.tryParseMarkdownToBlocks(markdown || '');
  return blocks as PartialBlock[];
}

/** Convert BlockNote PartialBlock[] to Markdown string */
export function blockNoteToMarkdown(blocks: PartialBlock[]): string {
  if (!blocks?.length) return '';
  const editor = getConverterEditor();
  return editor.blocksToMarkdownLossy(blocks);
}
