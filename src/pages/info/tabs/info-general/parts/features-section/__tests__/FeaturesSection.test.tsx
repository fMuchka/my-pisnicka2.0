import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Music, Users } from 'lucide-react';
import { FeaturesSection } from '../FeaturesSection';
import type { Feature } from '../../../types';

const features: Feature[] = [
  { icon: Music, title: 'Akordy', text: 'Akordy nad textem.' },
  { icon: Users, title: 'Relace', text: 'Společné hraní.' },
];

describe('FeaturesSection', () => {
  it('lists every feature with its title and text', () => {
    render(<FeaturesSection features={features} />);

    expect(screen.getByRole('heading', { name: 'Co aplikace umí' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Akordy')).toBeInTheDocument();
    expect(screen.getByText('Společné hraní.')).toBeInTheDocument();
  });

  it('hides the feature icons from assistive technology', () => {
    const { container } = render(<FeaturesSection features={features} />);

    for (const icon of container.querySelectorAll('svg')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
