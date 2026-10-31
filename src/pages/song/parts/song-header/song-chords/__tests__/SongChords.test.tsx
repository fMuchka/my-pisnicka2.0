import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SongChords } from '../SongChords';

vi.mock('../../../../../../components/chord-chart', () => ({
  ChordChart: ({ chord }: { chord: string }) => <figure>{`chart ${chord}`}</figure>,
}));

describe('SongChords', () => {
  it('renders nothing for a song without chords', () => {
    const { container } = render(<SongChords chords={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists the chords in a collapsed row', () => {
    render(<SongChords chords={['C', 'Am']} />);

    const trigger = screen.getByRole('button', { name: /akordy/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('C')).toHaveClass('chord-chip');
    expect(screen.getByText('Am')).toHaveClass('chord-chip');
    expect(screen.queryByText('chart C')).not.toBeInTheDocument();
  });

  it('expands into the chord charts and collapses back', async () => {
    const user = userEvent.setup();
    render(<SongChords chords={['C', 'Am']} />);

    const trigger = screen.getByRole('button', { name: /akordy/i });
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('chart C')).toBeVisible();
    expect(screen.getByText('chart Am')).toBeVisible();

    await user.click(trigger);
    // Closing waits for the collapse animation, which jsdom never runs.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });
});
