import { useMemo, useState } from 'react';
import { CHORD_QUALITIES, CHORD_ROOTS } from '../lib/chords/chords.database';

type ChordRoot = (typeof CHORD_ROOTS)[number];
type ChordQuality = (typeof CHORD_QUALITIES)[number];
type ChordPickerTab = 'used' | 'all' | 'sections';

export const QUICK_ALL_TAB_ROOTS: ChordRoot[] = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];

export function useEditableChordPicker(contextChords: string[]) {
  const usedChordItems = useMemo(
    () =>
      Array.from(
        new Set(contextChords.map((item) => item.trim()).filter((item) => item.length > 0))
      ),
    [contextChords]
  );

  const [isChordPickerOpen, setIsChordPickerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ChordPickerTab>(
    usedChordItems.length > 0 ? 'used' : 'all'
  );
  // An empty "used" tab is useless, so fall back to the full chord list.
  const chordPickerTab: ChordPickerTab =
    selectedTab === 'used' && usedChordItems.length === 0 ? 'all' : selectedTab;

  const [selectedAllRoot, setSelectedAllRoot] = useState<ChordRoot>('C');
  const [selectedAllQuality, setSelectedAllQuality] = useState<ChordQuality>('');
  const allTabSelectedChord = `${selectedAllRoot}${selectedAllQuality}`;

  return {
    allTabSelectedChord,
    chordPickerTab,
    setSelectedTab: setSelectedTab,
    isChordPickerOpen,
    setIsChordPickerOpen,
    QUICK_ALL_TAB_ROOTS,
    selectedAllQuality,
    setSelectedAllQuality,
    selectedAllRoot,
    setSelectedAllRoot,
    usedChordItems,
  };
}
