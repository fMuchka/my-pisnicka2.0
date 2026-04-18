<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import SongList from '../components/song-list/SongList.vue';
  import SessionControls from '../components/session/SessionControls.vue';
  import { useAuth } from '../composables/useAuth';
  import { stringToPin } from '../lib/pin';
  import {
    getSessionErrorMessage,
    getSessionStatus,
    type SessionErrorCode,
    type SessionRouterQuery,
  } from '../lib/session';
  import Routes from '../router/Routes';
  import { useSessionStore } from '../stores/session';

  const TITLE = 'Relace';
  const TAG_LINE = 'Spolu teď a tady';

  const { isAuthenticated } = useAuth();
  const sessionStore = useSessionStore();
  const errorCode = ref<SessionErrorCode | undefined>(undefined);
  const songListSearch = ref('');

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
  const sessionBackToPath = computed(() => (isAuthenticated.value ? undefined : Routes.Join));

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
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
    :back-to-path="sessionBackToPath"
  />

  <div
    class="container"
    data-testid="session-view"
  >
    <div
      v-if="errorMessage"
      class="error-message"
      role="alert"
      aria-live="polite"
    >
      {{ errorMessage }}
    </div>

    <template v-else>
      <SongList
        :external-search="songListSearch"
        @update:external-search="(newVal) => (songListSearch = newVal)"
      />
    </template>

    <SessionControls
      v-if="querySessionDetails.pin"
      :session-id="querySessionDetails.id"
      :pin="sessionPin"
      :current-url="currentUrl"
      @filter-song="songListSearch = $event"
    />
  </div>
</template>

<style scoped>
  .container {
    max-width: 600px;
    margin: auto;
    width: 100%;

    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    padding-bottom: calc(var(--space-3xl) + 88px + env(safe-area-inset-bottom, 0px));
  }

  .error-message {
    margin-top: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    background-color: var(--color-error-light);
    color: var(--color-error-dark);
    border-radius: var(--radius-sm);
    font-size: 14px;
    text-align: center;
  }
</style>
