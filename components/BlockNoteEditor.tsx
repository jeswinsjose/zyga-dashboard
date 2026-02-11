import React, { useCallback, useRef, useEffect } from 'react';
import { PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { darkDefaultTheme, Theme } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { blocksToBlockNote } from '../lib/blockConverters';
import type { Block } from '../types';

// Dark theme matching app (#0d1117 background)
const darkTheme: Theme = {
  ...darkDefaultTheme,
  colors: {
    ...darkDefaultTheme.colors,
    editor: {
      text: '#c9d1d9',
      background: '#0d1117',
    },
    menu: {
      text: '#c9d1d9',
      background: '#161b22',
    },
    tooltip: {
      text: '#c9d1d9',
      background: '#161b22',
    },
    hovered: {
      text: '#fff',
      background: '#30363d',
    },
    selected: {
      text: '#fff',
      background: '#8b5cf6',
    },
    disabled: {
      text: '#8b949e',
      background: '#21262d',
    },
    shadow: '#30363d',
    border: '#30363d',
    sideMenu: '#8b949e',
    highlights: darkDefaultTheme.colors?.highlights,
  },
  borderRadius: 6,
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
};

const theme = {
  light: { ...darkTheme },
  dark: darkTheme,
};

export interface BlockNoteEditorProps {
  /** Legacy Block[] or BlockNote PartialBlock[] - converted as needed */
  blocks: Block[] | PartialBlock[];
  onChange: (blocks: PartialBlock[]) => void;
  readOnly?: boolean;
  /** When doc changes, replace editor content with new blocks */
  docId?: string;
}

/** Check if blocks are in our legacy format (Block from types.ts) */
function isLegacyBlocks(blocks: Block[] | PartialBlock[]): blocks is Block[] {
  if (!blocks?.length) return false;
  const first = blocks[0] as Record<string, unknown>;
  const legacyTypes = ['heading1', 'heading2', 'heading3', 'todo', 'callout'];
  return legacyTypes.includes(first?.type as string) || 'properties' in first;
}

/**
 * Notion-style block-based editor using BlockNote.
 * Supports view mode (readOnly) and edit mode with slash commands, drag & drop, rich text.
 */
export const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  blocks,
  onChange,
  readOnly = false,
  docId,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const prevDocIdRef = useRef<string | undefined>(undefined);

  const initialContent: PartialBlock[] =
    !blocks || blocks.length === 0
      ? [{ type: 'paragraph', content: '' }]
      : isLegacyBlocks(blocks)
        ? blocksToBlockNote(blocks)
        : (blocks as PartialBlock[]);

  const editor = useCreateBlockNote({ initialContent }, [docId]);

  // When doc changes, replace content with new blocks (handles doc switch + initial load with correct blocks)
  useEffect(() => {
    if (editor && docId && blocks && blocks.length > 0) {
      const content =
        isLegacyBlocks(blocks) ? blocksToBlockNote(blocks) : (blocks as PartialBlock[]);
      if (docId !== prevDocIdRef.current) {
        prevDocIdRef.current = docId;
        try {
          editor.replaceBlocks(editor.document, content);
        } catch {
          // Ignore during teardown
        }
      }
    }
  }, [docId, editor, blocks]);

  const handleChange = useCallback(() => {
    if (editor && onChangeRef.current) {
      try {
        const doc = editor.document;
        if (doc && doc.length > 0) {
          onChangeRef.current(doc);
        }
      } catch {
        // Ignore during teardown
      }
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="blocknote-editor-wrapper w-full max-w-5xl mx-auto pb-32">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        onChange={handleChange}
        theme={theme}
        data-blocknote-zyga
      />
    </div>
  );
};
