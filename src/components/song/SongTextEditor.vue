<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { Eye, Code } from 'lucide-vue-next';
  import ChordLayoutRenderer from './ChordLayoutRenderer.vue';
  import SongChordOverview from './SongChordOverview.vue';
  import Button from '../core/Button.vue';
  import type { LucideProps } from 'lucide-vue-next';
  import type { EmitsOptions, FunctionalComponent } from 'vue';

  type ButtonIcon = {
    position: 'prepend' | 'append';
    component: FunctionalComponent<
      LucideProps,
      Record<string, unknown[]>,
      Record<string, unknown>,
      EmitsOptions
    >;
    props?: LucideProps;
  };

  interface Props {
    modelValue: string;
    placeholder?: string;
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'unique-chords', value: string[]): void;
  }

  const CHORD_CORE_PATTERN =
    '[A-GH][#b]?(?:m(?:aj)?(?:7|9|11|13)?|dim7?|aug|sus[24]?|M7|(?:add)?(?:2|4|6|7|9|11|13))?(?:/[A-GH][#b]?)?';
  const STORED_CHORD_PATTERN = new RegExp(`\\[(${CHORD_CORE_PATTERN})\\]`, 'g');
  const BRACKETED_VISUAL_PATTERN = /\[([^\]\s][^\]]*)\]/g;
  // In visual mode, detect plain chords but avoid words and already-bracketed tokens.
  const VISUAL_CHORD_PATTERN = new RegExp(
    `(?<![a-zA-Z\\[])((${CHORD_CORE_PATTERN}))(?![a-z\\]])`,
    'g'
  );

  const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Začněte psát text písně...',
  });

  const emit = defineEmits<Emits>();

  // Toggle between visual and markdown mode
  const isVisualMode = ref(true);

  // Button icons
  const modeToggleIcon = computed<ButtonIcon>(() => ({
    position: 'prepend',
    component: isVisualMode.value ? Code : Eye,
  }));

  const sectionLabels = {
    intro: 'Intro',
    verse: 'Verse',
    bridge: 'Bridge',
    chorus: 'Chorus',
    outro: 'Outro',
  } as const;

  type SectionType = keyof typeof sectionLabels;

  interface Section {
    type: SectionType;
    text: string;
  }

  // Parse markdown to sections
  function parseMarkdown(markdown: string): Section[] {
    if (!markdown.trim()) return [];

    const lines = markdown.split('\n');
    const parsed: Section[] = [];
    let currentType: SectionType | null = null;
    let currentLines: string[] = [];

    const pushSection = () => {
      if (!currentType) {
        return;
      }

      const text = currentLines.join('\n').trim();

      if (!text) {
        return;
      }

      parsed.push({
        type: currentType,
        text,
      });
    };

    for (const line of lines) {
      const match = line.match(/^\[([A-Za-z]+)\s*(\d+)?\]$/);

      if (match) {
        pushSection();

        const type = match[1]?.toLowerCase() as SectionType;
        currentType = type in sectionLabels ? type : 'verse';
        currentLines = [];
        continue;
      }

      if (currentType) {
        currentLines.push(line);
      }
    }

    pushSection();

    return parsed;
  }

  const rawMarkdown = ref(props.modelValue);

  watch(
    () => props.modelValue,
    (newValue) => {
      rawMarkdown.value = newValue;
      emit('unique-chords', extractUniqueChords(newValue));
    },
    { immediate: true }
  );

  const previewSections = computed(() => parseMarkdown(rawMarkdown.value));
  const previewText = computed(() => rawMarkdown.value.trim());
  const uniqueChords = computed(() => extractUniqueChords(rawMarkdown.value));

  function toggleMode() {
    if (!isVisualMode.value) {
      emit('update:modelValue', rawMarkdown.value);
      emit('unique-chords', extractUniqueChords(rawMarkdown.value));
    }

    isVisualMode.value = !isVisualMode.value;
  }

  function toVisualChordText(text: string): string {
    return text.replace(STORED_CHORD_PATTERN, '$1').replace(BRACKETED_VISUAL_PATTERN, '$1');
  }

  function extractUniqueChords(text: string): string[] {
    const normalized = toVisualChordText(text);
    const matches = normalized.matchAll(VISUAL_CHORD_PATTERN);
    const uniqueChords = new Set<string>();

    for (const match of matches) {
      const chord = match[1] ?? match[0];
      if (chord) {
        uniqueChords.add(chord);
      }
    }

    return Array.from(uniqueChords);
  }
</script>

