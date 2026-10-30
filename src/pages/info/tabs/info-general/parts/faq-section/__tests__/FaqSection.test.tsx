import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqSection } from '../FaqSection';
import type { Faq } from '../../../types';

const faqs: Faq[] = [
  { question: 'Jak získám účet?', answer: 'Napiš FM.' },
  { question: 'Co se o mně ukládá?', answer: 'Skoro nic.' },
  { question: 'Kdo ručí za písně?', answer: 'Ten, kdo je přidá.' },
];

const detailsOf = (question: string) =>
  screen.getByText(question, { selector: 'summary' }).closest('details');

describe('FaqSection', () => {
  it('opens only the first question by default', () => {
    render(<FaqSection faqs={faqs} />);

    expect(detailsOf('Jak získám účet?')).toHaveAttribute('open');
    expect(detailsOf('Co se o mně ukládá?')).not.toHaveAttribute('open');
    expect(detailsOf('Kdo ručí za písně?')).not.toHaveAttribute('open');
  });

  it('opens a question when it is clicked', async () => {
    const user = userEvent.setup();
    render(<FaqSection faqs={faqs} />);

    await user.click(screen.getByText('Co se o mně ukládá?'));

    expect(detailsOf('Co se o mně ukládá?')).toHaveAttribute('open');
    expect(screen.getByText('Skoro nic.')).toBeVisible();
  });
});
