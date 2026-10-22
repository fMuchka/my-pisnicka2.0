import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import QrCode from '../QrCode';

const publicDir = resolve(__dirname, '../../../../../public');

function patternPath(container: HTMLElement) {
  return container.querySelector('svg path')?.getAttribute('d');
}

describe('QrCode', () => {
  it('overlays the MyPísnička icon by default', () => {
    render(<QrCode value="https://mypisnicka.cz/session/1234" />);

    expect(screen.getByRole('img', { name: 'MyPísnička' })).toHaveAttribute(
      'src',
      '/mypisnicka-icon.svg'
    );
  });

  // The default src is a plain string, so a renamed or moved icon only shows
  // up as a broken image in the browser. Fail here instead.
  it('points the default overlay at a file that exists in public/', () => {
    render(<QrCode value="https://mypisnicka.cz/session/1234" />);

    const src = screen.getByRole('img').getAttribute('src') ?? '';

    expect(existsSync(resolve(publicDir, `.${src}`))).toBe(true);
  });

  it('accepts a custom overlay', () => {
    render(
      <QrCode
        value="https://mypisnicka.cz/session/1234"
        overlaySrc="/custom.png"
        overlayAlt="Vlastní logo"
      />
    );

    expect(screen.getByRole('img', { name: 'Vlastní logo' })).toHaveAttribute('src', '/custom.png');
  });

  it('encodes the value into the pattern', () => {
    const { container: first } = render(<QrCode value="https://mypisnicka.cz/a" />);
    const { container: second } = render(<QrCode value="https://mypisnicka.cz/b" />);

    expect(patternPath(first)).toBeTruthy();
    expect(patternPath(first)).not.toBe(patternPath(second));
  });

  it('sizes the frame from the size prop', () => {
    const { container } = render(
      <QrCode
        value="https://mypisnicka.cz/session/1234"
        size={128}
      />
    );

    expect(container.querySelector('svg')).toHaveStyle({ width: '128px', height: '128px' });
  });
});
