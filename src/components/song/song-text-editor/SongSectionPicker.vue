<script setup lang="ts">
  import {
    sectionLabel,
    sectionOptionStyle,
    sectionTypeOptions,
    type SectionType,
  } from '../../../lib/songTextEditor/sections';

  interface Emits {
    (event: 'select', type: SectionType): void;
    (event: 'cancel'): void;
  }

  defineEmits<Emits>();
</script>

<template>
  <div class="add-section-picker">
    <button
      v-for="type in sectionTypeOptions"
      :key="`section-add-option-${type}`"
      type="button"
      class="add-section-option"
      :style="sectionOptionStyle(type)"
      @click="$emit('select', type)"
    >
      {{ sectionLabel(type) }}
    </button>
    <button
      type="button"
      class="add-section-cancel"
      @click="$emit('cancel')"
    >
      Zrušit
    </button>
  </div>
</template>

<style scoped>
  .add-section-picker {
    position: absolute;
    top: calc(100% + 0.3rem);
    left: 0;
    z-index: 8;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-primary) 92%, var(--bg-secondary));
    box-shadow: var(--shadow-panel);
    max-width: min(100%, 420px);
    min-width: 320px;
  }

  .add-section-option,
  .add-section-cancel {
    border: 1px solid
      color-mix(in srgb, var(--section-option-accent, var(--accent)) 48%, transparent);
    border-radius: 6px;
    background: color-mix(
      in srgb,
      var(--section-option-accent, var(--accent)) 16%,
      var(--bg-primary)
    );
    color: var(--text-primary);
    padding: 0.26rem 0.54rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }

  .add-section-option:hover {
    background: color-mix(
      in srgb,
      var(--section-option-accent, var(--accent)) 26%,
      var(--bg-primary)
    );
  }

  .add-section-cancel {
    --section-option-accent: var(--accent);
    background: color-mix(in srgb, var(--bg-primary) 94%, var(--bg-secondary));
    border-color: color-mix(in srgb, var(--text-secondary) 28%, transparent);
    color: var(--text-secondary);
    font-weight: 500;
  }
</style>
