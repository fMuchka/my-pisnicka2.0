import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoRoadmap } from '../InfoRoadmap';
import { RECENTLY_DONE_LIMIT } from '../constants';
import { getRecentNewChanges } from '../../../../../lib/timeline/timeline';
import { groupFeaturesByArea } from '../../../../../lib/upcoming-features/upcomingFeatures';

const renderInfoRoadmap = (onShowHistory = vi.fn()) =>
  render(<InfoRoadmap onShowHistory={onShowHistory} />);

describe('InfoRoadmap', () => {
  it('introduces the roadmap', () => {
    renderInfoRoadmap();

    expect(screen.getByRole('heading', { name: 'Na čem se pracuje' })).toBeInTheDocument();
    expect(screen.getByText('Chybí ti tu něco? Řekni to FM.')).toBeInTheDocument();
  });

  it('renders a section per feature area', () => {
    renderInfoRoadmap();

    for (const group of groupFeaturesByArea()) {
      expect(screen.getByRole('heading', { name: group.label })).toBeInTheDocument();
    }
  });

  it('lists the recently finished changes', () => {
    renderInfoRoadmap();

    for (const item of getRecentNewChanges(RECENTLY_DONE_LIMIT)) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    }
  });

  it('asks to show the history from the recently done block', async () => {
    const user = userEvent.setup();
    const onShowHistory = vi.fn();
    renderInfoRoadmap(onShowHistory);

    await user.click(screen.getByRole('button', { name: /celá historie/i }));

    expect(onShowHistory).toHaveBeenCalledOnce();
  });
});
