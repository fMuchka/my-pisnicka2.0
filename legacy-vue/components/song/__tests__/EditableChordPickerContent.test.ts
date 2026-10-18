import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import EditableChordPickerContent from '../editable-chord/EditableChordPickerContent.vue';

describe('EditableChordPickerContent', () => {
  it('emits pick when used chord button is clicked', async () => {
    const { emitted } = render(EditableChordPickerContent, {
      props: {
        usedChords: ['G', 'D'],
        chordPickerTab: 'used',
        selectedRoot: 'C',
        selectedQuality: '',
        quickRoots: ['C', 'D', 'E', 'F', 'G', 'A', 'H'],
        selectedChord: 'C',
      },
      global: {
        stubs: {
          ChordChart: true,
        },
      },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'G' }));

    expect(emitted().pick?.[0]).toEqual(['G']);
  });

  it('emits root and quality updates from all-tab controls', async () => {
    const { emitted } = render(EditableChordPickerContent, {
      props: {
        usedChords: [],
        chordPickerTab: 'all',
        selectedRoot: 'C',
        selectedQuality: '',
        quickRoots: ['C', 'D', 'E', 'F', 'G', 'A', 'H'],
        selectedChord: 'C',
      },
      global: {
        stubs: {
          ChordChart: true,
        },
      },
    });

    const [rootSelect, qualitySelect] = screen.getAllByRole('combobox');

    if (!rootSelect || !qualitySelect) {
      throw new Error('Expected root and quality selects to be present');
    }

    await fireEvent.change(rootSelect, { target: { value: 'D' } });
    await fireEvent.change(qualitySelect, { target: { value: 'm7' } });

    expect(emitted()['update:selectedRoot']?.[0]).toEqual(['D']);
    expect(emitted()['update:selectedQuality']?.[0]).toEqual(['m7']);
  });
});
