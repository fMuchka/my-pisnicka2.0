<script setup lang="ts">
  import { ref } from 'vue';
  import { Plus } from 'lucide-vue-next';
  import Button from '../components/core/Button.vue';
  import CreateSongDialog from '../components/dialogs/create-song/CreateSongDialog.vue';
  import SongList from '../components/song-list/SongList.vue';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';

  const TITLE = 'Knihovna';
  const TAG_LINE = 'Ne všechny písně, co čekají, jsou zapomenuté';

  const isCreateSongDialogOpen = ref(false);

  const openCreateSongDialog = () => {
    isCreateSongDialogOpen.value = true;
  };
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
    <div class="page-actions">
      <Button
        aria-label="Vytvořit novou píseň"
        :icon="{ position: 'prepend', component: Plus }"
        label="Vytvořit novou píseň"
        type="button"
        @click="openCreateSongDialog"
      />
    </div>

    <SongList />

    <CreateSongDialog
      :open="isCreateSongDialogOpen"
      @update:open="isCreateSongDialogOpen = $event"
    />
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
