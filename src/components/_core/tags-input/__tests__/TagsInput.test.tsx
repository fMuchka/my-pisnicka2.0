import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsInput from '../TagsInput';

describe('TagsInput', () => {
  it('shows the label, the tags and the helper text', () => {
    render(
      <TagsInput
        label="Štítky"
        value={['folk', 'rock']}
        onValueChange={vi.fn()}
        helperText="Potvrď Enterem."
      />
    );

    expect(screen.getByRole('textbox', { name: 'Štítky' })).toBeInTheDocument();
    expect(screen.getByText('folk')).toBeInTheDocument();
    expect(screen.getByText('rock')).toBeInTheDocument();
    expect(screen.getByText('Potvrď Enterem.')).toBeInTheDocument();
  });

  it('shows the placeholder only while there are no tags', () => {
    const { rerender } = render(
      <TagsInput
        label="Štítky"
        value={[]}
        onValueChange={vi.fn()}
        placeholder="Např. folk"
      />
    );
    expect(screen.getByPlaceholderText('Např. folk')).toBeInTheDocument();

    rerender(
      <TagsInput
        label="Štítky"
        value={['folk']}
        onValueChange={vi.fn()}
        placeholder="Např. folk"
      />
    );
    expect(screen.queryByPlaceholderText('Např. folk')).not.toBeInTheDocument();
  });

  it('adds a tag on Enter and on a comma', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TagsInput
        label="Štítky"
        value={['folk']}
        onValueChange={onValueChange}
      />
    );

    await user.type(screen.getByRole('textbox', { name: 'Štítky' }), 'rock{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['folk', 'rock']);
  });

  it('removes a tag from its × button', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TagsInput
        label="Štítky"
        value={['folk', 'rock']}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Odebrat folk' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['rock']);
  });

  it('can be disabled', () => {
    render(
      <TagsInput
        label="Štítky"
        value={[]}
        onValueChange={vi.fn()}
        disabled
      />
    );

    expect(screen.getByRole('textbox', { name: 'Štítky' })).toBeDisabled();
  });
});
