<script setup lang="ts">
  import { computed } from 'vue';
  import { isSupportedChord, transposeChord } from '../../lib/chords/chords';
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

  interface RenderPart {
    text: string;
    chord?: string;
  }

  interface RenderLine {
    parts: RenderPart[];
  }

  const props = withDefaults(defineProps<Props>(), {
    transpose: 0,
    editable: false,
    editablePlaceholder: 'Začněte psát text písně...',
    contextChords: () => [],
  });

  const emit = defineEmits<Emits>();

  function isChordToken(token: string): boolean {
    return isSupportedChord(token);
  }

  function chordValue(token: string): string {
    return token.trim().replace(/^\[|\]$/g, '');
  }

  function standaloneChordPlaceholder(chord: string): string {
    return ' '.repeat(Math.max(chord.length, 1));
  }

  function normalizeLineForRender(line: string): string {
    // Tabs depend on tab stops, so convert to spaces to keep visual width deterministic.
    return line.replace(/\t/g, '    ');
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

        const anchoredMatch = line.slice(index).match(/^[^\s[]/);

        if (anchoredMatch) {
          const anchoredTokenMatch = line.slice(index).match(/^[^\s[]+/);

          if (!anchoredTokenMatch) {
            parts.push({ text: line[index] ?? '' });
            pendingChord = undefined;
            index += 1;
            continue;
          }

          // Keep chord and following lyric token together to prevent wrap drift.
          parts.push({
            chord: pendingChord,
            text: anchoredTokenMatch[0],
          });
          pendingChord = undefined;
          index += anchoredTokenMatch[0].length;
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
    return props.text.split('\n').map((line) => {
      const normalizedLine = normalizeLineForRender(line);

      return {
        parts: getRenderParts(normalizedLine),
      };
    });
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
          :class="{
            'clr-standalone-placeholder': /^\s+$/.test(part.text),
          }"
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
