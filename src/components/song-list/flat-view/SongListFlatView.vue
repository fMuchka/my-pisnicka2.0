<script setup lang="ts">
  import type { Song } from '../../../lib/song';

  defineProps<{
    songs: Song[];
  }>();
</script>

<template>
  <ul class="song-list__flat song-list__list-reset">
    <li
      v-for="song in songs"
      :key="song.id"
      class="song-list__item"
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
</style>
