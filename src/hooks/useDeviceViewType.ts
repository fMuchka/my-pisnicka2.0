import { useSyncExternalStore } from 'react';

const desktopQuery = '(min-width: 768px)';

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
};

const getIsDesktop = () => window.matchMedia(desktopQuery).matches;

export function useDeviceViewType() {
  const isDesktop = useSyncExternalStore(subscribe, getIsDesktop);

  return { isDesktop, isMobile: !isDesktop };
}
