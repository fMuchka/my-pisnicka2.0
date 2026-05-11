<script setup lang="ts">
  import { computed } from 'vue';
  import { transposeChord } from '../../lib/chords/chords';
  import EditableChordLayoutRenderer from './EditableChordLayoutRenderer.vue';

  interface Props {
    text: string;
    transpose?: number;
    editable?: boolean;
    editablePlaceholder?: string;
    contextChords?: string[];
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
    contextChords: () => [],
  });

  const emit = defineEmits<Emits>();

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
</script>

<template>
  <EditableChordLayoutRenderer
    v-if="props.editable"
    :text="props.text"
    :editable-placeholder="props.editablePlaceholder"
    :context-chords="props.contextChords"
    @update:text="(value) => emit('update:text', value)"
  />

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

<style scoped src="./chord-layout-shared.css"></style>
