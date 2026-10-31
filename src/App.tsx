import { Outlet, useLocation } from 'react-router';
import { CookieNotice } from './components/cookie-notice';
import { Navigation } from './components/navigation/Navigation';
import Routes from './router/Routes';

const pagesWithoutNavigation: string[] = [Routes.Login, Routes.Join];

export default function App() {
  const { pathname } = useLocation();

  return (
    <>
      {!pagesWithoutNavigation.includes(pathname) && <Navigation />}
      <main>
        <Outlet />
      </main>
      <CookieNotice />
    </>
  );
}
