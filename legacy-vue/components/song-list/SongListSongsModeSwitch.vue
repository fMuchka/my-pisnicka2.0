<script setup lang="ts">
  interface Props {
    songsMode: 'mine' | 'search';
  }

  interface Emits {
    (event: 'set-songs-mode', value: 'mine' | 'search'): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();
</script>

<template>
  <div
    class="song-list__songs-mode-switch"
    role="group"
    aria-label="Zdroj písní"
  >
    <button
      type="button"
      class="song-list__songs-mode-button"
      :class="{ 'song-list__songs-mode-button--active': songsMode === 'mine' }"
      @click="emit('set-songs-mode', 'mine')"
    >
      Moje písně
    </button>
    <button
      type="button"
      class="song-list__songs-mode-button"
      :class="{ 'song-list__songs-mode-button--active': songsMode === 'search' }"
      @click="emit('set-songs-mode', 'search')"
    >
      Katalog
    </button>
  </div>
</template>

<style scoped>
  .song-list__songs-mode-switch {
    display: inline-flex;
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-tertiary);
    overflow: hidden;
  }

  .song-list__songs-mode-button {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 12px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__songs-mode-button--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }
</style>
