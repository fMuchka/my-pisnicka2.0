<script setup lang="ts">
  import { computed } from 'vue';
  import UserOptions from './options/UserOptions.vue';

  const props = withDefaults(
    defineProps<{
      pageTitle?: string;
      fadeAway?: boolean;
    }>(),
    {
      pageTitle: undefined,
      fadeAway: false,
    }
  );

  const emit = defineEmits<{ home: [] }>();

  const hasPageTitle = computed(() => Boolean(props.pageTitle?.trim()));
</script>

<template>
  <header
    :class="`top-nav ${fadeAway ? 'fade-away' : ''}`"
    role="banner"
  >
    <div class="top-row">
      <div
        class="nav-title"
        @click="emit('home')"
      >
        <img
          src="/mypisnicka-icon.svg"
          alt="MyPísnička"
          class="logo"
          width="30"
          height="30"
          color="blue"
        />
        MyPísnička
      </div>
      <div class="nav-actions">
        <UserOptions />
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="hasPageTitle"
      class="context-row"
    >
      <h1 class="page-title">{{ props.pageTitle }}</h1>
    </div>
  </header>
</template>

<style scoped>
  .top-nav {
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--bg-tertiary);
    position: sticky;
    top: 0;
    z-index: 10;

    transition: all 0.3s;
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-md);
    min-height: 48px;
  }

  .nav-title {
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .nav-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .context-row {
    border-top: 1px solid color-mix(in srgb, var(--bg-tertiary) 60%, transparent);
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-md);
    background-color: color-mix(in srgb, var(--bg-primary) 96%, var(--bg-secondary));
  }

  .page-title {
    min-width: 0;
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    line-height: 1.2;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fade-away {
    position: relative;
    top: -100px;
    opacity: 0;
  }

  @media (max-width: 600px) {
    .logo {
      width: 25px;
      height: 25px;
    }
  }
</style>
