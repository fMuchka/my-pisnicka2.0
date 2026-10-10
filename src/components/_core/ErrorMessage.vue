<script setup lang="ts">
  import { AlertCircle } from 'lucide-vue-next';

  defineProps<{
    message?: string;
  }>();
</script>

<template>
  <div
    class="error-container"
    role="alert"
  >
    <div class="error-content">
      <AlertCircle class="error-icon" />
      <p class="error-text">
        {{ message || 'Chyba při načítání. Prosím, zkuste to později.' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
  .error-container {
    background-color: var(--color-error-light, #fee2e2);
    border: 1px solid var(--color-error, #ef4444);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-md, 16px);
    margin: var(--space-md, 16px) 0;
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  .error-icon {
    color: var(--color-error, #ef4444);
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }

  .error-text {
    color: var(--color-error-dark, #7f1d1d);
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
</style>
