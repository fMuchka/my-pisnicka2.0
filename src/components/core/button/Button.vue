<script setup lang="ts">
  import { computed } from 'vue';
  import type { ButtonRoleVariation, ButtonStyleVariation, ButtonIcon } from './types';

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(
    defineProps<{
      label?: string;
      colorVariation?: ButtonRoleVariation;
      styleVariation?: ButtonStyleVariation;
      icon?: ButtonIcon;
    }>(),
    {
      label: '',
      colorVariation: 'primary',
      styleVariation: 'filled',
      icon: undefined,
    }
  );

  const variationClass = computed(() => props.colorVariation ?? 'primary');
  const styledClass = computed(() => props.styleVariation ?? 'filled');

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
      v-bind="props.icon?.props"
    />
    <span v-if="props.label">{{ props.label }}</span>
    <component
      :is="props.icon?.component"
      v-if="hasIcon && !isPrependIcon"
      v-bind="props.icon?.props"
    />
  </button>
</template>

<style scoped>
  .btn {
    padding: 0 var(--space-lg);
    border: none;
    border-radius: var(--radius-md);
    font: var(--text-button);
    cursor: pointer;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    min-height: 48px;
  }

  .btn:disabled {
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .btn-primary {
    background: var(--brand-fill);
    color: var(--on-brand);
    border: 2px solid var(--brand-fill);
  }

  .btn-primary:hover {
    background: var(--brand-light);
    border-color: var(--brand-light);
    box-shadow: var(--shadow-accent);
  }

  .btn-primary:disabled {
    background: var(--surface-secondary);
    color: var(--text-disabled);
    border-color: var(--surface-secondary);
  }

  .btn-primary:disabled:hover {
    background: var(--surface-secondary);
    border-color: var(--surface-secondary);
    box-shadow: none;
  }

  .btn-secondary {
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--border);
  }

  .btn-secondary:disabled {
    background: transparent;
    color: var(--text-disabled);
    border-color: var(--border);
  }

  .btn-secondary:disabled:hover {
    background: transparent;
  }

  .btn-secondary:hover {
    background: var(--surface-secondary);
  }

  .btn-filled.btn-secondary {
    background: var(--surface-secondary);
    color: var(--ink);
    border: 1px solid var(--border);
  }

  .btn-filled.btn-secondary:disabled {
    background: var(--surface-secondary);
    color: var(--text-disabled);
    border-color: var(--border);
  }

  .btn-outlined {
    background: transparent;
    color: var(--brand);
    border: 2px solid var(--brand);
  }

  .btn-outlined:disabled {
    background: transparent;
    color: var(--text-disabled);
    border-color: var(--border);
  }

  .btn-outlined:disabled:hover {
    background: transparent;
  }

  .btn-outlined.btn-secondary {
    color: var(--ink);
    border: 1px solid var(--border);
  }

  .btn-outlined:hover {
    background: var(--surface-secondary);
  }

  .btn-text {
    background: transparent;
    color: var(--brand);
    border: 1px solid transparent;
    padding: 0 var(--space-xs);
  }

  .btn-text:disabled {
    background: transparent;
    color: var(--text-disabled);
  }

  .btn-text:disabled:hover {
    background: transparent;
  }

  .btn-text.btn-secondary {
    color: var(--ink);
  }

  .btn-text:hover {
    background: var(--surface-secondary);
  }
</style>
