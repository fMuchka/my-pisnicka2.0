import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import SongChordOverview from '../SongChordOverview.vue';

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

    const pills = container.querySelectorAll('.song-chord-pill');
    expect(pills).toHaveLength(3);
  });
});
