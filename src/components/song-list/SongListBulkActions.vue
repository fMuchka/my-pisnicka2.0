<script setup lang="ts">
  interface Props {
    label: string;
    selectedCount: number;
    primaryActionLabel: string;
    primaryActionDisabled: boolean;
    isBusy: boolean;
  }

  interface Emits {
    (event: 'primary-action'): void;
    (event: 'clear-selection'): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();
</script>

<template>
  <section class="song-list-bulk-actions">
    <p class="song-list-bulk-actions__label">{{ label }}</p>
    <p class="song-list-bulk-actions__summary">Vybráno: {{ selectedCount }}</p>

    <div class="song-list-bulk-actions__buttons">
      <button
        type="button"
        class="song-list-bulk-actions__button song-list-bulk-actions__button--secondary"
        :disabled="selectedCount === 0 || isBusy"
        @click="emit('clear-selection')"
      >
        Zrušit výběr
      </button>
      <button
        type="button"
        class="song-list-bulk-actions__button song-list-bulk-actions__button--primary"
        :disabled="primaryActionDisabled"
        @click="emit('primary-action')"
      >
        {{ primaryActionLabel }}
      </button>
    </div>
  </section>
</template>

<style scoped>
  .song-list-bulk-actions {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border-width: 1px;
    border-style: solid;
    border-color: var(--bg-tertiary);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
  }

  .song-list-bulk-actions__label,
  .song-list-bulk-actions__summary {
    margin: 0;
  }

  .song-list-bulk-actions__label {
    font-weight: 600;
    color: var(--text-primary);
  }

  .song-list-bulk-actions__summary {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .song-list-bulk-actions__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .song-list-bulk-actions__button {
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 10px;
    font: inherit;
    cursor: pointer;
    border-width: 1px;
    border-style: solid;
    border-color: var(--bg-tertiary);
  }

  .song-list-bulk-actions__button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .song-list-bulk-actions__button--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .song-list-bulk-actions__button--primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
</style>
