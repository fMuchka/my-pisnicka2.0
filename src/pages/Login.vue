<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import EmailPasswordLogin from '../components/EmailPasswordLogin.vue';
  import Button from '../components/core/button/Button.vue';
  import Routes from '../router/Routes';

  const router = useRouter();
  const onLogin = () => {
    router.push(Routes.Home);
  };

  const goToJoin = () => {
    router.push(Routes.Join);
  };
</script>

<template>
  <div class="container">
    <div id="logo-wrapper">
      <img
        src="/mypisnicka-icon.svg"
        alt=""
      />
      <span class="wordmark">My<span class="wordmark-accent">Písnička</span></span>
    </div>

    <EmailPasswordLogin @login="onLogin" />

    <div class="divider">
      <span class="divider-text">nebo</span>
    </div>

    <Button
      label="Připojit se bez účtu"
      aria-label="Pokračovat bez účtu"
      color-variation="secondary"
      @click="() => goToJoin()"
    />
  </div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 400px;
    margin: auto;
    width: 100%;

    font-family: var(--font-sans);
    background-color: var(--surface);
    color: var(--ink);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);

    place-content: center;
  }

  #logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xl);
  }

  #logo-wrapper img {
    width: 48px;
    height: 48px;
  }

  .wordmark {
    font: var(--text-heading);
    letter-spacing: -0.01em;
  }

  .wordmark-accent {
    color: var(--brand);
  }

  /** Divider */
  .divider {
    margin: var(--space-xl) 0;
    text-align: center;
    position: relative;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--border);
  }

  .divider-text {
    position: relative;
    display: inline-block;
    padding: 0 var(--space-md);
    background-color: var(--surface);
    color: var(--ink-muted);
    font-size: 14px;
  }
</style>
