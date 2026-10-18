import { create } from 'zustand';

type ViewMode = 'flat' | 'tree';
type SourceMode = 'songs' | 'playlists';
type SongsMode = 'mine' | 'search';

type SongListState = {
  viewMode: ViewMode;
  sourceMode: SourceMode;
  songsMode: SongsMode;
  isTreeViewExpanded: boolean;
  searchQuery: string;
  selectedChordFilters: string[];
  selectedCategoryFilters: string[];
  expandedTreeViewValues: string[];
  setViewMode: (viewMode: ViewMode) => void;
  setSourceMode: (sourceMode: SourceMode) => void;
  setSongsMode: (songsMode: SongsMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setExpandedTreeViewValues: (values: string[]) => void;
  expandTreeView: () => void;
  collapseTreeView: () => void;
  toggleChordFilter: (chord: string, normalize: (value: string) => string) => void;
  clearChordFilters: () => void;
  toggleCategoryFilter: (categoryId: string) => void;
  clearCategoryFilters: () => void;
  setCategoryFilters: (categoryIds: string[]) => void;
  setChordFilters: (chords: string[]) => void;
};

export const useSongListStore = create<SongListState>()((set) => ({
  viewMode: 'tree',
  sourceMode: 'songs',
  songsMode: 'search',
  isTreeViewExpanded: false,
  searchQuery: '',
  selectedChordFilters: [],
  selectedCategoryFilters: [],
  expandedTreeViewValues: [],

  setViewMode: (viewMode) => set({ viewMode }),
  setSourceMode: (sourceMode) => set({ sourceMode }),
  setSongsMode: (songsMode) => set({ songsMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setExpandedTreeViewValues: (values) => set({ expandedTreeViewValues: [...values] }),

  expandTreeView: () => set({ isTreeViewExpanded: true }),
  collapseTreeView: () => set({ isTreeViewExpanded: false }),

  toggleChordFilter: (chord, normalize) =>
    set((state) => {
      const normalizedChord = normalize(chord);
      const isSelected = state.selectedChordFilters.some(
        (selectedChord) => normalize(selectedChord) === normalizedChord
      );

      return {
        selectedChordFilters: isSelected
          ? state.selectedChordFilters.filter(
              (selectedChord) => normalize(selectedChord) !== normalizedChord
            )
          : [...state.selectedChordFilters, chord],
      };
    }),

  clearChordFilters: () => set({ selectedChordFilters: [] }),

  toggleCategoryFilter: (categoryId) =>
    set((state) => ({
      selectedCategoryFilters: state.selectedCategoryFilters.includes(categoryId)
        ? state.selectedCategoryFilters.filter((selected) => selected !== categoryId)
        : [...state.selectedCategoryFilters, categoryId],
    })),

  clearCategoryFilters: () => set({ selectedCategoryFilters: [] }),
  setCategoryFilters: (categoryIds) => set({ selectedCategoryFilters: [...categoryIds] }),
  setChordFilters: (chords) => set({ selectedChordFilters: [...chords] }),
}));
