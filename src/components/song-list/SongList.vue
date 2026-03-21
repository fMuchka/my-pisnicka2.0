<script setup lang="ts">
  import { useSongListData } from '../../composables/useSongListData';

  const props = defineProps<{
    ownerId: string;
  }>();

  const { userSongs } = useSongListData(props.ownerId);
</script>

<template>
  <h1>Song List</h1>

  <span
    v-for="(song, songIndex) in userSongs"
    :key="songIndex"
  >
    {{ song.artist + ' - ' + song.title }}
  </span>
</template>
