<script setup lang="ts">
  import PageHeader from '../components/PageHeader.vue';
  import Button from '../components/core/Button.vue';
  import PinCodeInput from '../components/core/PinCodeInput.vue';
  import { ref, computed } from 'vue';
  import {
    createSessionRouterQuery,
    getSessionErrorMessage,
    getSessionStatus,
    type SessionErrorCode,
    type SessionStatusResult,
    type OkSessionResult,
  } from '../lib/session';
  import { emptyPin, type PIN } from '../lib/pin';
  import { useRouter } from 'vue-router';
  import Routes from '../router/Routes';
  import { useSessionStore } from '../stores/session';

  // UI Text
  const TITLE = 'Připojit se k partě';
  const TAG_LINE = 'Ne každý kdo bloudí, je ztracený.';

  // Reactive state
  const pin = ref<PIN>(emptyPin());
  const joining = ref<boolean>(false); // Loading state during API call
  const errorCode = ref<SessionErrorCode | undefined>(undefined); // Current error, if any

  const router = useRouter();
  const sessionStore = useSessionStore();

  /**
   * Computed error message in Czech based on current error code.
   * Falls back to generic message if error code is unknown.
   */
  const errorMessage = computed(() => {
    return getSessionErrorMessage(errorCode.value);
  });

  /**
   * Handles the join button click:
   * 1. Joins PIN digits and validates format
   * 2. Disables button and shows loading state
   * 3. Calls joinSession() to query Firestore
   * 4. On success: navigates to Session view
   * 5. On error: displays localized error message and re-enables button
   *
   * Uses explicit async/await for clarity (prefer over promise chains).
   */
  const handleJoin = async () => {
    // Reconstruct PIN string from individual digit refs
    // ARK UI's PinInput stores each digit in separate ref; join and remove commas
    const val = pin.value.join().replaceAll(',', '');

    // Show loading state and clear previous errors
    joining.value = true;
    errorCode.value = undefined;

    // Attempt to join session via Firestore query
    const result: SessionStatusResult = await getSessionStatus(val);

    if (result.ok === true) {
      const session = (result as OkSessionResult).session;

      sessionStore.setSessionFromModel(session);

      // Success! Navigate to Session page (will display songs, etc.)
      router.push({
        path: Routes.Session,
        query: createSessionRouterQuery(session),
      });
    } else {
      // Failed! Display error message and re-enable button for retry
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

    <PinCodeInput
      v-model="pin"
      title="Zadej 4-místný PIN"
      description="Pomocí PINu tě spojíme s otevřenou partou."
      aria-label-prefix="pin číslice"
    />

    <!-- Join Button with loading state -->
    <Button
      label="Připojit"
      :disabled="joining"
      @click="() => handleJoin()"
    />

    <!-- Error message area (displayed when error occurs) -->
    <!-- aria-live region announces errors to screen readers -->
    <div
      v-if="errorMessage"
      class="error-message"
      role="alert"
      aria-live="polite"
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
