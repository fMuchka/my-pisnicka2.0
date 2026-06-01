<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Accordion } from '@ark-ui/vue/accordion';
  import { computed } from 'vue';
  import Button from '../../core/Button.vue';
  import SongChordOverview from '../../song/SongChordOverview.vue';
  import { transposeChord } from '../../../lib/chords/chords';

  interface Props {
    open: boolean;
    chords: string[];
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

  const transposedChords = computed(() =>
    props.chords.map((chord) => transposeChord(chord, props.transpose))
  );

  const transposedChordLabel = computed(() => {
    if (transposedChords.value.length === 0) {
      return '—';
    }

    return transposedChords.value.join(', ');
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
      <Dialog.Backdrop
        class="dialog-backdrop"
        @click="isOpen = false"
      />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content class="dialog-content">
          <Dialog.Title class="dialog-title">Nastavení akordů</Dialog.Title>
          <Dialog.Description class="dialog-description">
            Upravte transpozici akordů pro aktuální zobrazení písně.
          </Dialog.Description>

          <div class="dialog-body">
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

            <div class="chord-row">
              <span class="chord-row-label">Aktuální akordy</span>
              <span class="chord-row-value">{{ transposedChordLabel }}</span>
            </div>

            <Accordion.Root
              v-if="chords.length > 0"
              class="chord-accordion"
              collapsible
              :default-value="[]"
            >
              <Accordion.Item value="diagrams">
                <Accordion.ItemTrigger class="chord-accordion-trigger">
                  <span class="chord-accordion-label">Diagramy akordů</span>
                  <Accordion.ItemIndicator class="chord-accordion-indicator">
                    +
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent class="chord-accordion-content">
                  <SongChordOverview
                    class="chord-overview"
                    :chords="chords"
                    :transpose="transpose"
                    :show-label="false"
                  />
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          </div>

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
                @click="isOpen = false"
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
    z-index: 999;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 1000;
    pointer-events: none;
  }

  .dialog-content {
    width: min(92vw, 380px);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-md);
    max-height: min(90vh, 720px);
    display: flex;
    flex-direction: column;
    position: relative;
    pointer-events: auto;
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

  .dialog-body {
    margin-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    overflow-y: auto;
    padding-right: 2px;
    flex: 1 1 auto;
    min-height: 0;
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

  .chord-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs, 0.25rem);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
  }

  .chord-row-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .chord-row-value {
    font-size: 0.9rem;
    color: var(--text-primary);
    word-break: break-word;
  }

  .chord-accordion {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .chord-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .chord-accordion-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .chord-accordion-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .chord-accordion-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
    font-weight: 700;
    transition: transform 200ms ease;
  }

  .chord-accordion-indicator[data-state='open'] {
    transform: rotate(45deg);
  }

  .chord-accordion-content {
    overflow: hidden;
  }

  .chord-overview {
    padding: var(--space-sm) var(--space-md) var(--space-md);
  }

  .dialog-content :deep(.chord-chart) {
    padding: 0.5rem;
  }

  .dialog-content :deep(.chord-canvas) {
    width: 140px;
    height: 180px;
  }

  @media (max-width: 480px) {
    .dialog-content {
      max-height: 92vh;
    }

    .dialog-content :deep(.chord-canvas) {
      width: 120px;
      height: 160px;
    }
  }

  .dialog-actions {
    margin-top: var(--space-md);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }
</style>
