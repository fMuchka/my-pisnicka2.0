<script setup lang="ts">
  import { usePageNavigation } from '../composables/usePageNavigation';
  import { Plus } from 'lucide-vue-next';
  import { useRouter } from 'vue-router';
  import Button from '../components/core/button/Button.vue';
  import SongList from '../components/song-list/SongList.vue';
  import Routes from '../router/Routes';

  const TITLE = 'Knihovna';

  usePageNavigation({ pageTitle: TITLE });
  const router = useRouter();

  const openCreateSongPage = () => {
    router.push({ path: Routes.SongCreate });
  };
</script>

<template>
  <div
    class="container"
    data-testid="song-library-view"
  >
    <div class="page-actions">
      <Button
        aria-label="Vytvořit novou píseň"
        :icon="{ position: 'prepend', component: Plus }"
        label="Vytvořit novou píseň"
        type="button"
        @click="openCreateSongPage"
      />
    </div>

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

  .page-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--space-md);
  }

  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl) calc(var(--space-2xl) + var(--space-lg));
    }
  }

  @media (max-width: 767px) {
    .page-actions :deep(button) {
      width: 100%;
    }
  }
</style>
