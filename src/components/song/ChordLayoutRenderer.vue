<script setup lang="tsx">
  import { computed, onBeforeUnmount, watch } from 'vue';
  import { EditorContent, useEditor } from '@tiptap/vue-3';
  import { Mark, mergeAttributes, type JSONContent } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { transposeChord } from '../../lib/chords/chords';

  interface Props {
    text: string;
    transpose?: number;
    editable?: boolean;
    editablePlaceholder?: string;
  }

  interface Emits {
    (event: 'update:text', value: string): void;
  }

  type LineKind = 'lyrics' | 'mixed';

  interface TokenMatch {
    value: string;
    start: number;
    type: 'chord' | 'lyrics';
  }

  interface RenderPart {
    text: string;
    chord?: string;
  }

  interface LineDetails {
    kind: LineKind;
    tokens: TokenMatch[];
  }

  type RenderLine = { line: string; details: LineDetails; parts: RenderPart[] };

  const props = withDefaults(defineProps<Props>(), {
    transpose: 0,
    editable: false,
    editablePlaceholder: 'Začněte psát text písně...',
  });

  const emit = defineEmits<Emits>();

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
      return ['span', mergeAttributes(HTMLAttributes, { class: 'clr-anchored' }), 0];
    },
  });

  const CHORD_TOKEN_REGEX =
    /^\[?[A-GH][#b]?(?:m(?:aj)?(?:7|9|11|13)?|dim7?|aug|sus[24]?|M7|(?:add)?(?:2|4|6|7|9|11|13))?(?:\/[A-GH][#b]?)?\]?$/;

  function getTokenMatches(line: string): TokenMatch[] {
    const matches = Array.from(line.matchAll(/(\[[^\]]+\]|[^\s[\]]+)(\s*)/g));

    return matches.flatMap((match) => {
      if (match.index === undefined) {
        return [];
      }

      const hasTrailingSpace = (match[2] ?? '').length > 0;
      const token = `${match[1] ?? ''}${hasTrailingSpace ? ' ' : ''}`;

      return [
        {
          value: token,
          start: match.index,
          type: isChordToken(token) ? 'chord' : 'lyrics',
        },
      ];
    });
  }

  function isChordToken(token: string): boolean {
    return CHORD_TOKEN_REGEX.test(token.trim());
  }

  function chordValue(token: string): string {
    return token.trim().replace(/^\[|\]$/g, '');
  }

  function standaloneChordPlaceholder(chord: string): string {
    return ' '.repeat(Math.max(chord.length, 1));
  }

  function classifyLine(line: string): LineDetails {
    const tokens = getTokenMatches(line);
    const chordCount = tokens.filter((token) => isChordToken(token.value)).length;

    if (chordCount === 0) {
      return { kind: 'lyrics', tokens };
    }
    if (tokens.length === 0) {
      return { kind: 'lyrics', tokens };
    }

    return { kind: 'mixed', tokens };
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

  const renderLines = computed<RenderLine[]>(() => {
    const lines = props.text.split('\n');
    const rendered: RenderLine[] = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index] ?? '';
      const lineDetails = classifyLine(line);

      if (lineDetails.kind === 'mixed') {
        rendered.push({
          details: lineDetails,
          line: line,
          parts: getRenderParts(line),
        });
        index += 1;
        continue;
      }

      if (lineDetails.kind === 'lyrics') {
        rendered.push({
          details: lineDetails,
          line,
          parts: getRenderParts(line),
        });
      }

      index += 1;
    }

    return rendered;
  });

  const renderedParts = computed(() => {
    const shift = props.transpose;

    return renderLines.value.map((line) => ({
      ...line,
      parts: line.parts.map((part) => {
        if (!part.chord) {
          return part;
        }

        const transposedChord = transposeChord(part.chord, shift);
        const isStandalonePlaceholder = /^\s+$/.test(part.text);

        if (!isStandalonePlaceholder) {
          return {
            ...part,
            chord: transposedChord,
          };
        }

        const width = Math.max(part.text.length, transposedChord.length);

        return {
          ...part,
          chord: transposedChord,
          text: ' '.repeat(width),
        };
      }),
    }));
  });

  function toTransposedParts(text: string, transpose: number): RenderPart[][] {
    return text.split('\n').map((line) =>
      getRenderParts(line).map((part) => {
        if (!part.chord) {
          return part;
        }

        const transposedChord = transposeChord(part.chord, transpose);
        const isStandalonePlaceholder = /^\s+$/.test(part.text);

        if (!isStandalonePlaceholder) {
          return {
            ...part,
            chord: transposedChord,
          };
        }

        return {
          ...part,
          chord: transposedChord,
          text: ' '.repeat(Math.max(part.text.length, transposedChord.length)),
        };
      })
    );
  }

  function toEditorDoc(text: string): JSONContent {
    const lines = toTransposedParts(text, 0);

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
              marks: [
                {
                  type: 'chord',
                  attrs: { chord: part.chord },
                },
              ],
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
    editable: props.editable,
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
    () => props.editable,
    (editable) => {
      editor.value?.setEditable(editable);
    }
  );

  watch(
    () => props.text,
    (text) => {
      const instance = editor.value;
      if (!instance || !props.editable) {
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

    const selection = instance.state.selection;

    if (selection.empty) {
      instance
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: ' ',
          marks: [{ type: 'chord', attrs: { chord } }],
        })
        .run();
      return;
    }

    instance.chain().focus().setMark('chord', { chord }).run();
  }

  defineExpose({
    applyChordToSelection,
  });

  onBeforeUnmount(() => {
    editor.value?.destroy();
  });
