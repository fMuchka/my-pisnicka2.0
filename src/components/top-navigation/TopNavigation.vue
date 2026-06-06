<script setup lang="ts">
  import { ArrowLeft } from 'lucide-vue-next';
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
      fadeAway?: boolean;
    }>(),
    {
      showBack: true,
      pageTitle: undefined,
      pageSubtitle: undefined,
      backToPath: undefined,
      fadeAway: false,
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
    :class="`top-nav ${fadeAway ? 'fade-away' : ''}`"
    role="banner"
  >
    <div class="top-row">
      <div
        class="nav-title"
        @click="goHome"
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
    position: relative;
    padding: 0 var(--space-md);
    background-color: color-mix(in srgb, var(--bg-primary) 96%, var(--bg-secondary));
  }

  .context-left {
    min-width: 0;
    flex-shrink: 0;
  }

  .back-button {
    min-height: 44px;
    padding: 8px 10px;
    justify-self: start;
  }

  .context-header {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 200px);
    overflow: hidden;
    margin-bottom: 0;
    pointer-events: none;
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

  .fade-away {
    position: relative;
    top: -100px;
    opacity: 0;
  }

  @media (max-width: 600px) {
    .back-button :deep(span) {
      display: none;
    }

    .back-button {
      border: 1.5px solid color-mix(in srgb, var(--accent) 45%, var(--bg-tertiary));
      border-radius: var(--radius-sm);
      padding: 8px;
    }

    .context-header {
      max-width: calc(100% - 120px);
    }

    .logo {
      width: 25px;
      height: 25px;
    }
  }
</style>
