<script setup lang="ts">
  import SongList from '../components/song-list/SongList.vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';

  const TITLE = 'Knihovna';
  const TAG_LINE = 'Ne všechny písně, co čekají, jsou zapomenuté';
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
  />

  <div
    class="container"
    data-testid="song-library-view"
  >
    <SongList />
  </div>
</template>

<style scoped>
  .container {
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
    padding: var(--space-xl) var(--space-md) var(--space-2xl);
  }

  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl) calc(var(--space-2xl) + var(--space-lg));
    }
  }
</style>
