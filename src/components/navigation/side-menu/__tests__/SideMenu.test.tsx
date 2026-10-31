import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeIcon, Info } from 'lucide-react';
import { MemoryRouter, useLocation } from 'react-router';
import { SideMenu } from '../SideMenu';
import type { AppBarPage } from '../../app-bar/types';

const pages: AppBarPage[] = [
  { icon: HomeIcon, label: 'Domů', link: '/', id: 'home' },
  { icon: Info, label: 'Info', link: '/info', id: 'info' },
];

function LocationDisplay() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

const renderSideMenu = () =>
  render(
    <MemoryRouter>
      <SideMenu
        pages={pages}
        currentPageId="home"
      />
      <LocationDisplay />
    </MemoryRouter>
  );

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));

describe('SideMenu', () => {
  it('opens on trigger click and marks the current page', async () => {
    renderSideMenu();

    expect(screen.queryByRole('link', { name: 'Domů' })).not.toBeInTheDocument();

    await openMenu();

    expect(await screen.findByRole('link', { name: 'Domů' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Info' })).not.toHaveAttribute('aria-current');
  });

  it('renders the drawer into the body, outside the trigger container', async () => {
    const { container } = renderSideMenu();

    await openMenu();

    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(container).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
  });

  it('applies the module styles to the drawer parts', async () => {
    renderSideMenu();

    await openMenu();

    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(dialog).toHaveClass('content');
    expect(screen.getByText('Menu')).toHaveClass('visually-hidden');
    expect(screen.getByRole('navigation')).toHaveClass('links');
    expect(screen.getByRole('link', { name: 'Domů' })).toHaveClass('link', 'link--active');
    expect(screen.getByRole('link', { name: 'Info' })).toHaveClass('link');
    expect(screen.getByRole('link', { name: 'Info' })).not.toHaveClass('link--active');
  });

  it('hides the link icons from assistive technology', async () => {
    renderSideMenu();

    await openMenu();

    const link = await screen.findByRole('link', { name: 'Info' });
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(link.querySelector('svg')).toHaveClass('link-icon');
  });

  it('navigates and closes when a link is clicked', async () => {
    renderSideMenu();

    await openMenu();
    await userEvent.click(await screen.findByRole('link', { name: 'Info' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/info');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Info' })).not.toBeInTheDocument()
    );
  });
});
