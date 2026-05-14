import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref, type Ref } from 'vue';
import { render } from '@testing-library/vue';
import { useEditableChordPicker } from '../useEditableChordPicker';

function mountComposable(contextChords: Ref<string[]>) {
  let state: ReturnType<typeof useEditableChordPicker> | null = null;

  const Harness = defineComponent({
    setup() {
      state = useEditableChordPicker(contextChords);
      return () => null;
    },
  });

  render(Harness);

  if (state == null) {
    throw new Error('Composable state was not initialized');
  }

  return state as ReturnType<typeof useEditableChordPicker>;
}

describe('useEditableChordPicker', () => {
  it('deduplicates used chords and defaults to used tab', () => {
    const contextChords = ref(['G', 'D', 'G', '']);
    const state = mountComposable(contextChords);

    expect(state.usedChordItems.value).toEqual(['G', 'D']);
    expect(state.chordPickerTab.value).toBe('used');
  });

  it('switches to all tab when used chord list becomes empty', async () => {
    const contextChords = ref(['G']);
    const state = mountComposable(contextChords);

    state.chordPickerTab.value = 'used';
    contextChords.value = [];
    await nextTick();

    expect(state.chordPickerTab.value).toBe('all');
  });

  it('builds selected chord from root and quality', () => {
    const contextChords = ref<string[]>([]);
    const state = mountComposable(contextChords);

    state.selectedAllRoot.value = 'D';
    state.selectedAllQuality.value = 'm7';

    expect(state.allTabSelectedChord.value).toBe('Dm7');
  });
});
