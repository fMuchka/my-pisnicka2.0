import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Music } from 'lucide-react';
import { FeatureItem } from '../FeatureItem';
import type { UpcomingFeature } from '../../../../../../../lib/upcoming-features/upcomingFeatures';

const feature: UpcomingFeature = {
  title: 'Transpozice',
  area: 'pisne',
  details: null,
  inProgress: false,
};

describe('FeatureItem', () => {
  it('renders a plain row when there are no details', () => {
    const { container } = render(
      <FeatureItem
        feature={feature}
        icon={Music}
      />
    );

    expect(container.querySelector('details')).not.toBeInTheDocument();
    expect(screen.getByText('Transpozice')).toBeInTheDocument();
  });

  it('expands to show details when clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FeatureItem
        feature={{ ...feature, details: 'Posun o půltóny.' }}
        icon={Music}
      />
    );
    const details = container.querySelector('details');

    expect(details).not.toHaveAttribute('open');

    await user.click(screen.getByText('Transpozice'));

    expect(details).toHaveAttribute('open');
    expect(screen.getByText('Posun o půltóny.')).toBeVisible();
  });

  it('marks features in progress', () => {
    const { rerender } = render(
      <FeatureItem
        feature={feature}
        icon={Music}
      />
    );
    expect(screen.queryByText('Rozpracováno')).not.toBeInTheDocument();

    rerender(
      <FeatureItem
        feature={{ ...feature, inProgress: true }}
        icon={Music}
      />
    );
    expect(screen.getByText('Rozpracováno')).toBeInTheDocument();
  });

  it('hides the area icon from assistive technology', () => {
    const { container } = render(
      <FeatureItem
        feature={feature}
        icon={Music}
      />
    );

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
