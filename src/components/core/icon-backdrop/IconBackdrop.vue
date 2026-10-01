<script setup lang="ts">
  import type { IconBackdropShape, IconBackdropSize } from './types';

  const props = withDefaults(
    defineProps<{
      shape?: IconBackdropShape;
      size?: IconBackdropSize;
    }>(),
    {
      shape: 'circle',
      size: 'md',
    }
  );
</script>

<template>
  <div :class="['icon-backdrop', `icon-backdrop--${props.shape}`, `icon-backdrop--${props.size}`]">
    <slot />
  </div>
</template>

<style scoped>
  .icon-backdrop {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-soft);
    color: var(--brand);
  }

  .icon-backdrop--circle {
    border-radius: var(--radius-full);
  }

  .icon-backdrop--rounded {
    border-radius: var(--radius-md);
  }

  .icon-backdrop--md {
    width: 32px;
    height: 32px;
  }

  .icon-backdrop--lg {
    width: 40px;
    height: 40px;
  }
</style>
