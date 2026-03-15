<script setup lang="ts">
  interface Props {
    chords: string[];
  }

  defineProps<Props>();
</script>

<template>
  <div class="song-meta">
    <span class="song-meta-label">Akordy</span>
    <div class="song-chord-list">
      <span
        v-for="chord in chords"
        :key="chord"
        class="song-chord-pill"
      >
        {{ chord }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .song-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .song-meta-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .song-chord-list {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: repeat(10, 1fr);
    grid-gap: 2rem;
  }

  .song-chord-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background-color: var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    color: var(--song-chord-inline-color, var(--text-chord));
    border-radius: var(--song-chord-inline-radius, 3px);
    font-family: var(--song-chord-inline-font-family, inherit);
    font-size: var(--song-chord-font-size, var(--song-chord-inline-font-size, 0.95em));
    font-weight: var(--song-chord-font-weight, var(--song-chord-inline-font-weight, 700));
  }
</style>
