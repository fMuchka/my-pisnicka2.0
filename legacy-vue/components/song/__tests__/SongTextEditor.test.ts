import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/vue';
import '@testing-library/jest-dom';
import SongTextEditor from '../SongTextEditor.vue';

vi.mock('svguitar', () => {
  const draw = vi.fn();
  const chord = vi.fn().mockReturnValue({ draw });
  const configure = vi.fn();
  const SVGuitarChord = vi.fn(function SVGuitarChordMock() {
    return {
      configure,
      chord,
    };
  });

  return {
    SVGuitarChord,
    ChordStyle: { handdrawn: 'handdrawn' },
  };
});

describe('SongTextEditor', () => {
  // issue #8
  it('does not derive Cm or Gm from Czech words after bracketed C and G', () => {
    const input = 'Ahoj, [C]město je velké a [G]máma vaří oběd.';

    const { emitted } = render(SongTextEditor, {
      props: {
        modelValue: input,
      },
    });

    const uniqueChordsEvents = emitted()['unique-chords'] ?? [];
    const lastEvent = uniqueChordsEvents.at(-1);

    if (!lastEvent) {
      throw new Error('Expected unique-chords event to be emitted at least once');
    }

    if (!Array.isArray(lastEvent)) {
      throw new Error('Expected unique-chords event payload container to be an array');
    }

    const payload = lastEvent[0];
    const uniqueChords = Array.isArray(payload)
      ? payload.filter((item): item is string => typeof item === 'string')
      : [];

    expect(uniqueChords).toContain('C');
    expect(uniqueChords).toContain('G');
    expect(uniqueChords).not.toContain('Cm');
    expect(uniqueChords).not.toContain('Gm');
  });
});
