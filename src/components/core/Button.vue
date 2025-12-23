<script setup lang="ts">
  import type { LucideProps } from 'lucide-vue-next';
  import { computed, type EmitsOptions, type FunctionalComponent } from 'vue';

  defineOptions({
    inheritAttrs: false,
  });

  export type ButtonIcon = {
    position: 'prepend' | 'append';
    component: FunctionalComponent<
      LucideProps,
      Record<string, unknown[]>,
      Record<string, unknown>,
      EmitsOptions
    >;
  };

  const props = withDefaults(
    defineProps<{
      label?: string;
      colorVariation?: 'Primary' | 'Secondary';
      styleVariation?: 'Filled' | 'Outlined' | 'Text';
      icon?: ButtonIcon;
    }>(),
    {
      label: '',
      colorVariation: 'Primary',
      styleVariation: 'Filled',
      icon: undefined,
    }
  );

  const variationClass = computed(() => {
    switch (props.colorVariation) {
      case 'Primary':
        return 'primary';

      case 'Secondary':
        return 'secondary';

      default:
        return 'primary';
    }
  });

  const styledClass = computed(() => {
    switch (props.styleVariation) {
      case 'Filled':
        return 'filled';

      case 'Outlined':
        return 'outlined';

      case 'Text':
        return 'text';

      default:
        return 'filled';
    }
  });

  const hasIcon = computed(() => props.icon && props.icon.component);
  const isPrependIcon = computed(() => props.icon?.position === 'prepend');
</script>

<template>
  <button
    v-bind="$attrs"
    :class="`btn btn-${variationClass} btn-${styledClass}`"
  >
    <component
      :is="props.icon?.component"
      v-if="hasIcon && isPrependIcon"
    />
    <span>{{ props.label }}</span>
    <component
      :is="props.icon?.component"
      v-if="hasIcon && !isPrependIcon"
    />
  </button>
</template>

<style scoped>
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
    border: 2px solid var(--accent);
  }

  .btn-primary:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  }

  .btn-primary:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--bg-tertiary);
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
  }

  .btn-filled.btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--bg-tertiary);
  }

  .btn-outlined {
    background: transparent;
    color: var(--accent);
    border: 2px solid var(--accent);
  }

  .btn-outlined.btn-secondary {
    color: var(--text-primary);
    border: 1px solid var(--bg-tertiary);
  }

  .btn-outlined:hover {
    background: var(--bg-secondary);
  }

  .btn-text {
    background: transparent;
    color: var(--accent);
    border: 1px solid transparent;
    padding: 8px 12px;
  }

  .btn-text.btn-secondary {
    color: var(--text-primary);
  }

  .btn-text:hover {
    background: var(--bg-secondary);
  }

  .btn-icon {
    width: 44px;
    height: 44px;
    padding: 0;
    font-size: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon:hover {
    background: var(--bg-tertiary);
  }
</style>