</script>

<template>
  <template v-if="props.editable">
    <EditorContent
      v-if="editor"
      :editor="editor"
      class="chord-layout-editor"
    />
    <div
      v-else
      class="chord-layout-editor-fallback"
    >
      {{ props.text }}
    </div>
  </template>

  <div
    v-else
    class="chord-layout-renderer"
  >
    <template
      v-for="(line, lineIndex) in renderedParts"
      :key="lineIndex"
    >
      <template
        v-for="(part, partIndex) in line.parts"
        :key="partIndex"
      >
        <span
          v-if="part.chord"
          class="clr-anchored"
          :data-before-content="part.chord"
        >
          {{ part.text }}
        </span>
        <span v-else>{{ part.text }}</span>
      </template>
      <br />
    </template>
  </div>
</template>

<style scoped>
  .chord-layout-renderer {
    font-family: var(--song-text-font-family, monospace);
    font-size: var(--song-text-font-size, 1rem);
    line-height: var(--song-anchored-line-height, 2.2);
    color: var(--song-text-color, var(--text-chord));
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: anywhere;
  }

  .chord-layout-editor-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .chord-layout-editor {
    width: 100%;
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

  .chord-layout-editor :deep(.tiptap:focus-visible) {
    background: inherit;
    border: none;
  }

  .chord-layout-editor-helper {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .clr-anchored {
    position: relative;
    display: inline-block;
    white-space: pre-wrap;
    vertical-align: baseline;
  }

  .clr-anchored::before {
    content: attr(data-before-content);
    position: absolute;
    left: 0;
    color: var(--song-chord-inline-color, var(--text-chord));
    font-family: var(--song-chord-inline-font-family, inherit);
    font-size: var(--song-chord-font-size, var(--song-chord-inline-font-size, 0.95em));
    font-weight: var(--song-chord-font-weight, var(--song-chord-inline-font-weight, 700));
    line-height: 1;
    min-width: var(--song-chord-min-width, auto);
    font-variant-ligatures: none;
    border-radius: var(--song-chord-inline-radius, 3px);
    white-space: nowrap;
    vertical-align: baseline;

    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background-color: var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
  }

  .chord-layout-editor :deep(.clr-anchored) {
    position: relative;
    display: inline-block;
    white-space: pre-wrap;
    vertical-align: baseline;
  }

  .chord-layout-editor :deep(.clr-anchored)::before {
    content: attr(data-before-content);
    position: absolute;
    left: 0;
    color: var(--song-chord-inline-color, var(--text-chord));
    font-family: var(--song-chord-inline-font-family, inherit);
    font-size: var(--song-chord-font-size, var(--song-chord-inline-font-size, 0.95em));
    font-weight: var(--song-chord-font-weight, var(--song-chord-inline-font-weight, 700));
    line-height: 1;
    min-width: var(--song-chord-min-width, auto);
    font-variant-ligatures: none;
    border-radius: var(--song-chord-inline-radius, 3px);
    white-space: nowrap;
    vertical-align: baseline;

    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background-color: var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
  }
</style>
