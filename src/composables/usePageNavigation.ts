import {
  computed,
  onBeforeUnmount,
  shallowRef,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from 'vue';

export type PageNavigation = {
  pageTitle?: string | undefined;
  fadeAway?: boolean | undefined;
};

const state = shallowRef<PageNavigation>({});

/** What the app-level Navigation renders; pages set it via usePageNavigation(). */
export const pageNavigation = computed(() => state.value);

export function usePageNavigation(options: MaybeRefOrGetter<PageNavigation>) {
  watchEffect(() => {
    state.value = toValue(options);
  });

  // Not onUnmounted: that runs after the next page has already set its own navigation.
  onBeforeUnmount(() => {
    state.value = {};
  });
}
