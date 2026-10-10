import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import Info from '../Info.vue';
import { getLatestTimelineTime } from '../../lib/timeline/timeline';

const TIMELINE_VISITED_STORAGE_KEY = 'my-pisnicka:timeline-latest-visited-time';

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: defineComponent({
    name: 'TopNavigation',
    setup() {
      return () => h('div', { 'data-testid': 'top-navigation' });
    },
  }),
}));

describe('Info Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the unseen banner and marks the latest release as visited', () => {
    render(Info);

    expect(screen.getByText(/od tvé poslední návštěvy/i)).toBeInTheDocument();
    expect(localStorage.getItem(TIMELINE_VISITED_STORAGE_KEY)).toBe(getLatestTimelineTime());
  });

  it('hides the unseen banner when the latest release was already visited', () => {
    localStorage.setItem(TIMELINE_VISITED_STORAGE_KEY, getLatestTimelineTime() ?? '');
    render(Info);

    expect(screen.queryByText(/od tvé poslední návštěvy/i)).not.toBeInTheDocument();
  });

  it('switches from Plány back to Historie via the history link', async () => {
    const user = userEvent.setup();
    render(Info);

    await user.click(screen.getByRole('tab', { name: /plány/i }));
    expect(await screen.findByText('Na čem se pracuje')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /celá historie/i }));
    expect(screen.getByRole('tab', { name: /historie/i })).toHaveAttribute('aria-selected', 'true');
  });
});
