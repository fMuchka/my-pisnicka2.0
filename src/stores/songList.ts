import { defineStore } from 'pinia';
import { ref } from 'vue';

type ViewMode = 'flat' | 'tree';

export const songListStore = defineStore('songList', () => {
  const viewMode = ref<ViewMode>('tree');
  const isTreeViewExpanded = ref<boolean>(false);
  const searchQuery = ref<string>('');
  const selectedChordFilters = ref<string[]>([]);

  const expandedTreeViewValues = ref<string[]>([]);

  function expandTreeView() {
    isTreeViewExpanded.value = true;
  }

  function collapseTreeView() {
    isTreeViewExpanded.value = false;
  }

  function toggleChordFilter(chord: string, normalize: (value: string) => string) {
    const normalizedChord = normalize(chord);
    const selectedIndex = selectedChordFilters.value.findIndex(
      (selectedChord) => normalize(selectedChord) === normalizedChord
    );

    if (selectedIndex >= 0) {
      selectedChordFilters.value.splice(selectedIndex, 1);
      return;
    }

    selectedChordFilters.value.push(chord);
  }

  function clearChordFilters() {
    selectedChordFilters.value = [];
  }

  function setChordFilters(chords: string[]) {
    selectedChordFilters.value = [...chords];
  }

  return {
    viewMode,
    isTreeViewExpanded,
    searchQuery,
    selectedChordFilters,
    expandedTreeViewValues,
    expandTreeView,
    collapseTreeView,
    toggleChordFilter,
    clearChordFilters,
    setChordFilters,
  };
});
