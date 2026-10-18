import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import ChordLayoutRenderer from '../ChordLayoutRenderer.vue';

describe('ChordLayoutRenderer', () => {
  it('renders plain lyrics without anchored chord elements', () => {
    const { container } = render(ChordLayoutRenderer, {
      props: {
        text: 'Mama take this badge off of me',
      },
    });

    expect(screen.getByText('Mama take this badge off of me')).toBeInTheDocument();
    expect(container.querySelectorAll('.clr-anchored')).toHaveLength(0);
  });

  it('renders inline bracket chords as anchored tokens', () => {
    const { container } = render(ChordLayoutRenderer, {
      props: {
        text: '[G] Mama take this [D] badge off of [Am] me',
      },
    });

    const anchored = Array.from(container.querySelectorAll('.clr-anchored'));
    const dataBeforeContent = anchored.map((node) => node.getAttribute('data-before-content'));

    expect(dataBeforeContent).toEqual(['G', 'D', 'Am']);
  });

  it('keeps complex chords like D/F# and Hm7', () => {
    const { container } = render(ChordLayoutRenderer, {
      props: {
        text: '[D/F#] line [Hm7] end',
      },
    });

    const anchored = Array.from(container.querySelectorAll('.clr-anchored'));
    const dataBeforeContent = anchored.map((node) => node.getAttribute('data-before-content'));

    expect(dataBeforeContent).toEqual(['D/F#', 'Hm7']);
  });

  it('renders blank input as empty visual output', () => {
    const { container } = render(ChordLayoutRenderer, {
      props: {
        text: '',
      },
    });

    expect(container.querySelector('.chord-layout-renderer')?.textContent).toBe('');
  });

  it('does not anchor unsupported chords outside chords.database', () => {
    const { container } = render(ChordLayoutRenderer, {
      props: {
        text: '[Random] line [Hm9] end',
      },
    });

    const anchored = Array.from(container.querySelectorAll('.clr-anchored'));
    const dataBeforeContent = anchored.map((node) => node.getAttribute('data-before-content'));

    expect(dataBeforeContent).toEqual([]);
  });
});
