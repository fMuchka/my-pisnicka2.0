import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentlyDone } from '../RecentlyDone';

const items = [
  { text: 'Playlisty', label: '1. října 2026' },
  { text: 'Relace', label: 'Září 2026' },
];

describe('RecentlyDone', () => {
  it('lists each item with its date', () => {
    render(
      <RecentlyDone
        items={items}
        onShowHistory={vi.fn()}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('1. října 2026')).toBeInTheDocument();
    expect(screen.getByText('Září 2026')).toBeInTheDocument();
  });

  it('asks to show the history when the link is clicked', async () => {
    const user = userEvent.setup();
    const onShowHistory = vi.fn();
    render(
      <RecentlyDone
        items={items}
        onShowHistory={onShowHistory}
      />
    );

    await user.click(screen.getByRole('button', { name: /celá historie/i }));

    expect(onShowHistory).toHaveBeenCalledOnce();
  });

  it('does not submit a surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <RecentlyDone
          items={items}
          onShowHistory={vi.fn()}
        />
      </form>
    );

    await user.click(screen.getByRole('button', { name: /celá historie/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
