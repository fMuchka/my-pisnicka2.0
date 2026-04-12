<script setup lang="ts">
  import { ArrowLeft, Route } from 'lucide-vue-next';
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import Routes from '../../router/Routes';
  import AppOptions from './options/AppOptions.vue';
  import Button from '../core/Button.vue';
  import PageHeader from '../PageHeader.vue';
  import UserOptions from './options/UserOptions.vue';
  import { useAuth } from '../../composables/useAuth';

  const props = withDefaults(
    defineProps<{
      pageTitle?: string;
      pageSubtitle?: string;
      showBack?: boolean;
      backToPath?: string;
    }>(),
    {
      showBack: true,
      pageTitle: undefined,
      pageSubtitle: undefined,
      backToPath: undefined,
    }
  );

  const { isAuthenticated } = useAuth();

  const router = useRouter();
  const hasPageTitle = computed(() => Boolean(props.pageTitle?.trim()));
  const hasPageSubtitle = computed(() => Boolean(props.pageSubtitle?.trim()));
  const showContextRow = computed(
    () => props.showBack === true || hasPageTitle.value || hasPageSubtitle.value
  );

  const goBack = () => {
    if (props.backToPath) {
      router.push({ path: props.backToPath });

      return;
    }

    if (window.history.length > 1) {
      router.back();

      return;
    }

    router.push({ path: Routes.Home });
  };

  const goHome = () => {
    if (isAuthenticated) {
      router.push({ path: Routes.Home });
    } else {
      router.push({ path: Routes.Login });
    }
  };
</script>

<template>
  <header
    class="top-nav"
    role="banner"
  >
    <div class="top-row">
      <div
        class="nav-title"
        @click="goHome"
      >
        MyPísnička
      </div>
      <div class="nav-actions">
        <AppOptions />
        <UserOptions />
      </div>
    </div>

    <div
      v-if="showContextRow"
      class="context-row"
    >
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

      <PageHeader
        class="context-header"
        :title="props.pageTitle"
        :tagline="props.pageSubtitle"
      />
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
    cursor: pointer;
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

  .context-header {
    min-width: 0;
    max-width: min(55vw, 320px);
    overflow: hidden;
    margin-bottom: 0;
  }

  .context-header :deep(.header) {
    margin: 0;
    text-align: center;
  }

  .context-header :deep(.title) {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-header :deep(.tagline) {
    margin-top: 2px;
    margin-bottom: 0;
    font-size: 0.78rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
