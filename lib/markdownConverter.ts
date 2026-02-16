/**
 * BlockNote ↔ Markdown conversion for document persistence.
 * Uses BlockNote's native converters via a headless editor instance.
 * NOTE: BlockNote v0.46+ uses async conversion methods.
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
export async function markdownToBlockNote(markdown: string): Promise<PartialBlock[]> {
  const editor = getConverterEditor();
  const blocks = await editor.tryParseMarkdownToBlocks(markdown || '');
  return blocks as PartialBlock[];
}

/** Convert BlockNote PartialBlock[] to Markdown string */
export async function blockNoteToMarkdown(blocks: PartialBlock[]): Promise<string> {
  if (!blocks?.length) return '';
  const editor = getConverterEditor();
  return await editor.blocksToMarkdownLossy(blocks);
}

