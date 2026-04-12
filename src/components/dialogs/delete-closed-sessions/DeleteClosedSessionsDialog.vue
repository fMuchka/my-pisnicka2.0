<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { computed } from 'vue';
  import Button from '../../core/Button.vue';

  interface Props {
    open?: boolean;
    sessionCount?: number;
    isDeleting?: boolean;
    error?: string | null;
  }

  interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'confirm'): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    sessionCount: 0,
    isDeleting: false,
    error: null,
  });

  const emit = defineEmits<Emits>();

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const deleteLabel = computed(() =>
    props.isDeleting ? 'Mažu...' : `Smazat ${props.sessionCount} uzavřené relace`
  );

  const isSubmitDisabled = computed(() => props.isDeleting || props.sessionCount === 0);
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport to="body">
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content
          class="dialog-content"
          data-testid="delete-closed-sessions-dialog"
        >
          <Dialog.Title class="dialog-title">Smazat uzavřené relace</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Tato akce trvale smaže všechny vaše uzavřené relace ze seznamu. Otevřené relace zůstanou
            beze změny.
          </Dialog.Description>

          <p class="dialog-summary">
            Ke smazání: <strong>{{ sessionCount }}</strong>
          </p>

          <p
            v-if="error"
            class="dialog-error"
            aria-live="polite"
          >
            {{ error }}
          </p>

          <div class="dialog-actions">
            <Dialog.CloseTrigger as-child>
              <Button
                label="Zrušit"
                color-variation="Secondary"
                style-variation="Outlined"
                type="button"
              />
            </Dialog.CloseTrigger>
            <Button
              :label="deleteLabel"
              data-testid="delete-closed-sessions-confirm"
              type="button"
              :disabled="isSubmitDisabled"
              @click="emit('confirm')"
            />
          </div>

          <Dialog.CloseTrigger
            class="dialog-close"
            aria-label="Zavřít dialog mazání uzavřených relací"
          >
            ✕
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--overlay-backdrop);
    z-index: 999;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog-content {
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    max-width: 420px;
    width: 90%;
    box-shadow: var(--shadow-dialog);
    position: relative;
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--space-sm);
  }

  .dialog-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
  }

  .dialog-summary {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .dialog-error {
    margin: var(--space-sm) 0 0;
    color: var(--color-danger, #b42318);
    font-size: 0.875rem;
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }

  .dialog-close {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: var(--space-xs);
    line-height: 1;
  }

  .dialog-close:hover {
    color: var(--text-primary);
  }
</style>
