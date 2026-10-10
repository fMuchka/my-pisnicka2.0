import { useBreakpoints } from '@vueuse/core';

const breakpoints = useBreakpoints({
  desktop: 768,
});

export function useDeviceViewType() {
  const isMobile = breakpoints.smaller('desktop');
  const isDesktop = breakpoints.greaterOrEqual('desktop');

  return { isDesktop, isMobile };
}
