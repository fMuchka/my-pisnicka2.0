<script setup lang="ts">
  import { computed, ref } from 'vue';
  import Button from './_core/button/Button.vue';
  import Input from './_core/input/Input.vue';
  import { loginWithEmailPassword } from '../lib/authService';

  const emit = defineEmits<{ login: [] }>();

  type LoginValidation = {
    user: boolean; // input format
    password: boolean; // input format
    credentials: boolean; // server response
  };

  const validationChecks = ref<LoginValidation>({
    credentials: false,
    user: false,
    password: false,
  });

  const user = ref('');
  const password = ref('');

  const userError = computed(() =>
    validationChecks.value.credentials ? 'Špatné údaje' : 'Nesprávný formát'
  );
  const passwordError = computed(() =>
    validationChecks.value.credentials ? 'Špatné údaje' : 'Heslo je prázdné'
  );

  const validateUser = (value: string): boolean => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return false;
    }

    if (!trimmedValue.includes('@')) {
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedValue);
  };

  const validatePassword = () => {
    return password.value.length > 0;
  };

  const handleConfirmClick = async () => {
    validationChecks.value.credentials = false;

    validationChecks.value.user = !validateUser(user.value);

    validationChecks.value.password = !validatePassword();

    if (validationChecks.value.user === false && validationChecks.value.password === false) {
      // extra try catch due to tests
      try {
        await loginWithEmailPassword(user.value.trim(), password.value);
        validationChecks.value.credentials = false;
        emit('login');
      } catch (_err) {
        // Handle rejected promise from mocked login in tests or network errors in runtime
        validationChecks.value.credentials = true;
      }
    }
  };
</script>

<template>
  <form
    class="login-form"
    @submit.prevent="handleConfirmClick"
  >
    <Input
      v-model="user"
      label="Uživatel"
      placeholder="Tom Bombadil"
      autocomplete="username"
      :invalid="validationChecks.user || validationChecks.credentials"
      :error-text="userError"
    />

    <Input
      v-model="password"
      label="Heslo"
      type="password"
      placeholder="•••••"
      autocomplete="current-password"
      :invalid="validationChecks.password || validationChecks.credentials"
      :error-text="passwordError"
    />

    <Button
      label="Přihlásit se"
      aria-label="Přihlásit se"
      type="submit"
    />
  </form>
</template>

<style scoped>
  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
