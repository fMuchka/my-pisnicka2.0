import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Session } from '../lib/session';

export type SessionStoreDetails = Pick<Session, 'id' | 'hostId' | 'pin'> &
  Partial<Pick<Session, 'name' | 'hostDisplayName' | 'isActive'>>;

export const useSessionStore = defineStore('session', () => {
  const sessionDetails = ref<SessionStoreDetails | null>(null);

  const hasSession = computed(() => {
    return sessionDetails.value !== null;
  });

  const setSessionFromModel = (session: Session) => {
    sessionDetails.value = {
      id: session.id,
      hostId: session.hostId,
      pin: session.pin,
      name: session.name,
      hostDisplayName: session.hostDisplayName,
      isActive: session.isActive,
    };
  };

  const setSessionDetails = (details: SessionStoreDetails) => {
    sessionDetails.value = { ...details };
  };

  const clearSession = () => {
    sessionDetails.value = null;
  };

  return {
    sessionDetails,
    hasSession,
    setSessionFromModel,
    setSessionDetails,
    clearSession,
  };
});
