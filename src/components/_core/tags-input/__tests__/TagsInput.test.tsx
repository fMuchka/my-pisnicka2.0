import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

  describe('suggestions', () => {
    const suggestions = ['Folk', 'Táborák', 'Rock'];

    it('offers matching existing tags while typing', async () => {
      const user = userEvent.setup();
      render(
        <TagsInput
          label="Štítky"
          value={[]}
          onValueChange={vi.fn()}
          suggestions={suggestions}
        />
      );
      expect(screen.queryByRole('list', { name: 'Návrhy štítků' })).not.toBeInTheDocument();

      await user.type(screen.getByRole('textbox', { name: 'Štítky' }), 'tab');

      expect(screen.getByRole('list', { name: 'Návrhy štítků' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Přidat štítek Táborák' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Přidat štítek Rock' })).not.toBeInTheDocument();
    });

    it('adds a suggestion instead of the half-typed text and clears the input', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <TagsInput
          label="Štítky"
          value={['Folk']}
          onValueChange={onValueChange}
          suggestions={suggestions}
        />
      );
      const input = screen.getByRole('textbox', { name: 'Štítky' });

      await user.type(input, 'tab');
      await user.click(screen.getByRole('button', { name: 'Přidat štítek Táborák' }));

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenLastCalledWith(['Folk', 'Táborák']);
      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
    });

    it('completes the half-typed text even when the press is held, as on a real tap', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      function Host() {
        const [value, setValue] = useState<string[]>([]);
        return (
          <TagsInput
            label="Štítky"
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
            suggestions={suggestions}
          />
        );
      }
      render(<Host />);

      await user.type(screen.getByRole('textbox', { name: 'Štítky' }), 'tab');
      const chip = screen.getByRole('button', { name: 'Přidat štítek Táborák' });
      // Between press and release Ark handles the press as "outside the field"; it used to add
      // "tab" as a tag right there, which also emptied the suggestions before the click landed.
      await user.pointer({ keys: '[MouseLeft>]', target: chip });
      await new Promise((resolve) => setTimeout(resolve, 50));
      await user.pointer({ keys: '[/MouseLeft]', target: chip });

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenLastCalledWith(['Táborák']);
    });

    it('lets keyboard users tab to a suggestion without adding the half-typed text', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <TagsInput
          label="Štítky"
          value={[]}
          onValueChange={onValueChange}
          suggestions={suggestions}
        />
      );

      await user.type(screen.getByRole('textbox', { name: 'Štítky' }), 'tab');
      await user.tab();
      expect(screen.getByRole('button', { name: 'Přidat štítek Táborák' })).toHaveFocus();
      // Ark reacts to focus leaving the field on the next frame.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onValueChange).not.toHaveBeenCalled();

      await user.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith(['Táborák']);
    });

    it('does not offer tags already added', async () => {
      const user = userEvent.setup();
      render(
        <TagsInput
          label="Štítky"
          value={['folk']}
          onValueChange={vi.fn()}
          suggestions={suggestions}
        />
      );

      await user.type(screen.getByRole('textbox', { name: 'Štítky' }), 'o');

      expect(screen.queryByRole('button', { name: 'Přidat štítek Folk' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Přidat štítek Rock' })).toBeInTheDocument();
    });
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
