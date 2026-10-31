import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeIcon, List, Music, User, Users } from 'lucide-react';
import { MemoryRouter, useLocation } from 'react-router';
import { AppBar } from '../AppBar';
import type { AppBarPage } from '../types';

const home: AppBarPage = { icon: HomeIcon, label: 'Domů', link: '/', id: 'home' };
const playlists: AppBarPage = {
  icon: List,
  label: 'Playlisty',
  link: '/playlists',
  id: 'playlist',
};
const sessions: AppBarPage = { icon: Users, label: 'Relace', link: '/sessionList', id: 'session' };
const account: AppBarPage = { icon: User, label: 'Účet', link: '/account', id: 'user' };
const mainPage: AppBarPage = { icon: Music, label: 'Písně', link: '/songs', id: 'music' };

type AppBarProps = Parameters<typeof AppBar>[0];

function LocationDisplay() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

const renderAppBar = (props: Partial<AppBarProps> = {}) => {
  const ui = (overrides: Partial<AppBarProps>) => (
    <MemoryRouter>
      <AppBar
        pages={[home, playlists, sessions, account]}
        mainPage={mainPage}
        currentPageId="home"
        {...overrides}
      />
      <LocationDisplay />
    </MemoryRouter>
  );
  const result = render(ui(props));

  return { ...result, rerender: (next: Partial<AppBarProps>) => result.rerender(ui(next)) };
};

const linkLabels = () => screen.getAllByRole('link').map((link) => link.textContent?.trim());

describe('AppBar', () => {
  it('renders the main page in the middle with the pages split around it', () => {
    renderAppBar();

    expect(linkLabels()).toEqual(['Domů', 'Playlisty', 'Písně', 'Relace', 'Účet']);
  });

  it('puts the extra page on the left when the page count is odd', () => {
    renderAppBar({ pages: [home, playlists, sessions] });

    expect(linkLabels()).toEqual(['Domů', 'Playlisty', 'Písně', 'Relace']);
  });

  it('links each tab to its page', () => {
    renderAppBar();

    expect(screen.getByRole('link', { name: 'Domů' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Písně' })).toHaveAttribute('href', '/songs');
    expect(screen.getByRole('link', { name: 'Účet' })).toHaveAttribute('href', '/account');
  });

  it('marks only the current page with aria-current and the active class', () => {
    renderAppBar({ currentPageId: 'session' });

    const current = screen.getByRole('link', { name: 'Relace' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('tab--active');

    const others = screen.getAllByRole('link').filter((link) => link !== current);
    others.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
      expect(link).not.toHaveClass('tab--active');
    });
  });

  it('marks the main page as current when on it', () => {
    renderAppBar({ currentPageId: 'music' });

    const main = screen.getByRole('link', { name: 'Písně' });
    expect(main).toHaveAttribute('aria-current', 'page');
    expect(main).toHaveClass('tab', 'tab--main', 'tab--active');
  });

  it('applies the module styles to the bar and tabs', () => {
    renderAppBar();

    expect(screen.getByRole('navigation')).toHaveClass('app-bar');
    screen.getAllByRole('link').forEach((link) => expect(link).toHaveClass('tab'));
    expect(screen.getByRole('link', { name: 'Domů' })).not.toHaveClass('tab--main');
  });

  it('renders the main page icon once, inside the highlight circle', () => {
    renderAppBar();

    const main = screen.getByRole('link', { name: 'Písně' });
    const icons = main.querySelectorAll('svg');
    expect(icons).toHaveLength(1);
    expect(icons[0]?.parentElement).toHaveClass('tab-main-circle');
  });

  it('renders the other tab icons directly, hidden from assistive technology', () => {
    renderAppBar();

    const tab = screen.getByRole('link', { name: 'Relace' });
    const icons = tab.querySelectorAll('svg');
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveClass('tab-icon');
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    expect(tab.querySelector('.tab-main-circle')).toBeNull();
  });

  it('updates the tabs when the pages prop changes', () => {
    const { rerender } = renderAppBar();

    rerender({ pages: [home, account] });

    expect(linkLabels()).toEqual(['Domů', 'Písně', 'Účet']);
  });

  it('navigates to the page when a tab is clicked', async () => {
    const user = userEvent.setup();
    renderAppBar();

    await user.click(screen.getByRole('link', { name: 'Relace' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/sessionList');
  });
});
