# SOP: UI Bug Fixing

## Goal
Systematically identify and fix UI bugs in the Zyga Dashboard, focusing on the BlockNote editor and general layout.

## Scope
- `components/BlockNoteEditor.tsx`
- `components/DocViewer.tsx`
- `components/DocsTab.tsx`
- Global CSS (`index.css`)

## Procedure

### 1. Style Isolation
- Ensure `BlockNote` styles are scoped to `.bn-container[data-blocknote-zyga]`.
- Override default Mantine/BlockNote styles only when necessary to match the `#0d1117` GitHub Dark theme.

### 2. Layout Stability
- Editor container should have `max-w-5xl` (or similar) to prevent wide text on large screens.
- Scrollbars should be custom styled (GitHub style) or hidden if preferred, but accessible.
- Prevent layout shifts when saving (optimistic updates).

### 3. Interaction Logic
- **Insertion**: New blocks must appear *after* the cursor or current block.
- **Heads-up**: Slash menu and formatting toolbar must not be clipped by `overflow: hidden` containers. *Check z-index and overflow settings.*

## Verification
- Test creating a document.
- Test typing, hitting Enter (new block).
- Test `/` commands.
- Test converting block types (Paragraph -> Heading).
- Resize window to check responsiveness.
