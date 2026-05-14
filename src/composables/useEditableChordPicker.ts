import { computed, ref, watch, type Ref } from 'vue';
import { CHORD_QUALITIES, CHORD_ROOTS } from '../lib/chords/chords.database';

type ChordRoot = (typeof CHORD_ROOTS)[number];
type ChordQuality = (typeof CHORD_QUALITIES)[number];

export function useEditableChordPicker(contextChords: Ref<string[]>) {
  const usedChordItems = computed(() => {
    const items = contextChords.value.length > 0 ? contextChords.value : [];
    return Array.from(new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)));
  });

  const isChordPickerOpen = ref(false);
  const chordPickerTab = ref<'used' | 'all'>(usedChordItems.value.length > 0 ? 'used' : 'all');

  const selectedAllRoot = ref<ChordRoot>('C');
  const selectedAllQuality = ref<ChordQuality>('');
  const allTabSelectedChord = computed(() => `${selectedAllRoot.value}${selectedAllQuality.value}`);

  const QUICK_ALL_TAB_ROOTS: ChordRoot[] = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];

  watch(usedChordItems, (items) => {
    if (items.length === 0 && chordPickerTab.value === 'used') {
      chordPickerTab.value = 'all';
    }
  });

  return {
    allTabSelectedChord,
    chordPickerTab,
    isChordPickerOpen,
    QUICK_ALL_TAB_ROOTS,
    selectedAllQuality,
    selectedAllRoot,
    usedChordItems,
  };
}
