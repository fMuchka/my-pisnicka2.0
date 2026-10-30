import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureAreaSection } from '../FeatureAreaSection';
import type { UpcomingFeatureGroup } from '../../../../../../../lib/upcoming-features/upcomingFeatures';

const group: UpcomingFeatureGroup = {
  area: 'relace',
  label: 'Relace',
  features: [
    { title: 'Sdílený posun', area: 'relace', details: null, inProgress: false },
    { title: 'Chat v relaci', area: 'relace', details: null, inProgress: false },
  ],
};

describe('FeatureAreaSection', () => {
  it('titles the section with the area label', () => {
    render(<FeatureAreaSection group={group} />);

    expect(screen.getByRole('heading', { name: 'Relace' })).toBeInTheDocument();
  });

  it('lists every feature in the area', () => {
    render(<FeatureAreaSection group={group} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Sdílený posun')).toBeInTheDocument();
    expect(screen.getByText('Chat v relaci')).toBeInTheDocument();
  });

  it('renders features without an area under Ostatní', () => {
    render(
      <FeatureAreaSection
        group={{
          area: null,
          label: 'Ostatní',
          features: [{ title: 'Offline režim', area: null, details: null, inProgress: false }],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Ostatní' })).toBeInTheDocument();
    expect(screen.getByText('Offline režim')).toBeInTheDocument();
  });
});
