import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SongHeader } from '../SongHeader';

const song = { title: 'Kometa', artist: 'Jaromír Nohavica', capo: 2, originalKey: ' Am ' };

describe('SongHeader', () => {
  it('shows the title, artist, capo and key', () => {
    render(
      <SongHeader
        song={song}
        transpose={0}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Kometa' })).toHaveClass('title');
    expect(screen.getByText('Jaromír Nohavica')).toHaveClass('artist');
    expect(screen.getByText('Capo').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Tónina').nextElementSibling).toHaveTextContent('Am');
  });

  it('shows a dash for a missing capo or key', () => {
    render(
      <SongHeader
        song={{ title: 'Kometa', artist: 'Nohavica', originalKey: '  ' }}
        transpose={0}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );

    expect(screen.getByText('Capo').nextElementSibling).toHaveTextContent('—');
    expect(screen.getByText('Tónina').nextElementSibling).toHaveTextContent('—');
  });

  it('lists the transposed chords of the song', () => {
    render(
      <SongHeader
        song={{ ...song, text: '[C]Za [Am]sklem' }}
        transpose={2}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /akordy/i })).toHaveTextContent('AkordyDHm');
  });

  it('formats the transposition with its sign', () => {
    const { rerender } = render(
      <SongHeader
        song={song}
        transpose={3}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('+3');

    rerender(
      <SongHeader
        song={song}
        transpose={-1}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('-1');
  });

  it('steps the transposition by a semitone', async () => {
    const user = userEvent.setup();
    const onTransposeChange = vi.fn();
    render(
      <SongHeader
        song={song}
        transpose={1}
        onTransposeChange={onTransposeChange}
        onStartPlay={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Transponovat o půltón nahoru' }));
    expect(onTransposeChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Transponovat o půltón dolů' }));
    expect(onTransposeChange).toHaveBeenLastCalledWith(0);
  });

  it('starts playing from the play button', async () => {
    const user = userEvent.setup();
    const onStartPlay = vi.fn();
    render(
      <SongHeader
        song={song}
        transpose={0}
        onTransposeChange={vi.fn()}
        onStartPlay={onStartPlay}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Přehrát píseň' }));
    expect(onStartPlay).toHaveBeenCalledOnce();
  });

  it('shows the edit button only when editing is offered', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { rerender } = render(
      <SongHeader
        song={song}
        transpose={0}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Upravit píseň' })).not.toBeInTheDocument();

    rerender(
      <SongHeader
        song={song}
        transpose={0}
        onTransposeChange={vi.fn()}
        onStartPlay={vi.fn()}
        onEdit={onEdit}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
