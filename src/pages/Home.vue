<script setup lang="ts">
  import { Music, Users, Info } from 'lucide-vue-next';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import { useRouter } from 'vue-router';
  import Routes from '../router/Routes';

  const router = useRouter();

  const goToSessionListPage = () => router.push({ path: Routes.SessionList });
  const goToSongLibraryPage = () => router.push({ path: Routes.SongLibrary });
</script>

<template>
  <TopNavigation
    page-title=""
    :show-back="false"
  />

  <div
    class="container"
    data-testid="home-view"
  >
    <nav
      class="home-nav"
      aria-label="Home navigation"
    >
      <button
        type="button"
        class="nav-item"
        @click="goToSongLibraryPage"
      >
        <span class="nav-item-content">
          <Music class="nav-item-icon" />
          <span class="nav-item-label">Písně</span>
        </span>
        <span class="nav-item-meta">Procvičování</span>
      </button>

      <button
        type="button"
        class="nav-item"
        @click="goToSessionListPage"
      >
        <span class="nav-item-content">
          <Users class="nav-item-icon" />
          <span class="nav-item-label">Relace</span>
        </span>
        <span class="nav-item-meta">Společné hraní</span>
      </button>

      <button
        type="button"
        class="nav-item nav-item-disabled"
      >
        <span class="nav-item-content">
          <Info class="nav-item-icon" />
          <span class="nav-item-label">Informace</span>
        </span>
        <span class="nav-item-meta">Co se stalo, děje a bude dít</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    padding: var(--space-xl) var(--space-md);
  }

  .home-nav {
    display: grid;
    gap: var(--space-md);
  }

  .nav-item {
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    font-family: var(--font-body);
    font-size: 1.15rem;
    font-weight: 600;
    justify-content: space-between;
    min-height: 84px;
    padding: var(--space-lg) var(--space-md);
    text-align: left;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
    width: 100%;
  }

  .nav-item:hover,
  .nav-item:focus-visible {
    background-color: var(--bg-tertiary);
    border-color: var(--accent-primary);
    outline: none;
  }

  .nav-item-content {
    align-items: center;
    display: inline-flex;
    gap: var(--space-sm);
  }

  .nav-item-icon {
    flex-shrink: 0;
    height: 1.45rem;
    width: 1.45rem;
  }

  .nav-item-label {
    line-height: 1.2;
  }

  .nav-item-disabled {
    color: var(--text-muted);
    cursor: not-allowed;
  }

  .nav-item-meta {
    font-size: 0.95rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl);
    }

    .nav-item {
      min-height: 92px;
      padding: var(--space-lg) var(--space-xl);
    }
  }
</style>
