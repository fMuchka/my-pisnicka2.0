<script setup lang="ts">
  interface Props {
    sourceMode: 'global' | 'playlists';
  }

  interface Emits {
    (event: 'set-source-mode', value: 'global' | 'playlists'): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();
</script>

<template>
  <div
    class="song-list__source-switch"
    role="group"
    aria-label="Zdroj písní"
  >
    <button
      type="button"
      class="song-list__source-button"
      :class="{ 'song-list__source-button--active': sourceMode === 'playlists' }"
      @click="emit('set-source-mode', 'playlists')"
    >
      Playlisty
    </button>
    <button
      type="button"
      class="song-list__source-button"
      :class="{ 'song-list__source-button--active': sourceMode === 'global' }"
      @click="emit('set-source-mode', 'global')"
    >
      Všechny písně
    </button>
  </div>
</template>

<style scoped>
  .song-list__source-switch {
    display: inline-flex;
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-tertiary);
    overflow: hidden;
  }

  .song-list__source-button {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 12px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__source-button--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }
</style>
