import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import SongControls from '../SongControls.vue';

describe('SongControls', () => {
  it('shows ETA and speed while paused', () => {
    render(SongControls, {
      props: {
        isPlaying: false,
        autoScrollSpeed: 28,
        autoScrollEtaLabel: '2:15',
      },
    });

    expect(screen.getByText('Do konce zbývá 2:15')).toBeInTheDocument();
    expect(screen.getByText('při 28 px/s')).toBeInTheDocument();
  });

  it('keeps ETA visible and hides speed detail while playing', () => {
    render(SongControls, {
      props: {
        isPlaying: true,
        autoScrollSpeed: 28,
        autoScrollEtaLabel: '1:04',
      },
    });

    expect(screen.getByText('Do konce zbývá 1:04')).toBeInTheDocument();
    expect(screen.queryByText('při 28 px/s')).not.toBeInTheDocument();
  });
});
