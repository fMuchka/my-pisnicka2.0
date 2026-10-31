import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SongSheet } from '../SongSheet';
import { cssVarName } from '../../../styles/tokens';

describe('SongSheet', () => {
  it('shows the empty text for a song without lyrics', () => {
    render(<SongSheet text="" />);

    expect(screen.getByText('Text písně zatím není k dispozici.')).toHaveClass('empty');
  });

  it('labels each section and gives it its accent', () => {
    render(<SongSheet text={'[verse]\nprvní\n[chorus]\nrefrén'} />);

    const verse = screen.getByRole('heading', { name: 'Sloka' });
    expect(verse).toHaveClass('section-label');
    expect(screen.getByRole('heading', { name: 'Refrén' })).toBeInTheDocument();

    const section = verse.closest('section');
    expect(section).toHaveClass('section', 'section-typed');
    expect(section?.getAttribute('style')).toContain(cssVarName('section-option-accent'));
  });

  it('renders untitled text without a section label or accent', () => {
    const { container } = render(<SongSheet text="jen text" />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('section')).not.toHaveClass('section-typed');
    expect(screen.getByText('jen text')).toHaveClass('line');
  });

  it('puts chords above their lyrics, only on lines that have chords', () => {
    const { container } = render(<SongSheet text={'[C]Za sklem\nbez akordů'} />);

    const chord = screen.getByText('C');
    expect(chord).toHaveClass('chord');
    expect(chord.nextElementSibling).toHaveTextContent('Za');
    expect(chord.closest('.line')).toHaveClass('line-chorded');

    expect(screen.getByText('bez akordů')).not.toHaveClass('line-chorded');
    expect(container.querySelectorAll('.chord')).toHaveLength(2);
  });

  it('shows transposed chords', () => {
    render(
      <SongSheet
        text="[C]a [Am]b"
        transpose={-2}
      />
    );

    expect(screen.getByText('B')).toHaveClass('chord');
    expect(screen.getByText('Gm')).toHaveClass('chord');
  });
});
