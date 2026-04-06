<script setup lang="ts">
  defineProps<{
    label?: string;
  }>();
</script>

<template>
  <div class="loading-container">
    <div class="spinner" />
    <p
      v-if="label"
      class="loading-label"
    >
      {{ label }}
    </p>
    <p
      v-else
      class="loading-label"
    >
      Načítání...
    </p>
  </div>
</template>

<style scoped>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg, 24px);
    gap: var(--space-md, 16px);
    min-height: 200px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--bg-tertiary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-label {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
    font-weight: 500;
  }
</style>
