import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneEntry } from '../MilestoneEntry';
import type { TimelineMilestone } from '../../../../../../../lib/timeline/timeline';

const milestone: TimelineMilestone = {
  kind: 'milestone',
  date: '2025-09',
  label: 'Září 2025',
  title: 'První verze',
  text: 'Statický zpěvník.',
  link: 'https://example.com/v1',
};

describe('MilestoneEntry', () => {
  it('shows the label, title and text', () => {
    render(<MilestoneEntry milestone={milestone} />);

    expect(screen.getByText('Září 2025 · Milník')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'První verze' })).toBeInTheDocument();
    expect(screen.getByText('Statický zpěvník.')).toBeInTheDocument();
  });

  it('links to the milestone in a new tab', () => {
    render(<MilestoneEntry milestone={milestone} />);

    const link = screen.getByRole('link', { name: /otevřít/i });
    expect(link).toHaveAttribute('href', 'https://example.com/v1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('hides the link when there is none', () => {
    render(<MilestoneEntry milestone={{ ...milestone, link: null }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