<template>
  <div class="song-text-editor">
    <div class="editor-toolbar">
      <SongChordOverview
        v-if="uniqueChords.length > 0"
        class="editor-chords"
        :chords="uniqueChords"
      />

      <Button
        class="mode-toggle-button"
        color-variation="Primary"
        style-variation="Text"
        :aria-label="isVisualMode ? 'Přepnout na text' : 'Přepnout na vizuální režim'"
        :label="isVisualMode ? 'Upravit' : 'Náhled'"
        :icon="modeToggleIcon"
        @click="toggleMode"
      />
    </div>

    <div
      v-if="isVisualMode"
      class="visual-editor"
    >
      <div
        v-if="!previewText"
        class="empty-state"
      >
        <p>Žádný text písně. Přepněte do textového režimu a upravte markdown.</p>
      </div>

      <article
        v-else
        class="song-body"
      >
        <template v-if="previewSections.length > 0">
          <section
            v-for="(section, index) in previewSections"
            :key="`${section.type}-${index}`"
            class="song-section"
            :class="`song-section--${section.type}`"
          >
            <h2 class="song-section-title">{{ sectionLabels[section.type] }}</h2>
            <ChordLayoutRenderer
              class="song-text"
              :text="section.text"
            />
          </section>
        </template>

        <ChordLayoutRenderer
          v-else
          class="song-text"
          :text="previewText"
        />
      </article>
    </div>

    <div
      v-else
      class="markdown-editor"
    >
      <textarea
        v-model="rawMarkdown"
        class="markdown-textarea"
        :placeholder="placeholder"
        rows="12"
        @input="
          () => {
            emit('update:modelValue', rawMarkdown);
            emit('unique-chords', extractUniqueChords(rawMarkdown));
          }
        "
      />
    </div>
  </div>
</template>

<style scoped>
  .song-text-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .editor-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-sm);
    padding: var(--space-xs);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
  }

  .editor-chords {
    flex: 1 1 240px;
    min-width: 0;
  }

  .mode-toggle-button {
    margin-left: auto;
    flex-shrink: 0;
    align-self: center;
  }

  .visual-editor {
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    padding: var(--space-lg);
    text-align: center;
    color: var(--text-secondary);
    border: 2px dashed var(--border-primary);
    border-radius: var(--radius-sm);
  }

  .song-body {
    --song-anchored-line-height: 4;
    --song-chord-font-size: var(--font-size-chords);
    --song-text-line-height: 4.25;
    --song-text-font-family: var(--font-chord);
    --song-text-font-size: var(--font-size-lyrics);
    --song-chord-inline-font-size: inherit;
    --song-chord-inline-font-family: var(--font-chord);
    --song-chord-inline-font-weight: inherit;
    --song-chord-inline-radius: 3px;
    padding: var(--space-lg) var(--space-md);
    border-radius: var(--radius-lg);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--section-verse-bg) 76%, var(--bg-primary)),
      color-mix(in srgb, var(--bg-primary) 92%, var(--bg-secondary))
    );
    box-shadow: var(--shadow-panel);
    overflow-x: auto;
  }

  .song-section {
    --section-accent: color-mix(in srgb, var(--accent) 35%, transparent);
    padding: 0;
    padding-left: var(--space-md);
    border-radius: var(--radius-md);
    border-left: 1px solid color-mix(in srgb, var(--section-accent) 45%, transparent);
    border-left-width: 4px;
  }

  .song-section:not(:last-child) {
    margin-bottom: var(--space-md);
  }

  .song-section--intro {
    --section-accent: color-mix(in srgb, #f59e0b 55%, var(--accent));
  }

  .song-section--verse {
    --section-accent: color-mix(in srgb, #16a34a 42%, var(--accent));
  }

  .song-section--bridge {
    --section-accent: color-mix(in srgb, var(--section-bridge-border) 70%, var(--accent));
  }

  .song-section--chorus {
    --section-accent: color-mix(in srgb, #0284c7 45%, var(--accent));
  }

  .song-section--outro {
    --section-accent: color-mix(in srgb, #dc2626 35%, var(--accent));
  }

  .song-section-title {
    margin: 0 0 var(--space-sm);
    font-size: 13px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .song-text {
    --song-text-color: var(--text-chord);
    margin: 0;
    font-family: var(--song-text-font-family);
    font-size: var(--song-text-font-size);
    line-height: var(--song-text-line-height);
  }

  .markdown-textarea {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 1rem;
    resize: vertical;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 300px;
  }

  .markdown-textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  @media (min-width: 768px) {
    .song-body {
      padding: var(--space-xl);
    }
  }

  @media (max-width: 640px) {
    .editor-toolbar {
      align-items: stretch;
    }

    .mode-toggle-button {
      width: 100%;
      margin-left: 0;
    }
  }
</style>
