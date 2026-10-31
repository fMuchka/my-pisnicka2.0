import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Music } from 'lucide-react';
import SegmentGroup from '../SegmentGroup';
import type { SegmentOption } from '../types';

const options: SegmentOption[] = [
  { value: 'songs', label: 'Písně', icon: Music },
  { value: 'playlists', label: 'Playlisty' },
  { value: 'sessions', label: 'Relace', disabled: true },
];

describe('SegmentGroup', () => {
  it('renders a radio per option with the current value checked', () => {
    render(
      <SegmentGroup
        aria-label="Zobrazit"
        options={options}
        value="songs"
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Zobrazit' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Písně' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Playlisty' })).not.toBeChecked();
  });

  it('is named by its visible label when given one', () => {
    render(
      <SegmentGroup
        label="Motiv"
        options={options}
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Motiv' })).toBeInTheDocument();
    expect(screen.getByText('Motiv')).toHaveClass('segment-group-label');
  });

  it('reports the clicked option value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentGroup
        options={options}
        value="songs"
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByText('Playlisty'));

    expect(onValueChange).toHaveBeenLastCalledWith('playlists');
  });

  it('keeps its own selection when uncontrolled', async () => {
    const user = userEvent.setup();
    render(
      <SegmentGroup
        options={options}
        defaultValue="songs"
      />
    );

    await user.click(screen.getByText('Playlisty'));

    expect(screen.getByRole('radio', { name: 'Playlisty' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Písně' })).not.toBeChecked();
  });

  it('does not select a disabled option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentGroup
        options={options}
        value="songs"
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByRole('radio', { name: 'Relace' })).toBeDisabled();
    await user.click(screen.getByText('Relace'));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables every option when the group is disabled', () => {
    render(
      <SegmentGroup
        options={options}
        disabled
      />
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });

  it('gives every radio the group name', () => {
    render(
      <SegmentGroup
        options={options}
        name="view"
      />
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('name', 'view');
    }
  });

  it('applies the module styles and lays out one column per option', () => {
    const { container } = render(
      <SegmentGroup
        options={options}
        value="songs"
      />
    );

    const segments = container.querySelector('.segments');
    expect(segments).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
    expect(segments?.querySelector('.segment-indicator')).not.toBeNull();
    expect(container.querySelectorAll('.segment')).toHaveLength(3);
  });

  it('renders the option icon hidden from assistive technology', () => {
    render(<SegmentGroup options={options} />);

    const icon = screen.getByText('Písně').querySelector('svg');
    expect(icon).toHaveClass('segment-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Playlisty').querySelector('svg')).toBeNull();
  });
});
