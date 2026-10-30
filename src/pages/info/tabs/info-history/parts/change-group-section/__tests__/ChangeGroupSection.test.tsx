import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangeGroupSection } from '../ChangeGroupSection';
import type { ChangeGroup } from '../../../../../../../lib/timeline/timeline';

const newGroup: ChangeGroup = {
  type: 'new',
  label: 'Nové',
  changes: [
    { type: 'new', text: 'Playlisty', details: null },
    { type: 'new', text: 'Relace', details: null },
  ],
};

const untypedGroup: ChangeGroup = {
  type: null,
  label: null,
  changes: [{ type: null, text: 'Drobnosti', details: null }],
};

describe('ChangeGroupSection', () => {
  it('titles a typed group with its label and lists its changes', () => {
    render(<ChangeGroupSection group={newGroup} />);

    expect(screen.getByRole('heading', { name: 'Nové' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('highlights the new group title', () => {
    render(<ChangeGroupSection group={newGroup} />);

    expect(screen.getByRole('heading', { name: 'Nové' })).toHaveClass(
      'group-title',
      'group-title--new'
    );
  });

  it('does not highlight other group titles', () => {
    render(<ChangeGroupSection group={{ ...newGroup, type: 'fix', label: 'Opravy' }} />);

    expect(screen.getByRole('heading', { name: 'Opravy' })).not.toHaveClass('group-title--new');
  });

  it('renders untyped changes without a title', () => {
    render(<ChangeGroupSection group={untypedGroup} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Drobnosti')).toBeInTheDocument();
  });
});
