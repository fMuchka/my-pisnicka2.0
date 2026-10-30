import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppIntro } from '../AppIntro';

describe('AppIntro', () => {
  it('shows the app name and version', () => {
    render(
      <AppIntro
        lastChangeLabel={null}
        onShowHistory={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'MyPísnička 2.0' })).toBeInTheDocument();
  });

  it('labels the history pill with the last change', () => {
    render(
      <AppIntro
        lastChangeLabel="1. října 2026"
        onShowHistory={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Poslední změna 1. října 2026' })
    ).toBeInTheDocument();
  });

  it('hides the history pill without a last change', () => {
    render(
      <AppIntro
        lastChangeLabel={null}
        onShowHistory={vi.fn()}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Bez reklam · bez analytiky')).toBeInTheDocument();
  });

  it('asks to show the history when the pill is clicked', async () => {
    const user = userEvent.setup();
    const onShowHistory = vi.fn();
    render(
      <AppIntro
        lastChangeLabel="1. října 2026"
        onShowHistory={onShowHistory}
      />
    );

    await user.click(screen.getByRole('button', { name: /poslední změna/i }));

    expect(onShowHistory).toHaveBeenCalledOnce();
  });

  it('styles the history pill as a link pill', () => {
    render(
      <AppIntro
        lastChangeLabel="1. října 2026"
        onShowHistory={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /poslední změna/i })).toHaveClass(
      'meta-pill',
      'meta-pill--link'
    );
  });
});
