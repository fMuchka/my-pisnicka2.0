<script setup lang="ts">
  import { computed, toRef } from 'vue';
  import { Eye, FileType } from 'lucide-vue-next';
  import SongSectionBlock from './song-text-editor/SongSectionBlock.vue';
  import SongSectionPicker from './song-text-editor/SongSectionPicker.vue';
  import SongChordOverview from './SongChordOverview.vue';
  import Button from '../core/Button.vue';
  import { useSongTextEditorState } from '../../composables/useSongTextEditorState';
  import { parseMarkdownSections, type SectionType } from '../../lib/songTextEditor/sections';
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

  const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Začněte psát text písně...',
  });

  const emit = defineEmits<Emits>();

  const {
    addSectionAfterIndex,
    closeAddSectionPicker,
    handleMarkdownInput,
    insertSection,
    isVisualMode,
    openAddSectionPicker,
    rawMarkdown,
    removeSection,
    toggleMode,
    uniqueChords,
    updateSectionText,
    updateSectionType,
  } = useSongTextEditorState({
    modelValue: toRef(props, 'modelValue'),
    onModelValueChange: (value) => emit('update:modelValue', value),
    onUniqueChordsChange: (value) => emit('unique-chords', value),
  });

  // Button icons
  const modeToggleIcon = computed<ButtonIcon>(() => ({
    position: 'prepend',
    component: isVisualMode.value ? FileType : Eye,
  }));

  const previewSections = computed(() => parseMarkdownSections(rawMarkdown.value));
  const previewText = computed(() => rawMarkdown.value.trim());

  function handleAddSection(type: SectionType): void {
    insertSection(addSectionAfterIndex.value ?? -1, type, previewSections.value);
  }

  function handleSectionTextUpdate(sectionIndex: number, updatedSectionText: string): void {
    const section = previewSections.value[sectionIndex];
    if (!section) {
      return;
    }

    updateSectionText(section, updatedSectionText);
  }

  function handleSectionTypeChange(sectionIndex: number, nextType: SectionType): void {
    const section = previewSections.value[sectionIndex];
    if (!section) {
      return;
    }

    updateSectionType(section, nextType);
  }

  function handleRemoveSection(sectionIndex: number): void {
    const section = previewSections.value[sectionIndex];
    if (!section) {
      return;
    }

    removeSection(section);
  }
</script>

<template>
  <div class="song-text-editor">
    <div class="editor-toolbar">
      <Button
        class="mode-toggle-button"
        color-variation="Primary"
        style-variation="Text"
        :aria-label="isVisualMode ? 'Přepnout na text' : 'Přepnout na vizuální režim'"
        :label="isVisualMode ? 'Zdroj' : 'Náhled'"
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
        <p>Žádný text písně. Přidejte první sekci.</p>
        <div class="add-section-row add-section-row--empty">
          <button
            type="button"
            class="add-section-button"
            @click="openAddSectionPicker(-1)"
          >
            + Přidat sekci
          </button>
          <SongSectionPicker
            v-if="addSectionAfterIndex === -1"
            @select="handleAddSection"
            @cancel="closeAddSectionPicker"
          />
        </div>
      </div>

      <article
        v-else
        class="song-body"
      >
        <template v-if="previewSections.length > 0">
          <SongSectionBlock
            v-for="(section, index) in previewSections"
            :key="`${section.type}-${index}`"
            :section="section"
            :section-index="index"
            :context-chords="uniqueChords"
            :is-add-picker-open="addSectionAfterIndex === index"
            @open-add-picker="openAddSectionPicker(index)"
            @close-add-picker="closeAddSectionPicker"
            @add-section="handleAddSection"
            @remove-section="handleRemoveSection(index)"
            @update:section-text="(value) => handleSectionTextUpdate(index, value)"
            @update:section-type="(value) => handleSectionTypeChange(index, value)"
          />
        </template>
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
        @input="handleMarkdownInput"
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

  .add-section-row {
    position: relative;
    display: flex;
    justify-content: flex-start;
    margin-left: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .add-section-row--empty {
    margin-top: var(--space-sm);
    margin-left: 0;
    justify-content: center;
  }

  .add-section-button {
    border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent) 18%, var(--bg-primary));
    color: var(--text-primary);
    padding: 0.34rem 0.72rem;
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent) inset;
    cursor: pointer;
  }

  .add-section-button:hover {
    background: color-mix(in srgb, var(--accent) 26%, var(--bg-primary));
    border-color: color-mix(in srgb, var(--accent) 72%, transparent);
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
