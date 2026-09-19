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

    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);

    place-content: center;
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
