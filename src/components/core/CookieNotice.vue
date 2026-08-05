<script setup lang="ts">
  import { Cookie } from 'lucide-vue-next';
  import { onMounted, ref } from 'vue';

  const COOKIE_NOTICE_STORAGE_KEY = 'my-pisnicka:cookie-notice-consent';
  const ACCEPTED_VALUE = 'accepted';

  const isVisible = ref(false);

  onMounted(() => {
    const persistedDecision = localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY);
    isVisible.value = persistedDecision !== ACCEPTED_VALUE;
  });

  const accept = () => {
    localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, ACCEPTED_VALUE);
    isVisible.value = false;
  };
</script>

<template>
  <aside
    v-if="isVisible"
    class="cookie-notice"
    role="dialog"
    aria-live="polite"
    aria-label="Informace o ukládání funkčních dat"
  >
    <div class="cookie-notice__icon-wrap">
      <Cookie
        :size="20"
        aria-hidden="true"
      />
    </div>

    <div class="cookie-notice__content">
      <p class="cookie-notice__title">Sušenky, co nešmírují</p>
      <p class="cookie-notice__description">
        Pro funkčnost aplikace ukládáme několik dat do prohlížeče. Sama se časem smažou.
        <br />
        Neukládáme analytiku. Nepoužíváme reklamy.
      </p>
    </div>

    <div class="cookie-notice__actions">
      <button
        class="cookie-notice__button cookie-notice__button--primary"
        type="button"
        @click="accept"
      >
        Rozumím
      </button>
    </div>
  </aside>
</template>

<style scoped>
  .cookie-notice {
    position: fixed;
    left: max(12px, env(safe-area-inset-left, 0px));
    right: max(12px, env(safe-area-inset-right, 0px));
    bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px));
    z-index: 1200;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-primary) 96%, var(--accent) 4%);
    box-shadow: var(--shadow-dialog);
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: auto 1fr;
    align-items: start;
    padding: var(--space-md);
    max-width: 760px;
    margin: 0 auto;
  }

  .cookie-notice__icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .cookie-notice__content {
    min-width: 0;
  }

  .cookie-notice__title {
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .cookie-notice__description {
    margin-top: 0.35rem;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .cookie-notice__actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }

  .cookie-notice__button {
    border-radius: var(--radius-sm);
    min-height: 40px;
    padding: 0.45rem 0.9rem;
    border: 1px solid transparent;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  .cookie-notice__button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .cookie-notice__button--primary {
    background: var(--accent);
    color: #ffffff;
  }

  .cookie-notice__button--primary:hover {
    background: color-mix(in srgb, var(--accent) 86%, black 14%);
  }

  @media (max-width: 560px) {
    .cookie-notice {
      grid-template-columns: 1fr;
      padding: 0.75rem;
    }

    .cookie-notice__icon-wrap {
      display: none;
    }

    .cookie-notice__actions {
      justify-content: stretch;
    }

    .cookie-notice__button {
      width: 100%;
    }
  }
</style>
