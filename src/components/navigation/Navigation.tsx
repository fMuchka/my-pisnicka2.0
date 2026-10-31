import { useLayoutEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import Button from '../_core/button/Button';
import { AppBar } from './app-bar/AppBar';
import { SideMenu } from './side-menu/SideMenu';
import { TopNavigation } from './top-navigation/TopNavigation';
import { mainPage, menuPages, sessions, tabPages } from './constants';
import { useAuth } from '../../hooks/useAuth';
import { useDeviceViewType } from '../../hooks/useDeviceViewType';
import { usePageNavigationState } from '../../hooks/usePageNavigation';
import Routes from '../../router/Routes';
import {
  selectActiveSessionRoute,
  selectHasActiveSession,
  useSessionStore,
} from '../../stores/session';
import styles from './Navigation.module.css';

const getCurrentPageId = (path: string) => {
  if (path.startsWith('/song/')) return mainPage.id;
  if (path === Routes.Session) return sessions.id;

  return [...tabPages, mainPage].find((p) => p.link === path)?.id ?? '';
};

export function Navigation() {
  const pageTitle = usePageNavigationState((s) => s.pageTitle);
  const fadeAway = usePageNavigationState((s) => s.fadeAway) ?? false;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isGuest } = useAuth();
  const { isMobile } = useDeviceViewType();
  const hasActiveSession = useSessionStore(selectHasActiveSession);
  const activeSessionRoute = useSessionStore(selectActiveSessionRoute);

  // Tabs and menu links lead to host-only pages; guests (PIN / session link) would just bounce to Login.
  const showAppBar = isMobile && !isGuest;

  // Mirrors the router guard, so the button never leads to a Login bounce.
  const canOpenSettings = isAuthenticated || hasActiveSession;

  const currentPageId = getCurrentPageId(pathname);

  // Guests have no Home page; the logo takes them back to the session they joined instead.
  const goHome = () => {
    if (isAuthenticated && !isGuest) {
      void navigate(Routes.Home);
      return;
    }

    void navigate(activeSessionRoute ?? Routes.Login);
  };

  // The app bar is fixed, so reserve its height at the bottom of the page or it covers the content.
  const appBarDock = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dock = appBarDock.current;
    if (!showAppBar || dock == null) return;

    const reserveHeight = () => {
      document.body.style.paddingBottom = `${dock.offsetHeight}px`;
    };
    reserveHeight();

    const observer = new ResizeObserver(reserveHeight);
    observer.observe(dock);

    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [showAppBar]);

  const renderActions = () => {
    // Guests get neither the app bar nor menu links (both lead to host-only pages), so Settings is all they need.
    if (isGuest) {
      return (
        canOpenSettings && (
          <Button
            icon={Settings}
            styleVariation="text"
            aria-label="Nastavení"
            onClick={() => void navigate(Routes.Settings)}
          />
        )
      );
    }

    return (
      !isMobile && (
        <SideMenu
          pages={menuPages}
          currentPageId={currentPageId}
        />
      )
    );
  };

  return (
    <>
      <TopNavigation
        pageTitle={isMobile ? undefined : pageTitle}
        fadeAway={fadeAway}
        onHome={goHome}
        actions={renderActions()}
      />

      {showAppBar && (
        <div
          ref={appBarDock}
          className={styles.appBarDock}
        >
          <AppBar
            pages={tabPages}
            mainPage={mainPage}
            currentPageId={currentPageId}
          />
        </div>
      )}
    </>
  );
}
