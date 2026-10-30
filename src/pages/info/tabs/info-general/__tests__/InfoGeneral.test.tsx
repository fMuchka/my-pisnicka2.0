import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoGeneral } from '../InfoGeneral';
import { FAQS, FEATURES } from '../constants';
import { getTimelineEntries } from '../../../../../lib/timeline/timeline';

const renderInfoGeneral = (onShowHistory = vi.fn()) =>
  render(<InfoGeneral onShowHistory={onShowHistory} />);

describe('InfoGeneral', () => {
  it('labels the history pill with the latest timeline entry', () => {
    renderInfoGeneral();

    expect(
      screen.getByRole('button', {
        name: `Poslední změna ${getTimelineEntries()[0]?.label}`,
      })
    ).toBeInTheDocument();
  });

  it('passes the history request up from the app intro', async () => {
    const user = userEvent.setup();
    const onShowHistory = vi.fn();
    renderInfoGeneral(onShowHistory);

    await user.click(screen.getByRole('button', { name: /poslední změna/i }));

    expect(onShowHistory).toHaveBeenCalledOnce();
  });

  it('renders the app features and FAQs', () => {
    renderInfoGeneral();

    for (const feature of FEATURES) {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
    }
    for (const faq of FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it('states the main goal', () => {
    renderInfoGeneral();

    expect(screen.getByRole('heading', { name: 'Hlavní cíl' })).toBeInTheDocument();
    expect(screen.getByText(/podpořit společné hraní/i)).toBeInTheDocument();
  });

  it('links to the first version', () => {
    renderInfoGeneral();

    expect(screen.getByRole('link', { name: /první verze mypísničky/i })).toBeInTheDocument();
  });
});
