/**
 * Converters between our legacy Block format and BlockNote's PartialBlock format.
 * BlockNote uses: id, type, props, content (InlineContent[] | string), children
 */

import type { PartialBlock } from '@blocknote/core';
import type { Block, BlockType } from '../types';

/**
 * Extract plain text from HTML string (strips tags, decodes entities).
 * Used when migrating from legacy HTML content to BlockNote's content format.
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Convert our legacy Block[] to BlockNote PartialBlock[] for initialContent.
 */
export function blocksToBlockNote(blocks: Block[]): PartialBlock[] {
  if (!blocks || blocks.length === 0) {
    return [{ type: 'paragraph', content: '' }];
  }

  return blocks.map((b) => {
    const plainContent = htmlToPlainText(b.content);
    const base: PartialBlock = {
      id: b.id,
      content: plainContent,
    };

    switch (b.type) {
      case 'heading1':
        return { ...base, type: 'heading', props: { level: 1 } };
      case 'heading2':
        return { ...base, type: 'heading', props: { level: 2 } };
      case 'heading3':
        return { ...base, type: 'heading', props: { level: 3 } };
      case 'bulletListItem':
        return { ...base, type: 'bulletListItem' };
      case 'numberedListItem':
        return { ...base, type: 'numberedListItem' };
      case 'todo':
        return {
          ...base,
          type: 'checkListItem',
          props: { checked: !!b.properties?.checked },
        };
      case 'quote':
        return { ...base, type: 'quote' };
      case 'code':
        return {
          ...base,
          type: 'codeBlock',
          props: { language: (b.properties?.language as string) || 'plaintext' },
        };
      case 'divider':
        return { ...base, type: 'divider', content: undefined };
      case 'callout':
        return {
          ...base,
          type: 'paragraph',
          props: { backgroundColor: 'blue' },
        };
      default:
        return { ...base, type: 'paragraph' };
    }
  });
}
