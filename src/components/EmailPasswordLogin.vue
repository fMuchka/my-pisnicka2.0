<script setup lang="ts">
  import { Field, PasswordInput } from '@ark-ui/vue';
  import { EyeIcon, EyeOffIcon } from 'lucide-vue-next';
  import { ref } from 'vue';
  import Button from './core/Button.vue';
  import { loginWithEmailPassword } from '../lib/authService';

  const { onLogin } = defineProps<{ onLogin: () => void }>();

  const isEmailInvalid = ref(false);
  const isPasswordInvalid = ref(false);
  const areCredentialsInvalid = ref(false);
  const email = ref('');
  const password = ref('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = () => {
    return password.value.length > 0;
  };

  const handleConfirmClick = async () => {
    areCredentialsInvalid.value = false;

    if (email.value.length > 0) {
      isEmailInvalid.value = !validateEmail(email.value);
    } else {
      isEmailInvalid.value = true;
    }

    isPasswordInvalid.value = !validatePassword();

    if (isEmailInvalid.value === false && isPasswordInvalid.value === false) {
      // extra try catch due to tests
      try {
        await loginWithEmailPassword(email.value, password.value);
        areCredentialsInvalid.value = false;

        onLogin();
      } catch (_err) {
        // Handle rejected promise from mocked login in tests or network errors in runtime
        areCredentialsInvalid.value = true;
      }
    }
  };
</script>

<template>
  <div class="login-form">
    <Field.Root
      class="form-group"
      :invalid="isEmailInvalid || areCredentialsInvalid"
    >
      <Field.Label class="form-label">Email</Field.Label>
      <Field.Input
        v-model.trim="email"
        placeholder="jindra@skalitze.cz"
        class="form-input"
      />
      <Field.ErrorText
        class="error"
        :aria-label="areCredentialsInvalid ? 'invalid credentials' : 'invalid email format'"
        >{{ areCredentialsInvalid ? 'Špatné údaje' : 'Nesprávný formát' }}</Field.ErrorText
      >
    </Field.Root>

    <Field.Root :invalid="isPasswordInvalid || areCredentialsInvalid">
      <PasswordInput.Root class="form-group">
        <PasswordInput.Label class="form-label">Heslo</PasswordInput.Label>
        <PasswordInput.Control class="password-control">
          <PasswordInput.Input
            :value="password"
            placeholder="*****"
            class="form-input"
            @input="password = ($event.target as HTMLInputElement)?.value"
          />
          <PasswordInput.VisibilityTrigger class="password-visibility">
            <PasswordInput.Indicator>
              <EyeIcon />
              <template #fallback>
                <EyeOffIcon />
              </template>
            </PasswordInput.Indicator>
          </PasswordInput.VisibilityTrigger>
        </PasswordInput.Control>
      </PasswordInput.Root>
      <Field.ErrorText
        class="error"
        :aria-label="areCredentialsInvalid ? 'invalid credentials' : 'password is required'"
        >{{ areCredentialsInvalid ? 'Špatné údaje' : 'Heslo je prázdné' }}</Field.ErrorText
      >
    </Field.Root>

    <Button
      label="Přihlásit se"
      aria-label="login as host"
      @click="handleConfirmClick"
    />
  </div>
</template>

<style scoped>
  /* Form */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .form-label {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    font-family: var(--font-body);
    color: var(--text-primary);
    background-color: white;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    transition: border-color 150ms ease;
  }

  .form-input:focus {
    outline: none;
    border: 2px solid var(--accent);
    padding: 11px 15px; /* Adjust for thicker border */
  }

  .form-input::placeholder {
    color: var(--text-disabled);
  }

  /* Error state */
  .form-input-error {
    border-color: #dc2626;
  }

  .error {
    color: #dc2626;
  }

  .password-control {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-control .form-input {
    padding-right: 44px; /* room for icon */
  }

  .password-visibility {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
</style>
