import { useEffect } from 'react';
import { create } from 'zustand';

export type PageNavigation = {
  pageTitle?: string;
  fadeAway?: boolean;
};

/** What the app-level Navigation renders: `usePageNavigationState((s) => s.pageTitle)`. */
export const usePageNavigationState = create<PageNavigation>()(() => ({}));

/** Lets the current page set the title and behaviour of the app-level Navigation. */
export function usePageNavigation({ pageTitle, fadeAway }: PageNavigation) {
  useEffect(() => {
    usePageNavigationState.setState({ pageTitle, fadeAway }, true);

    // React runs the old page's cleanup before the new page's effect, so this never wipes the next page's state.
    return () => usePageNavigationState.setState({}, true);
  }, [pageTitle, fadeAway]);
}
