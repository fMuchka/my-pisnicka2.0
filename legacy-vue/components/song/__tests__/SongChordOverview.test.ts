import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import SongChordOverview from '../SongChordOverview.vue';

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

describe('SongChordOverview', () => {
  it('renders Akordy label and every chord pill', () => {
    render(SongChordOverview, {
      props: {
        chords: ['Am', 'C', 'G', 'D/F#'],
      },
    });

    expect(screen.getByText('Akordy')).toBeInTheDocument();
    expect(screen.getByText('Am')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('D/F#')).toBeInTheDocument();
  });

  it('keeps duplicated chords as duplicated pills', () => {
    const { container } = render(SongChordOverview, {
      props: {
        chords: ['Am', 'Am', 'C'],
      },
    });

    const pills = container.querySelectorAll('.chord-chart');
    expect(pills).toHaveLength(3);
  });
});
