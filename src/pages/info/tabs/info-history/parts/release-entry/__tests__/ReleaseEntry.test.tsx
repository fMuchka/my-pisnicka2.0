import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReleaseEntry } from '../ReleaseEntry';
import type { TimelineRelease } from '../../../../../../../lib/timeline/timeline';

const release: TimelineRelease = {
  kind: 'release',
  date: '2026-10-01',
  label: '1. října 2026',
  title: 'Podzimní vydání',
  changes: [
    { type: 'new', text: 'Playlisty', details: null },
    { type: 'fix', text: 'Oprava posunu', details: null },
  ],
};

const renderRelease = (props: Partial<Parameters<typeof ReleaseEntry>[0]> = {}) =>
  render(
    <ReleaseEntry
      release={release}
      isUnseen={false}
      defaultOpen={false}
      {...props}
    />
  );

describe('ReleaseEntry', () => {
  it('shows the date, title and change summary', () => {
    renderRelease();

    expect(screen.getByText('1. října 2026')).toBeInTheDocument();
    expect(screen.getByText('Podzimní vydání')).toBeInTheDocument();
    expect(screen.getByText('1 nová · 1 oprava')).toBeInTheDocument();
  });

  it('shows the Nové badge only when unseen', () => {
    const { rerender } = renderRelease();
    expect(screen.queryByText('Nové', { selector: '.badge-new' })).not.toBeInTheDocument();

    rerender(
      <ReleaseEntry
        release={release}
        isUnseen
        defaultOpen={false}
      />
    );
    expect(screen.getByText('Nové', { selector: '.badge-new' })).toBeInTheDocument();
  });

  it('starts open when asked to', () => {
    const { container } = renderRelease({ defaultOpen: true });

    expect(container.querySelector('details')).toHaveAttribute('open');
  });

  it('toggles when the summary is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderRelease();

    await user.click(screen.getByText('Podzimní vydání'));

    expect(container.querySelector('details')).toHaveAttribute('open');
  });

  it('renders a group per change type', () => {
    renderRelease();

    expect(screen.getByRole('heading', { name: 'Nové' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Opravy' })).toBeInTheDocument();
  });
});
