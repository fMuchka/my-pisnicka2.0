<script setup lang="ts">
  import type { Song } from '../../../lib/song';

  const props = defineProps<{
    songs: Song[];
    onSongClick: (song: Song) => void;
    isInteractive: boolean;
  }>();
</script>

<template>
  <ul class="song-list__flat song-list__list-reset">
    <li
      v-for="song in songs"
      :key="song.id"
      class="song-list__item"
      :class="{ 'song-list__item--readonly': !props.isInteractive }"
      :aria-disabled="!props.isInteractive"
      @click="props.onSongClick(song)"
    >
      {{ song.artist }} - {{ song.title }}
    </li>
  </ul>
</template>

<style scoped>
  @import '../SongListShared.css';

  .song-list__flat {
    display: grid;
    gap: var(--space-xs);
  }

  .song-list__item {
    cursor: pointer;
    font-size: 20px;
    color: var(--text-secondary);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-xs);
    padding-left: var(--space-md);

    &&:hover {
      background-color: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
      color: var(--text-primary);
    }
  }

  .song-list__item--readonly {
    cursor: default;
  }
</style>
