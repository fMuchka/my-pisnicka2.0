<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import PageHeader from '../components/PageHeader.vue';
  import SongList from '../components/song-list/SongList.vue';
  import PinCodeInput from '../components/core/PinCodeInput.vue';
  import QrCode from '../components/core/QrCode.vue';
  import { useAuth } from '../composables/useAuth';
  import { stringToPin } from '../lib/pin';
  import {
    getSessionErrorMessage,
    getSessionStatus,
    type SessionErrorCode,
    type SessionRouterQuery,
  } from '../lib/session';
  import { useSessionStore } from '../stores/session';

  const TITLE = 'Relace';
  const TAG_LINE = 'Spolu teď a tady';

  const { isAuthenticated, user } = useAuth();
  const sessionStore = useSessionStore();
  const errorCode = ref<SessionErrorCode | undefined>(undefined);

  const route = useRoute();

  const sessionPin = computed(() => stringToPin(querySessionDetails.value.pin));
  const currentUrl = computed(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.location.href;
  });

  const querySessionDetails = computed(() => {
    const query = route.query as Partial<SessionRouterQuery>;

    const id = typeof query.sessionId === 'string' ? query.sessionId : '';
    const hostId = typeof query.hostId === 'string' ? query.hostId : '';
    const pin = typeof query.pin === 'string' ? query.pin : '';

    return {
      id,
      hostId,
      pin,
    };
  });

  const errorMessage = computed(() => getSessionErrorMessage(errorCode.value));

  const sessionDetails = computed(() => {
    const detailsFromStore = sessionStore.sessionDetails;

    if (detailsFromStore) {
      return {
        id: detailsFromStore.id,
        hostId: detailsFromStore.hostId,
        pin: detailsFromStore.pin,
      };
    }

    return emptySessionDetails;
  });

  const ownerId = computed(() => {
    return isAuthenticated.value
      ? (user.value?.uid ?? '')
      : querySessionDetails.value.hostId || sessionDetails.value.hostId;
  });

  watch(
    querySessionDetails,
    async (details) => {
      errorCode.value = undefined;

      if (!details.id || !details.hostId || !details.pin) {
        sessionStore.clearSession();
        errorCode.value = 'invalid-format';
        return;
      }

      const detailsFromStore = sessionStore.sessionDetails;

      if (
        detailsFromStore &&
        detailsFromStore.id === details.id &&
        detailsFromStore.hostId === details.hostId &&
        detailsFromStore.pin === details.pin
      ) {
        if (detailsFromStore.isActive === false) {
          errorCode.value = 'inactive';
        }

        return;
      }

      const sessionStatus = await getSessionStatus(details.pin);

      if (!sessionStatus.ok) {
        sessionStore.clearSession();
        errorCode.value = sessionStatus.errorCode;
        return;
      }

      const session = sessionStatus.session;
      if (!session) {
        sessionStore.clearSession();
        errorCode.value = 'firestore-error';
        return;
      }

      if (session.id !== details.id || session.hostId !== details.hostId) {
        sessionStore.clearSession();
        errorCode.value = 'not-found';
        return;
      }

      sessionStore.setSessionFromModel(session);
    },
    { immediate: true }
  );

  const emptySessionDetails = {
    id: '',
    hostId: '',
    pin: '',
  };
</script>

<template>
  <div
    class="container"
    data-testid="session-view"
  >
    <PageHeader
      :title="TITLE"
      :tagline="TAG_LINE"
    />
    <div
      v-if="querySessionDetails.pin"
      class="session-id"
      data-testid="session-id"
    >
      <QrCode :value="currentUrl" />
      <PinCodeInput
        :model-value="sessionPin"
        :read-only="true"
        :show-label="false"
        aria-label-prefix="pin číslice"
      />
    </div>

    <div
      v-if="errorMessage"
      class="error-message"
      role="alert"
      aria-live="polite"
    >
      {{ errorMessage }}
    </div>

    <SongList
      v-else
      :owner-id="ownerId"
    />
  </div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 600px;
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

  .session-id {
    margin-top: var(--space-md);
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-align: center;
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
