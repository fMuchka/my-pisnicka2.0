import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes as RouterRoutes } from 'react-router';
import App from '../App';
import Routes from '../router/Routes';

vi.mock('../components/navigation/Navigation', () => ({
  Navigation: () => <div data-testid="navigation" />,
}));

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <RouterRoutes>
        <Route element={<App />}>
          <Route
            path="*"
            element={<p>Stránka</p>}
          />
        </Route>
      </RouterRoutes>
    </MemoryRouter>
  );

describe('App', () => {
  it.each([Routes.Home, Routes.Info, Routes.Session])('shows the navigation on %s', (path) => {
    renderApp(path);

    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Stránka');
  });

  it.each([Routes.Login, Routes.Join])('hides the navigation on %s', (path) => {
    renderApp(path);

    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Stránka');
  });
});
