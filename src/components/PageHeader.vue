<script setup lang="ts">
  const props = withDefaults(defineProps<{ title?: string; tagline?: string }>(), {
    title: '',
    tagline: '',
  });
</script>

<template>
  <header class="header">
    <h1 class="title">{{ props.title }}</h1>
    <p class="tagline">{{ props.tagline }}</p>
  </header>
</template>

<style scoped>
  /* Header */
  .header {
    text-align: center;
    margin-bottom: var(--space-2xl);
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: var(--space-sm);
    color: var(--text-primary);
  }

  .tagline {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 400;
  }
</style>
