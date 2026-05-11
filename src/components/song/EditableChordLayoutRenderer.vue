<script setup lang="tsx">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import { EditorContent, useEditor } from '@tiptap/vue-3';
  import { Mark, mergeAttributes, type JSONContent } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { STATIC_CHORD_FILTER_LIST } from '../../lib/chords/chords';
  import { Menu } from '@ark-ui/vue/menu';

  interface Props {
    text: string;
    editablePlaceholder?: string;
    contextChords?: string[];
  }

  interface Emits {
    (event: 'update:text', value: string): void;
  }

  interface SelectionRange {
    from: number;
    to: number;
  }

  interface RenderPart {
    text: string;
    chord?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    editablePlaceholder: 'Začněte psát text písně...',
    contextChords: () => [],
  });

  const emit = defineEmits<Emits>();

  const FALLBACK_CONTEXT_CHORDS = STATIC_CHORD_FILTER_LIST.slice(0, 20);
  const contextSelection = ref<SelectionRange | null>(null);
  const isContextMenuOpen = ref(false);
  const canRemoveChordAtSelection = ref(false);

  const contextChordItems = computed(() => {
    const items = props.contextChords.length > 0 ? props.contextChords : FALLBACK_CONTEXT_CHORDS;
    return Array.from(new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)));
  });

  const ChordMark = Mark.create({
    name: 'chord',
    inclusive: false,
    addAttributes() {
      return {
        chord: {
          default: '',
          parseHTML: (element) => element.getAttribute('data-before-content') ?? '',
          renderHTML: (attributes) => ({
            'data-before-content': attributes.chord,
            'data-chord-anchor': attributes.chord,
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-chord-anchor]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const chordLabel = String(HTMLAttributes['data-before-content'] ?? '');

      return [
        'span',
        mergeAttributes(HTMLAttributes, { class: 'clr-anchored' }),
        [
          'span',
          {
            class: 'clr-badge',
            contenteditable: 'false',
          },
          ['span', { class: 'clr-badge-label' }, chordLabel],
          [
            'button',
            {
              type: 'button',
              class: 'clr-badge-delete',
              'data-chord-delete': 'true',
              'aria-label': 'Odebrat akord',
              contenteditable: 'false',
              tabindex: '-1',
            },
            'x',
          ],
        ],
        ['span', { class: 'clr-lyric' }, 0],
      ];
    },
  });

  const CHORD_TOKEN_REGEX =
    /^\[?[A-GH][#b]?(?:m(?:aj)?(?:7|9|11|13)?|dim7?|aug|sus[24]?|M7|(?:add)?(?:2|4|6|7|9|11|13))?(?:\/[A-GH][#b]?)?\]?$/;

  function isChordToken(token: string): boolean {
    return CHORD_TOKEN_REGEX.test(token.trim());
  }

  function chordValue(token: string): string {
    return token.trim().replace(/^\[|\]$/g, '');
  }

  function standaloneChordPlaceholder(chord: string): string {
    return ' '.repeat(Math.max(chord.length, 1));
  }

  function getRenderParts(line: string): RenderPart[] {
    const parts: RenderPart[] = [];
    let index = 0;
    let pendingChord: string | undefined;

    while (index < line.length) {
      const chordMatch = line.slice(index).match(/^\[[^\]]+\]/);

      if (chordMatch && isChordToken(chordMatch[0])) {
        if (pendingChord) {
          parts.push({
            chord: pendingChord,
            text: standaloneChordPlaceholder(pendingChord),
          });
        }

        pendingChord = chordValue(chordMatch[0]);
        index += chordMatch[0].length;
        continue;
      }

      if (pendingChord) {
        const whitespaceMatch = line.slice(index).match(/^\s+/);

        if (whitespaceMatch) {
          parts.push({ text: whitespaceMatch[0] });
          index += whitespaceMatch[0].length;
          continue;
        }

        const anchoredMatch = line.slice(index).match(/^[^\s[]+/);

        if (anchoredMatch) {
          parts.push({
            chord: pendingChord,
            text: anchoredMatch[0],
          });
          pendingChord = undefined;
          index += anchoredMatch[0].length;
          continue;
        }

        parts.push({ text: '[' });
        pendingChord = undefined;
        index += 1;
        continue;
      }

      const nextChordIndex = line.indexOf('[', index);
      const plainTextEnd = nextChordIndex === -1 ? line.length : nextChordIndex;

      if (plainTextEnd > index) {
        parts.push({ text: line.slice(index, plainTextEnd) });
        index = plainTextEnd;
        continue;
      }

      parts.push({ text: line[index] ?? '' });
      index += 1;
    }

    if (pendingChord) {
      parts.push({
        chord: pendingChord,
        text: standaloneChordPlaceholder(pendingChord),
      });
    }

    return parts;
  }

  function toEditorDoc(text: string): JSONContent {
    const lines = text.split('\n').map((line) => getRenderParts(line));

    return {
      type: 'doc',
      content: lines.map((line) => ({
        type: 'paragraph',
        content: line
          .filter((part) => part.text.length > 0)
          .map((part) => {
            if (!part.chord) {
              return {
                type: 'text',
                text: part.text,
              };
            }

            return {
              type: 'text',
              text: part.text,
              marks: [{ type: 'chord', attrs: { chord: part.chord } }],
            };
          }),
      })),
    };
  }

  function fromEditorDoc(content: JSONContent): string {
    const lines = (content.content ?? []).map((block) => {
      if (block.type !== 'paragraph') {
        return '';
      }

      let value = '';
      for (const node of block.content ?? []) {
        if (node.type === 'hardBreak') {
          value += '\n';
          continue;
        }

        if (node.type !== 'text') {
          continue;
        }

        const chordMark = node.marks?.find((mark) => mark.type === 'chord');
        const chord = chordMark?.attrs?.chord;

        if (typeof chord === 'string' && chord.length > 0) {
          value += `[${chord}]`;
        }

        value += node.text ?? '';
      }

      return value;
    });

    return lines.join('\n');
  }

  const editor = useEditor({
    editable: true,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        orderedList: false,
        strike: false,
      }),
      ChordMark,
    ],
    content: toEditorDoc(props.text),
    editorProps: {
      attributes: {
        class: 'chord-layout-renderer chord-layout-editor-surface',
      },
    },
    onUpdate: ({ editor: instance }) => {
      emit('update:text', fromEditorDoc(instance.getJSON()));
    },
  });

  watch(
    () => props.text,
    (text) => {
      const instance = editor.value;
      if (!instance) {
        return;
      }

      const currentText = fromEditorDoc(instance.getJSON());
      if (currentText === text) {
        return;
      }

      instance.commands.setContent(toEditorDoc(text), { emitUpdate: false });
    }
  );

  function applyChordToSelection(chordInput: string): void {
    const instance = editor.value;
    const chord = chordInput.trim();

    if (!instance || chord.length === 0) {
      return;
    }

    const selection = contextSelection.value ?? instance.state.selection;
    const from = selection.from;
    const to = selection.to;

    instance.chain().focus().setTextSelection({ from, to }).run();

    if (from === to) {
      instance
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: ' ',
          marks: [{ type: 'chord', attrs: { chord } }],
        })
        .run();
      contextSelection.value = null;
      return;
    }

    instance.chain().focus().setMark('chord', { chord }).run();
    contextSelection.value = null;
    canRemoveChordAtSelection.value = false;
  }

  function isChordAppliedInSelection(from: number, to: number): boolean {
    const instance = editor.value;
    if (!instance) {
      return false;
    }

    const chordType = instance.state.schema.marks.chord;
    if (!chordType) {
      return false;
    }

    if (from === to) {
      return instance.state.selection.$from.marks().some((mark) => mark.type === chordType);
    }

    return instance.state.doc.rangeHasMark(from, to, chordType);
  }

  function captureSelectionForContextMenu(): void {
    const instance = editor.value;
    if (!instance) {
      return;
    }

    const selection = instance.state.selection;
    contextSelection.value = {
      from: selection.from,
      to: selection.to,
    };
    canRemoveChordAtSelection.value = isChordAppliedInSelection(selection.from, selection.to);
  }

  function handleChordItemSelect(chord: string): void {
    applyChordToSelection(chord);
    isContextMenuOpen.value = false;
  }

  function removeChordAtAnchor(anchor: HTMLElement): void {
    const instance = editor.value;
    if (!instance) {
      return;
    }

    const basePos = instance.view.posAtDOM(anchor, 0);
    const safePos = Math.min(basePos + 1, instance.state.doc.content.size);

    instance
      .chain()
      .focus()
      .setTextSelection({ from: safePos, to: safePos })
      .extendMarkRange('chord')
      .unsetMark('chord')
      .run();
    contextSelection.value = null;
    canRemoveChordAtSelection.value = false;
    isContextMenuOpen.value = false;
  }

  function handleEditorPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!target.closest('[data-chord-delete="true"]')) {
      return;
    }

    const anchor = target.closest('.clr-anchored');
    if (!(anchor instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    removeChordAtAnchor(anchor);
  }

  defineExpose({
    applyChordToSelection,
  });

  onBeforeUnmount(() => {
    editor.value?.destroy();
  });
</script>

<template>
  <Menu.Root v-model:open="isContextMenuOpen">
    <Menu.ContextTrigger
      class="chord-layout-editor-context-trigger"
      @contextmenu="captureSelectionForContextMenu"
    >
      <EditorContent
        v-if="editor"
        :editor="editor"
        class="chord-layout-editor"
        @pointerdown="handleEditorPointerDown"
      />
      <div
        v-else
        class="chord-layout-editor-fallback"
      >
        {{ props.text }}
      </div>
    </Menu.ContextTrigger>
    <Teleport to="body">
      <Menu.Positioner>
        <Menu.Content class="chord-context-menu">
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel class="chord-context-menu-label">Přidat akord</Menu.ItemGroupLabel>
            <Menu.Item
              v-for="chord in contextChordItems"
              :key="chord"
              class="chord-context-menu-item"
              :value="chord"
              @select="() => handleChordItemSelect(chord)"
            >
              {{ chord }}
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Teleport>
  </Menu.Root>
</template>

<style scoped>
  .chord-layout-editor {
    width: 100%;
  }

  .chord-layout-editor-context-trigger {
    display: block;
    width: 100%;
    cursor: text;
    background: inherit;
    border: none;
    text-align: inherit;
  }

  .chord-layout-editor-fallback {
    width: 100%;
    min-height: 14rem;
    padding: 0.75rem;
    border: none;
    background: inherit;
    color: var(--song-text-color, var(--text-chord));
    font-family: var(--song-text-font-family, monospace);
    font-size: var(--song-text-font-size, 1rem);
    line-height: 1.55;
  }

  .chord-layout-editor :deep(.tiptap) {
    width: 100%;
    min-height: 14rem;
    padding: 0.75rem;
    border: none;
    background: inherit;
    color: var(--song-text-color, var(--text-chord));
    font-family: var(--song-text-font-family, monospace);
    font-size: var(--song-text-font-size, 1rem);
    line-height: var(--song-anchored-line-height, 2.2);
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: anywhere;
    outline: none;
  }

  .chord-layout-editor :deep(.tiptap p) {
    margin: 0;
  }

  .chord-context-menu {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    max-height: min(320px, 50vh);
    overflow-y: auto;
    min-width: 140px;
    padding: 0.25rem;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-primary) 90%, var(--bg-secondary));
    box-shadow: var(--shadow-panel);
    z-index: 1202;
  }

  .chord-context-menu[hidden] {
    display: none;
  }

  .chord-context-menu[data-state='closed'] {
    display: none;
  }

  .chord-context-menu-label {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .chord-context-menu-item {
    display: block;
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .chord-context-menu-item[data-highlighted] {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--text-primary);
  }

  .chord-context-menu-item[data-disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .chord-context-menu-item--danger[data-highlighted] {
    background: color-mix(in srgb, #dc2626 22%, transparent);
  }

  .chord-context-menu-separator {
    height: 1px;
    margin: 0.25rem 0;
    background: color-mix(in srgb, var(--text-primary) 12%, transparent);
  }

  .chord-layout-editor :deep(.tiptap:focus-visible) {
    background: inherit;
    border: none;
  }

  .chord-layout-editor :deep(.clr-badge-delete) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--color-error);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    padding: 0;
    opacity: 1;
    pointer-events: none;
    cursor: pointer;
    position: absolute;
    top: -25px;
    right: -30px;
  }

  .chord-layout-editor :deep(.clr-anchored:hover .clr-badge-delete),
  .chord-layout-editor :deep(.clr-anchored:focus-within .clr-badge-delete) {
    pointer-events: auto;
  }

  .chord-layout-editor :deep(.clr-badge-delete:hover) {
    background: color-mix(in srgb, #dc2626 30%, transparent);
  }

  .chord-layout-editor :deep(.clr-anchored:hover .clr-badge) {
    background-color: color-mix(in srgb, #dc2626 24%, var(--song-chord-inline-bg, white));
  }
</style>

<style scoped src="./chord-layout-shared.css"></style>
