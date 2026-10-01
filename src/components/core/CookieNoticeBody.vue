<script setup lang="ts">
  import { Cookie } from 'lucide-vue-next';
  import IconBackdrop from './icon-backdrop/IconBackdrop.vue';

  const emit = defineEmits<{ accept: [] }>();

  const accept = () => {
    emit('accept');
  };
</script>

<template>
  <div class="cookie-notice__header">
    <IconBackdrop>
      <Cookie
        :size="20"
        aria-hidden="true"
      />
    </IconBackdrop>
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
</template>

<style scoped>
  .cookie-notice__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .cookie-notice__description {
    flex: 1;
    min-width: 0;
    color: var(--ink-muted);
    font-size: 14px;
    line-height: 20px;
  }

  .cookie-notice__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }

  .cookie-notice__button {
    border-radius: var(--radius-md);
    min-height: 44px;
    padding: 0.45rem 0.9rem;
    border: 1px solid transparent;
    font: inherit;
    font-size: 15px;
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
    background: var(--brand-fill);
    color: var(--on-brand);
  }

  .cookie-notice__button--primary:hover {
    background: var(--brand-light);
  }

  @media (max-width: 560px) {
    .cookie-notice__actions {
      justify-content: stretch;
    }

    .cookie-notice__button {
      width: 100%;
    }
  }
</style>
