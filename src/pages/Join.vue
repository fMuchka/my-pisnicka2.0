<script setup lang="ts">
  import { PinInput } from '@ark-ui/vue';
  import PageHeader from '../components/PageHeader.vue';
  import Button from '../components/core/Button.vue';
  import { ref, computed } from 'vue';
  import { joinSession, type JoinSessionResult } from '../lib/session';
  import { useRouter } from 'vue-router';
  import Routes from '../router/Routes';

  export type PIN = [string, string, string, string];

  const TITLE = 'Připojit se k partě';
  const TAG_LINE = 'Ne každý kdo bloudí, je ztracený.';

  const ERROR_MESSAGES: Record<string, string> = {
    'not-found': 'Parta s tímto PINem neexistuje.',
    inactive: 'Parta je uzavřena nebo již skončila.',
    'invalid-format': 'PIN musí být 4-místné číslo.',
    'firestore-error':
      'Chyba připojení. Zkus to prosím později nebo se ujisti, že máš přístup k internetu.',
  };

  const pin = ref<PIN>(['', '', '', '']);

  const joining = ref<boolean>(false);
  const errorCode = ref<string | undefined>(undefined);

  const router = useRouter();

  const errorMessage = computed(() => {
    return errorCode.value ? ERROR_MESSAGES[errorCode.value] || 'Neznámá chyba' : '';
  });

  const handleJoin = async () => {
    const val = pin.value.join().replaceAll(',', '');

    joining.value = true;
    errorCode.value = undefined;

    const result: JoinSessionResult = await joinSession(val);

    if (result.ok) {
      router.push(Routes.Session);
    } else {
      errorCode.value = result.errorCode;
      joining.value = false;
    }
  };
</script>

<template>
  <div
    class="container"
    data-testid="join-view"
  >
    <PageHeader
      :title="TITLE"
      :tagline="TAG_LINE"
    />

    <PinInput.Root
      v-model="pin"
      class="pin-container"
      type="numeric"
      @value-change="(newVal) => (pin = newVal.value as PIN)"
    >
      <PinInput.Label class="pin-description">
        <p class="sub-title">Zadej 4-místný PIN</p>
        Pomocí PINu tě spojíme s otevřenou partou.
      </PinInput.Label>
      <PinInput.Control class="pin-control">
        <PinInput.Input
          v-for="(val, i) in pin"
          :key="val"
          class="pin-input"
          :index="i"
          placeholder=""
          :aria-label="`pin číslice ${i + 1}`"
        />
      </PinInput.Control>
      <PinInput.HiddenInput />
    </PinInput.Root>

    <Button
      label="Připojit"
      :disabled="joining"
      @click="() => handleJoin()"
    />

    <div
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </div>
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

  .pin-container {
    margin-bottom: var(--space-lg);
  }

  .pin-description {
    display: flex;
    flex-direction: column;
    text-align: center;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);

    > .sub-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: var(--space-xs);
      color: var(--text-primary);
    }
  }

  .pin-control {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-md);
  }

  .pin-input {
    width: 100%;
    padding: 12px 0;
    font-size: 22px;
    text-align: center;
    font-weight: 600;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: white;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .pin-input:focus {
    outline: none;
    border: 2px solid var(--accent);
    padding: 11px 0;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
  }

  .error-message {
    margin-top: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    border-radius: var(--radius-sm);
    font-size: 14px;
    text-align: center;
  }
</style>
