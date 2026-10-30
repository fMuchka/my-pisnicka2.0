import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoGeneral } from '../InfoGeneral';
import { FAQS, FEATURES } from '../constants';
import { getTimelineEntries } from '../../../../../lib/timeline/timeline';

const renderInfoGeneral = (onShowHistory = vi.fn()) =>
  render(<InfoGeneral onShowHistory={onShowHistory} />);

describe('InfoGeneral', () => {
  it('lists every feature', () => {
    renderInfoGeneral();

    for (const feature of FEATURES) {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
      expect(screen.getByText(feature.text)).toBeInTheDocument();
    }
  });

  it('labels the history pill with the latest change', () => {
    renderInfoGeneral();

    expect(
      screen.getByRole('button', {
        name: `Poslední změna ${getTimelineEntries()[0]?.label}`,
      })
    ).toBeInTheDocument();
  });

  it('asks to show the history when the pill is clicked', async () => {
    const user = userEvent.setup();
    const onShowHistory = vi.fn();
    renderInfoGeneral(onShowHistory);

    await user.click(screen.getByRole('button', { name: /poslední změna/i }));

    expect(onShowHistory).toHaveBeenCalledOnce();
  });

  it('opens only the first FAQ by default', () => {
    renderInfoGeneral();

    const [first, ...rest] = FAQS.map((faq) =>
      screen.getByText(faq.question, { selector: 'summary' }).closest('details')
    );

    expect(first).toHaveAttribute('open');
    for (const faq of rest) {
      expect(faq).not.toHaveAttribute('open');
    }
  });

  it('toggles an FAQ answer when its question is clicked', async () => {
    const user = userEvent.setup();
    renderInfoGeneral();
    const question = screen.getByText(FAQS[1]!.question, { selector: 'summary' });

    await user.click(question);

    expect(question.closest('details')).toHaveAttribute('open');
  });

  it('opens the first version in a new tab', () => {
    renderInfoGeneral();

    const link = screen.getByRole('link', { name: /první verze mypísničky/i });
    expect(link).toHaveAttribute('href', 'https://fmuchka.github.io/my-pisnicka/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('applies the module classes', () => {
    renderInfoGeneral();

    expect(screen.getByRole('button', { name: /poslední změna/i })).toHaveClass(
      'meta-pill',
      'meta-pill--link'
    );
    expect(screen.getByRole('link', { name: /první verze/i })).toHaveClass('v1-link');
  });
});
