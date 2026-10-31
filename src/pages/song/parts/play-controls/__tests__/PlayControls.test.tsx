import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayControls } from '../PlayControls';

const renderControls = (props: Partial<Parameters<typeof PlayControls>[0]> = {}) => {
  const handlers = {
    onToggleScrolling: vi.fn(),
    onSpeedUp: vi.fn(),
    onSlowDown: vi.fn(),
    onJump: vi.fn(),
    onExit: vi.fn(),
  };

  const result = render(
    <PlayControls
      isScrolling={false}
      secondsLeft={80}
      canSpeedUp
      canSlowDown
      {...handlers}
      {...props}
    />
  );

  return { ...handlers, ...result };
};

describe('PlayControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts or pauses the scrolling from the middle button', async () => {
    const user = userEvent.setup();
    const { onToggleScrolling, rerender } = renderControls();

    await user.click(screen.getByRole('button', { name: 'Spustit posouvání' }));
    expect(onToggleScrolling).toHaveBeenCalledOnce();

    rerender(
      <PlayControls
        isScrolling
        secondsLeft={80}
        canSpeedUp
        canSlowDown
        onToggleScrolling={onToggleScrolling}
        onSpeedUp={vi.fn()}
        onSlowDown={vi.fn()}
        onJump={vi.fn()}
        onExit={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Pozastavit posouvání' })).toBeInTheDocument();
  });

  it('jumps back and forward between the song parts', async () => {
    const user = userEvent.setup();
    const { onJump } = renderControls();

    await user.click(screen.getByRole('button', { name: 'Zpět na předchozí část' }));
    expect(onJump).toHaveBeenLastCalledWith('back');

    await user.click(screen.getByRole('button', { name: 'Vpřed na další část' }));
    expect(onJump).toHaveBeenLastCalledWith('forward');
  });

  it('changes the auto-scroll speed', async () => {
    const user = userEvent.setup();
    const { onSpeedUp, onSlowDown } = renderControls();

    await user.click(screen.getByRole('button', { name: 'Zrychlit posouvání' }));
    await user.click(screen.getByRole('button', { name: 'Zpomalit posouvání' }));

    expect(onSpeedUp).toHaveBeenCalledOnce();
    expect(onSlowDown).toHaveBeenCalledOnce();
  });

  it('disables the speed buttons at their limits', () => {
    renderControls({ canSpeedUp: false, canSlowDown: false });

    expect(screen.getByRole('button', { name: 'Zrychlit posouvání' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zpomalit posouvání' })).toBeDisabled();
  });

  it('shows the time left to the end', () => {
    renderControls({ secondsLeft: 80 });

    expect(screen.getByText('Do konce zbývá 1:20')).toHaveClass('time-left');
  });

  it('hides and shows the time left, and remembers the choice', async () => {
    const user = userEvent.setup();
    // Stays mounted to animate, so "hidden" means out of the accessibility tree and out of reach.
    const timeLeft = () => screen.getByText(/Do konce zbývá/).parentElement;
    const tab = () => timeLeft()?.parentElement;
    const { unmount } = renderControls();

    const hide = screen.getByRole('button', { name: 'Skrýt zbývající čas' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    expect(hide).toHaveAttribute('aria-controls', timeLeft()?.id);
    expect(timeLeft()).toHaveAttribute('aria-hidden', 'false');
    await user.click(hide);

    expect(timeLeft()).toHaveAttribute('aria-hidden', 'true');
    expect(timeLeft()).toHaveAttribute('inert');
    expect(tab()).toHaveClass('time-left-tab', 'time-left-tab--closed');
    unmount();

    renderControls();
    expect(timeLeft()).toHaveAttribute('aria-hidden', 'true');

    const show = screen.getByRole('button', { name: 'Zobrazit zbývající čas' });
    expect(show).toHaveAttribute('aria-expanded', 'false');
    await user.click(show);

    expect(timeLeft()).toHaveAttribute('aria-hidden', 'false');
    expect(timeLeft()).not.toHaveAttribute('inert');
    expect(tab()).not.toHaveClass('time-left-tab--closed');
  });

  it('leaves play mode from the exit button or with Escape', async () => {
    const user = userEvent.setup();
    const { onExit } = renderControls();

    expect(screen.getByRole('toolbar', { name: 'Přehrávání' })).toHaveClass('controls');

    await user.click(screen.getByRole('button', { name: 'Ukončit režim hraní' }));
    await user.keyboard('{Escape}');

    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it('stops listening for Escape once unmounted', async () => {
    const user = userEvent.setup();
    const { onExit, unmount } = renderControls();

    unmount();
    await user.keyboard('{Escape}');

    expect(onExit).not.toHaveBeenCalled();
  });
});
