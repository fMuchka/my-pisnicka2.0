import { defineStore } from 'pinia';
import { ref } from 'vue';

type ViewMode = 'flat' | 'tree';

export const songListStore = defineStore('songList', () => {
  const viewMode = ref<ViewMode>('tree');
  const isTreeViewExpanded = ref<boolean>(false);
  const searchQuery = ref<string>('');

  const expandedTreeViewValues = ref<string[]>([]);

  function expandTreeView() {
    isTreeViewExpanded.value = true;
  }

  function collapseTreeView() {
    isTreeViewExpanded.value = false;
  }

  return {
    viewMode,
    isTreeViewExpanded,
    searchQuery,
    expandedTreeViewValues,
    expandTreeView,
    collapseTreeView,
  };
});
