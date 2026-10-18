import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEditableChordPicker } from '../useEditableChordPicker';

describe('useEditableChordPicker', () => {
  it('deduplicates used chords and defaults to used tab', () => {
    const { result } = renderHook(() => useEditableChordPicker(['G', 'D', 'G', '']));

    expect(result.current.usedChordItems).toEqual(['G', 'D']);
    expect(result.current.chordPickerTab).toBe('used');
  });

  it('switches to all tab when used chord list becomes empty', () => {
    const { result, rerender } = renderHook(({ chords }) => useEditableChordPicker(chords), {
      initialProps: { chords: ['G'] },
    });

    act(() => result.current.setChordPickerTab('used'));
    rerender({ chords: [] });

    expect(result.current.chordPickerTab).toBe('all');
  });

  it('builds selected chord from root and quality', () => {
    const { result } = renderHook(() => useEditableChordPicker([]));

    act(() => {
      result.current.setSelectedAllRoot('D');
      result.current.setSelectedAllQuality('m7');
    });

    expect(result.current.allTabSelectedChord).toBe('Dm7');
  });
});
