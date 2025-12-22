<script setup lang="ts">
  const {
    label,
    variation = 'Primary',
    onClick = () => {},
  } = defineProps<{
    label: string;
    variation?: 'Primary' | 'Secondary';
    onClick?: () => void;
  }>();

  const getVariationClass = () => {
    switch (variation) {
      case 'Primary':
        return 'primary';

      case 'Secondary':
        return 'secondary';
    }
  };
</script>

<template>
  <button
    :class="`btn btn-${getVariationClass()}`"
    @click="onClick()"
  >
    {{ label }}
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
