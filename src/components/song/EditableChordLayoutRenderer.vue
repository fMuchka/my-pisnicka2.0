<script setup lang="tsx">
  import { onBeforeUnmount, ref, toRef, watch } from 'vue';
  import { EditorContent, useEditor } from '@tiptap/vue-3';
  import { Mark, mergeAttributes } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { fromEditorDoc, toEditorDoc } from '../../lib/songTextEditor/editableChordDocument';
  import { useEditableChordPicker } from '../../composables/useEditableChordPicker';
  import { Popover } from '@ark-ui/vue/popover';
  import EditableChordPickerContent from './editable-chord/EditableChordPickerContent.vue';

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

  const props = withDefaults(defineProps<Props>(), {
    editablePlaceholder: 'Začněte psát text písně...',
    contextChords: () => [],
  });

  const emit = defineEmits<Emits>();

  const contextSelection = ref<SelectionRange | null>(null);
  const isPointerSelecting = ref(false);
  const {
    allTabSelectedChord,
    chordPickerTab,
    isChordPickerOpen,
    QUICK_ALL_TAB_ROOTS,
    selectedAllQuality,
    selectedAllRoot,
    usedChordItems,
  } = useEditableChordPicker(toRef(props, 'contextChords'));

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
    onSelectionUpdate: ({ editor: instance }) => {
      const selection = instance.state.selection;
      contextSelection.value = {
        from: selection.from,
        to: selection.to,
      };

      // During drag-select, wait for pointer release so the picker does not steal focus mid-drag.
      if (isPointerSelecting.value) {
        return;
      }

      if (!selection.empty) {
        isChordPickerOpen.value = true;
        return;
      }

      isChordPickerOpen.value = false;
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
  }

  function openChordPicker(event: MouseEvent): void {
    const instance = editor.value;
    if (!instance) {
      return;
    }

    event.preventDefault();

    const selection = instance.state.selection;
    contextSelection.value = {
      from: selection.from,
      to: selection.to,
    };
    isChordPickerOpen.value = true;
  }

  function closeChordPicker(): void {
    isChordPickerOpen.value = false;
  }

  function handlePickerTabChange(value: 'used' | 'all'): void {
    chordPickerTab.value = value;
  }

  function handlePickerRootChange(value: (typeof QUICK_ALL_TAB_ROOTS)[number]): void {
    selectedAllRoot.value = value;
  }

  function handlePickerQualityChange(value: string): void {
    selectedAllQuality.value = value as typeof selectedAllQuality.value;
  }

  function clearEditorSelection(): void {
    const instance = editor.value;
    if (!instance) {
      contextSelection.value = null;
      return;
    }

    const selection = instance.state.selection;
    const collapsedAt = selection.to;

    instance.chain().focus().setTextSelection({ from: collapsedAt, to: collapsedAt }).run();
    contextSelection.value = null;
  }

  function handleChordPick(chord: string): void {
    applyChordToSelection(chord);
    closeChordPicker();
  }

  function syncPickerWithCurrentSelection(): void {
    const instance = editor.value;
    if (!instance) {
      return;
    }

    const selection = instance.state.selection;
    contextSelection.value = {
      from: selection.from,
      to: selection.to,
    };

    if (!selection.empty) {
      isChordPickerOpen.value = true;
      return;
    }

    isChordPickerOpen.value = false;
  }

  function finishPointerSelection(): void {
    if (!isPointerSelecting.value) {
      return;
    }

    isPointerSelecting.value = false;

    // Defer opening after pointerup so Popover does not treat the same interaction as outside-close.
    requestAnimationFrame(() => {
      syncPickerWithCurrentSelection();
    });
  }

  watch(isChordPickerOpen, (isOpen) => {
    if (isOpen) {
      return;
    }

    clearEditorSelection();
  });

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
    closeChordPicker();
  }

  function handleEditorPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (event.button === 0) {
      isPointerSelecting.value = true;
      window.addEventListener('pointerup', finishPointerSelection, { once: true });
      window.addEventListener('pointercancel', finishPointerSelection, { once: true });
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
    window.removeEventListener('pointerup', finishPointerSelection);
    window.removeEventListener('pointercancel', finishPointerSelection);
    editor.value?.destroy();
  });
</script>

<template>
  <Popover.Root v-model:open="isChordPickerOpen">
    <Popover.Anchor
      class="chord-layout-editor-context-trigger"
      @contextmenu="openChordPicker"
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
    </Popover.Anchor>
    <Popover.Trigger class="chord-picker-trigger">Open chord picker</Popover.Trigger>
    <Teleport to="body">
      <Popover.Positioner class="chord-picker-positioner">
        <Popover.Content class="chord-picker-popover">
          <EditableChordPickerContent
            :used-chords="usedChordItems"
            :chord-picker-tab="chordPickerTab"
            :selected-root="selectedAllRoot"
            :selected-quality="selectedAllQuality"
            :quick-roots="QUICK_ALL_TAB_ROOTS"
            :selected-chord="allTabSelectedChord"
            @update:chord-picker-tab="handlePickerTabChange"
            @update:selected-root="handlePickerRootChange"
            @update:selected-quality="handlePickerQualityChange"
            @pick="handleChordPick"
            @close="closeChordPicker"
          />
        </Popover.Content>
      </Popover.Positioner>
    </Teleport>
  </Popover.Root>
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
    overflow-wrap: normal;
    overflow-x: hidden;
    overflow-y: visible;
    outline: none;
  }

  .chord-layout-editor :deep(.tiptap p) {
    margin: 0;
  }

  .chord-picker-trigger {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
    padding: 0;
  }

  .chord-picker-positioner {
    z-index: 2000;
  }

  .chord-picker-popover {
    z-index: 2001;
  }

  .chord-picker-popover[hidden] {
    display: none;
  }

  .chord-picker-popover[data-state='closed'] {
    display: none;
  }

  .chord-layout-editor :deep(.tiptap:focus-visible) {
    background: inherit;
    border: none;
  }

  .chord-layout-editor :deep(.clr-badge-delete) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
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
