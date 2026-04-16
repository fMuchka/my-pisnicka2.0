import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import '@testing-library/jest-dom';
import SongTextEditor from '../SongTextEditor.vue';

describe('SongTextEditor', () => {
  // issue #8
  it('does not derive Cm or Gm from Czech words after bracketed C and G', () => {
    const input = 'Ahoj, [C]město je velké a [G]máma vaří oběd.';

    const { container } = render(SongTextEditor, {
      props: {
        modelValue: input,
      },
    });

    const pills = Array.from(container.querySelectorAll('.song-chord-pill')).map(
      (node) => node.textContent?.trim() ?? ''
    );

    expect(pills).toContain('C');
    expect(pills).toContain('G');
    expect(pills).not.toContain('Cm');
    expect(pills).not.toContain('Gm');
  });
});
