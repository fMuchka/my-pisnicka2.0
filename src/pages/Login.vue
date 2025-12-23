<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import EmailPasswordLogin from '../components/EmailPasswordLogin.vue';
  import Button from '../components/core/Button.vue';
  import Routes from '../router/Routes';

  const router = useRouter();
  const onLogin = () => {
    router.push(Routes.Home);
  };
</script>

<template>
  <div class="login-container">
    <header class="header">
      <h1 class="app-name">MyPísnička</h1>
      <p class="tagline">S přáteli hraj a zpívej, bav se a zábavu sdílej</p>
    </header>

    <EmailPasswordLogin @login="onLogin" />

    <div class="divider">
      <span class="divider-text">nebo</span>
    </div>

    <Button
      label="Připojit se bez účtu"
      aria-label="continue as guest"
      colorVariation="Secondary"
    />
  </div>
</template>

<style scoped>
  /* Main container */
  .login-container {
    max-width: 400px;
    margin: auto;
    width: 100%;

    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);

    place-content: center;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: var(--space-2xl);
  }

  .app-name {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: var(--space-sm);
    color: var(--text-primary);
  }

  .tagline {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 400;
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
    background-color: var(--bg-tertiary);
  }

  .divider-text {
    position: relative;
    display: inline-block;
    padding: 0 var(--space-md);
    background-color: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 14px;
  }
</style>
