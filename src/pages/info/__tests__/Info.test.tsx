import { StrictMode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Info from '../Info';
import { usePageNavigationState } from '../../../hooks/usePageNavigation';
import { getLatestTimelineTime } from '../../../lib/timeline/timeline';

const TIMELINE_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

const tab = (name: RegExp) => screen.getByRole('radio', { name });

describe('Info Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets the page title', () => {
    render(<Info />);

    expect(usePageNavigationState.getState().pageTitle).toBe('Informace');
  });

  it('opens on Historie', () => {
    render(<Info />);

    expect(tab(/historie/i)).toBeChecked();
    expect(tab(/plány/i)).not.toBeChecked();
  });

  it('shows the unseen banner and marks the latest release as visited', () => {
    render(<Info />);

    expect(screen.getByText(/od tvé poslední návštěvy/i)).toBeInTheDocument();
    expect(localStorage.getItem(TIMELINE_VISITED_STORAGE_KEY)).toBe(getLatestTimelineTime());
  });

  // StrictMode runs effects twice; the second run must not hide what the first visit is shown.
  it('keeps the unseen banner under StrictMode', () => {
    render(
      <StrictMode>
        <Info />
      </StrictMode>
    );

    expect(screen.getByText(/od tvé poslední návštěvy/i)).toBeInTheDocument();
  });

  it('hides the unseen banner when the latest release was already visited', () => {
    localStorage.setItem(TIMELINE_VISITED_STORAGE_KEY, getLatestTimelineTime() ?? '');
    render(<Info />);

    expect(screen.queryByText(/od tvé poslední návštěvy/i)).not.toBeInTheDocument();
  });

  it('switches sections and unmounts the one it leaves', async () => {
    const user = userEvent.setup();
    render(<Info />);

    await user.click(tab(/plány/i));

    expect(tab(/plány/i)).toBeChecked();
    expect(await screen.findByText('Na čem se pracuje')).toBeInTheDocument();
    expect(screen.queryByText(/od tvé poslední návštěvy/i)).not.toBeInTheDocument();
  });

  it('switches from Plány back to Historie via the history link', async () => {
    const user = userEvent.setup();
    render(<Info />);

    await user.click(tab(/plány/i));
    await user.click(await screen.findByRole('button', { name: /celá historie/i }));

    expect(tab(/historie/i)).toBeChecked();
  });

  it('switches from Obecné info back to Historie via the last change pill', async () => {
    const user = userEvent.setup();
    render(<Info />);

    await user.click(tab(/obecné info/i));
    await user.click(await screen.findByRole('button', { name: /poslední změna/i }));

    expect(tab(/historie/i)).toBeChecked();
  });
});
