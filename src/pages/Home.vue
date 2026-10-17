<script setup lang="ts">
  import { Music, Users, Info, Settings, type LucideIcon } from 'lucide-vue-next';
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import IconBackdrop from '../components/_core/icon-backdrop/IconBackdrop.vue';
  import { useAuth } from '../composables/useAuth';
  import { hasUnseenTimelineUpdates } from '../lib/timeline/timeline';
  import Routes from '../router/Routes';

  type HomeTile = {
    label: string;
    meta: string;
    icon: LucideIcon;
    route: Routes;
    showBadge?: boolean;
  };

  const router = useRouter();
  const auth = useAuth();

  const showInfoBadge = ref(false);

  const userName = computed(() => auth.user.value?.email?.trim().split('@')[0] || 'Melon');

  const tiles = computed<HomeTile[]>(() => [
    { label: 'Písně', meta: 'Procvičování', icon: Music, route: Routes.SongLibrary },
    { label: 'Relace', meta: 'Společné hraní', icon: Users, route: Routes.SessionList },
    {
      label: 'Informace',
      meta: 'Co bylo, je a bude',
      icon: Info,
      route: Routes.Info,
      showBadge: showInfoBadge.value,
    },
    { label: 'Nastavení', meta: 'Vzhled a motiv', icon: Settings, route: Routes.Settings },
  ]);

  // Info.vue marks the timeline as visited itself; doing it here would hide its "new" highlights.
  const openTile = (tile: HomeTile) => {
    if (tile.route === Routes.Info) {
      showInfoBadge.value = false;
    }
    return router.push({ path: tile.route });
  };

  onMounted(() => {
    showInfoBadge.value = hasUnseenTimelineUpdates();
  });
</script>

<template>
  <div
    class="container"
    data-testid="home-view"
  >
    <header class="greeting">
      <p class="greeting-eyebrow">Vítej zpět</p>
      <h1 class="greeting-name">{{ userName }}</h1>
    </header>

    <nav
      class="home-nav"
      aria-label="Home navigation"
    >
      <button
        v-for="tile in tiles"
        :key="tile.route"
        type="button"
        class="tile"
        @click="openTile(tile)"
      >
        <span
          v-if="tile.showBadge"
          class="tile-badge"
        >
          Nové
        </span>
        <IconBackdrop
          shape="rounded"
          size="lg"
          aria-hidden="true"
        >
          <component
            :is="tile.icon"
            class="tile-icon"
          />
        </IconBackdrop>
        <span class="tile-text">
          <span class="tile-label">{{ tile.label }}</span>
          <span class="tile-meta">{{ tile.meta }}</span>
        </span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
  .container {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    font-family: var(--font-sans);
    color: var(--ink);
    padding: var(--space-lg) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .greeting-eyebrow {
    margin: 0;
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  .greeting-name {
    margin: 2px 0 0;
    font: var(--text-display);
  }

  .home-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    min-height: 152px;
    box-sizing: border-box;
    padding: 18px;
    background-color: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--ink);
    font-family: var(--font-sans);
    text-align: left;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .tile:hover,
  .tile:focus-visible {
    background-color: var(--surface-selected);
    border-color: var(--brand);
    outline: none;
  }

  .tile-icon {
    width: 22px;
    height: 22px;
  }

  .tile-text {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tile-label {
    font: var(--text-title-compact);
  }

  .tile-meta {
    font: var(--text-caption);
    color: var(--ink-muted);
  }

  /* Solid fill on purpose: the soft-tint pill's brand text fell under 4.5:1 in both themes. */
  .tile-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4.5px 8px;
    border-radius: var(--radius-full);
    background: var(--brand-fill);
    color: var(--on-brand);
    font: var(--text-badge-text);
    text-transform: uppercase;
  }

  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl);
    }

    .greeting-name {
      font: var(--text-heading);
    }

    .tile {
      min-height: 180px;
      padding: var(--space-lg);
    }
  }
</style>
