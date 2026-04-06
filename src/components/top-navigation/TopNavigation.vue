<script setup lang="ts">
  import { ArrowLeft, Settings } from 'lucide-vue-next';
  import { useRouter } from 'vue-router';
  import Routes from '../../router/Routes';
  import Button from '../core/Button.vue';
  import UserOptions from './options/UserOptions.vue';

  const props = withDefaults(
    defineProps<{
      pageTitle: string;
      showBack?: boolean;
    }>(),
    {
      showBack: true,
    }
  );

  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();

      return;
    }

    router.push({ path: Routes.Home });
  };
</script>

<template>
  <header
    class="top-nav"
    role="banner"
  >
    <div class="top-row">
      <div class="nav-title">MyPísnička</div>
      <div class="nav-actions">
        <Button
          :icon="{ component: Settings, position: 'prepend' }"
          style-variation="Text"
          aria-label="Nastavení"
        />
        <UserOptions />
      </div>
    </div>

    <div class="context-row">
      <div class="context-left">
        <Button
          v-if="props.showBack"
          class="back-button"
          label="Zpět"
          :icon="{ component: ArrowLeft, position: 'prepend' }"
          color-variation="Secondary"
          style-variation="Text"
          type="button"
          aria-label="Zpět"
          @click="goBack"
        />
      </div>

      <h1 class="context-title">{{ props.pageTitle }}</h1>
      <div class="context-right" />
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
  }

  .nav-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .context-row {
    border-top: 1px solid color-mix(in srgb, var(--bg-tertiary) 60%, transparent);
    min-height: 52px;
    display: grid;
    grid-template-columns: minmax(96px, 1fr) auto minmax(96px, 1fr);
    align-items: center;
    gap: var(--space-xs);
    padding: 0 var(--space-md);
    background-color: color-mix(in srgb, var(--bg-primary) 96%, var(--bg-secondary));
  }

  .context-left,
  .context-right {
    min-width: 0;
  }

  .context-right {
    min-height: 44px;
  }

  .back-button {
    min-height: 44px;
    padding: 8px 10px;
    justify-self: start;
  }

  .context-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    text-align: center;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(55vw, 320px);
  }

  @media (max-width: 360px) {
    .back-button :deep(span) {
      display: none;
    }

    .context-row {
      grid-template-columns: minmax(56px, 1fr) auto minmax(56px, 1fr);
    }
  }
</style>
