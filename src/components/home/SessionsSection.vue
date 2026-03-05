<script setup lang="ts">
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import { Plus, UserPlus } from 'lucide-vue-next';
  import Button from '../core/Button.vue';
  import ErrorMessage from '../core/ErrorMessage.vue';
  import LoadingSpinner from '../core/LoadingSpinner.vue';
  import { formatSessionAge } from '../../lib/formatter';
  import type { Session } from '../../lib/session';

  interface SessionsSectionProps {
    latestSessions: Session[];
    sessionsError: string | null;
    loadingSection: 'sessions' | 'songs' | null;
    openCreateDialog: () => void;
    goToJoinPage: () => void;
    goToSessionListPage: () => void;
    openSession: (session: Session) => void;
  }

  const props = defineProps<SessionsSectionProps>();
</script>

<template>
  <section
    class="content-section"
    data-testid="home-sessions-section"
  >
    <div class="section-header">
      <h2 class="section-title">Relace</h2>
      <div class="header-actions">
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <Button
              class="action-btn"
              aria-label="Vytvořit novou relaci"
              :icon="{ position: 'prepend', component: Plus }"
              type="button"
              @click="props.openCreateDialog"
            />
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Vytvořit novou relaci</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <Button
              class="action-btn"
              aria-label="Připojit se k relaci"
              :icon="{ position: 'prepend', component: UserPlus }"
              @click="props.goToJoinPage"
            />
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Připojit se k relaci</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <Button
          class="view-all-link"
          aria-label="Zobrazit všechny relace"
          color-variation="Primary"
          :label="'Zobrazit všechny relace'"
          @click="props.goToSessionListPage"
        />
      </div>
    </div>

    <LoadingSpinner
      v-if="props.loadingSection === 'sessions'"
      label="Načítání relací..."
    />

    <ErrorMessage
      v-else-if="props.sessionsError"
      :message="props.sessionsError"
    />

    <div
      v-else
      class="sessions-list"
      role="list"
    >
      <div
        v-if="props.latestSessions.length === 0"
        class="empty-state"
      >
        Žádné relace
      </div>
      <div
        v-for="session in props.latestSessions"
        :key="session.id"
        class="session-item"
        role="listitem"
        @click="() => props.openSession(session)"
      >
        <div class="session-info">
          <h3>{{ session.name }}</h3>
          <div class="session-meta">{{ formatSessionAge(session.createdAt) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .content-section {
    background-color: white;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    gap: var(--space-sm);
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .action-btn {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-primary);
    transition: all 150ms ease;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
  }

  .action-btn:hover {
    color: var(--accent);
    background-color: var(--bg-secondary);
  }

  .view-all-link {
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 150ms ease;
  }

  .view-all-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    text-decoration: none;
    color: inherit;
    transition: all 150ms ease;
    cursor: pointer;
  }

  .session-item:hover {
    background-color: var(--bg-tertiary);
  }

  .session-info h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 4px 0;
  }

  .session-meta {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .tooltip-content {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
</style>
