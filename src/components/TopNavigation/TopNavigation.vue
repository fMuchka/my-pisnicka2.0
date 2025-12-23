<script setup lang="ts">
  import { Settings } from 'lucide-vue-next';
  import Button from '../core/Button.vue';
  import UserOptions from './Options/UserOptions.vue';
</script>

<template>
  <div class="top-nav">
    <div class="nav-title">MyPísnička</div>
    <div class="nav-actions">
      <Button
        :icon="{ component: Settings, position: 'prepend' }"
        style-variation="Text"
      />
      <UserOptions />
    </div>
  </div>
</template>

<style scoped>
  /* Top Navigation */
  .top-nav {
    height: 48px;
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-md);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-title {
    font-size: 20px;
    font-weight: 600;
  }

  .nav-actions {
    display: flex;
    gap: var(--space-sm);
  }
</style>
