<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { computed } from 'vue';
  import Button from '../../core/Button.vue';

  interface Props {
    open: boolean;
    transpose: number;
  }

  interface Emits {
    (event: 'update:open', value: boolean): void;
    (event: 'update:transpose', value: number): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const transpositionLabel = computed(() => {
    if (props.transpose > 0) {
      return `+${props.transpose}`;
    }

    return `${props.transpose}`;
  });

  const decrease = () => {
    emit('update:transpose', props.transpose - 1);
  };

  const increase = () => {
    emit('update:transpose', props.transpose + 1);
  };

  const reset = () => {
    emit('update:transpose', 0);
  };
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport to="body">
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content class="dialog-content">
          <Dialog.Title class="dialog-title">Nastavení akordů</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Upravte transpozici akordů pro aktuální zobrazení písně.
          </Dialog.Description>

          <section class="transpose-card">
            <p class="transpose-label">Transpozice</p>
            <div class="transpose-controls">
              <button
                class="stepper"
                type="button"
                aria-label="Snížit transpozici"
                @click="decrease"
              >
                -
              </button>
              <output class="transpose-value">{{ transpositionLabel }}</output>
              <button
                class="stepper"
                type="button"
                aria-label="Zvýšit transpozici"
                @click="increase"
              >
                +
              </button>
            </div>
            <p class="transpose-note">1 krok = 1 půltón</p>
          </section>

          <div class="dialog-actions">
            <Button
              label="Reset"
              color-variation="Secondary"
              style-variation="Outlined"
              type="button"
              @click="reset"
            />
            <Dialog.CloseTrigger as-child>
              <Button
                label="Zavřít"
                type="button"
              />
            </Dialog.CloseTrigger>
          </div>
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
    z-index: 40;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 41;
  }

  .dialog-content {
    width: min(92vw, 380px);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-md);
  }

  .dialog-title {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .dialog-description {
    margin-top: var(--space-xs);
    color: var(--text-secondary);
    font-size: 0.92rem;
  }

  .transpose-card {
    margin-top: var(--space-md);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    background: var(--bg-secondary);
  }

  .transpose-label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .transpose-controls {
    margin-top: var(--space-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .stepper {
    width: 44px;
    height: 44px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1.35rem;
    line-height: 1;
    cursor: pointer;
  }

  .stepper:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: var(--focus-ring-soft);
  }

  .transpose-value {
    min-width: 64px;
    text-align: center;
    font-weight: 700;
    font-size: 1.35rem;
    font-variant-numeric: tabular-nums;
  }

  .transpose-note {
    margin-top: var(--space-sm);
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.82rem;
  }

  .dialog-actions {
    margin-top: var(--space-md);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }
</style>
