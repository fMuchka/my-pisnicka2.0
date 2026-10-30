import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfoHistory } from '../InfoHistory';
import {
  formatChangeCount,
  getLatestTimelineTime,
  getTimelineEntries,
} from '../../../../../lib/timeline/timeline';

const entries = getTimelineEntries();
const latest = entries[0]!;

describe('InfoHistory', () => {
  it('announces the latest release to a first-time visitor', () => {
    render(<InfoHistory lastVisited={null} />);

    const changeCount = latest.kind === 'release' ? latest.changes.length : 0;
    expect(
      screen.getByText(`${formatChangeCount(changeCount)} od tvé poslední návštěvy`)
    ).toBeInTheDocument();
    expect(screen.getAllByText('Nové', { selector: '.badge-new' })).toHaveLength(1);
  });

  it('hides the banner and badges when the latest release was already seen', () => {
    render(<InfoHistory lastVisited={getLatestTimelineTime()} />);

    expect(screen.queryByText(/od tvé poslední návštěvy/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Nové', { selector: '.badge-new' })).not.toBeInTheDocument();
  });

  it('renders one timeline item per entry', () => {
    const { container } = render(<InfoHistory lastVisited={null} />);

    expect(container.querySelectorAll('.timeline-item')).toHaveLength(entries.length);
  });

  it('highlights the latest dot and marks milestone dots', () => {
    const { container } = render(<InfoHistory lastVisited={null} />);
    const dots = container.querySelectorAll('.timeline-dot');

    expect(dots[0]).toHaveClass('timeline-dot--latest');
    entries.forEach((entry, index) => {
      if (entry.kind === 'milestone') {
        expect(dots[index]).toHaveClass('timeline-dot--milestone');
      } else {
        expect(dots[index]).not.toHaveClass('timeline-dot--milestone');
      }
    });
  });

  it('opens only the latest release', () => {
    const { container } = render(<InfoHistory lastVisited={null} />);
    const releases = container.querySelectorAll('details.release');

    expect(releases[0]).toHaveAttribute('open');
    for (const release of Array.from(releases).slice(1)) {
      expect(release).not.toHaveAttribute('open');
    }
  });
});
