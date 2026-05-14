<script setup lang="ts">
  import ChordLayoutRenderer from '../ChordLayoutRenderer.vue';
  import SongSectionPicker from './SongSectionPicker.vue';
  import {
    sectionLabel,
    sectionTypeOptions,
    type ParsedSection,
    type SectionType,
  } from '../../../lib/songTextEditor/sections';
  import { SECTIONS_DICTIONARY } from '../../../lib/sections/sectionsDictionary';

  interface Props {
    section: ParsedSection;
    sectionIndex: number;
    contextChords: string[];
    isAddPickerOpen: boolean;
  }

  interface Emits {
    (event: 'update:sectionType', value: SectionType): void;
    (event: 'update:sectionText', value: string): void;
    (event: 'openAddPicker'): void;
    (event: 'addSection', value: SectionType): void;
    (event: 'removeSection'): void;
    (event: 'closeAddPicker'): void;
  }

  defineProps<Props>();
  defineEmits<Emits>();
</script>

<template>
  <div class="song-section-block">
    <section
      class="song-section"
      :class="`song-section--${section.type}`"
      :style="{ '--section-accent': SECTIONS_DICTIONARY[section.type].color }"
    >
      <div class="song-section-title-row">
        <select
          class="song-section-type-select"
          :value="section.type"
          aria-label="Typ sekce"
          @change="
            (event) =>
              $emit('update:sectionType', (event.target as HTMLSelectElement).value as SectionType)
          "
        >
          <option
            v-for="type in sectionTypeOptions"
            :key="`section-type-${sectionIndex}-${type}`"
            :value="type"
          >
            {{ sectionLabel(type) }}
          </option>
        </select>
      </div>

      <ChordLayoutRenderer
        class="song-text"
        :text="section.text"
        :editable="true"
        :context-chords="contextChords"
        @update:text="(value) => $emit('update:sectionText', value)"
      />
    </section>

    <div class="add-section-row">
      <button
        type="button"
        class="add-section-button"
        @click="$emit('openAddPicker')"
      >
        + Přidat sekci
      </button>

      <button
        type="button"
        class="remove-section-button"
        @click="$emit('removeSection')"
      >
        - Odebrat sekci
      </button>

      <SongSectionPicker
        v-if="isAddPickerOpen"
        @select="(type) => $emit('addSection', type)"
        @cancel="$emit('closeAddPicker')"
      />
    </div>
  </div>
</template>

<style scoped>
  .song-section-block:not(:last-child) {
    margin-bottom: var(--space-md);
  }

  .song-section {
    --section-accent: color-mix(in srgb, var(--accent) 35%, transparent);
    padding: 0;
    padding-left: var(--space-md);
    border-left: 1px solid color-mix(in srgb, var(--section-accent) 45%, transparent);
    border-left-width: 4px;
  }

  .song-section-title-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
    margin: 0 0 var(--space-sm);
  }

  .song-section-type-select {
    border: 1px solid color-mix(in srgb, var(--section-accent) 55%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--section-accent) 18%, var(--bg-primary));
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
  }

  .song-text {
    --song-text-color: var(--text-chord);
    margin: 0;
    font-family: var(--song-text-font-family);
    font-size: var(--song-text-font-size);
    line-height: var(--song-text-line-height);
  }

  .add-section-row {
    position: relative;
    display: flex;
    justify-content: flex-start;
    gap: var(--space-xs);
    margin-left: var(--space-md);
    margin-bottom: var(--space-xl);
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

  .remove-section-button {
    border: 1px solid color-mix(in srgb, var(--color-error) 45%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--color-error) 14%, var(--bg-primary));
    color: var(--text-primary);
    padding: 0.34rem 0.72rem;
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-error) 18%, transparent) inset;
    cursor: pointer;
  }

  .remove-section-button:hover {
    background: color-mix(in srgb, var(--color-error) 22%, var(--bg-primary));
    border-color: color-mix(in srgb, var(--color-error) 68%, transparent);
  }
</style>
