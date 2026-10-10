import type { LucideProps } from 'lucide-vue-next';
import type { EmitsOptions, FunctionalComponent } from 'vue';

export type LucideIcon = {
  component: FunctionalComponent<
    LucideProps,
    Record<string, unknown[]>,
    Record<string, unknown>,
    EmitsOptions
  >;
  props?: LucideProps;
};
