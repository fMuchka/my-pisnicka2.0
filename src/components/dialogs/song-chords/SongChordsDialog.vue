<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Tabs } from '@ark-ui/vue/tabs';
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
  <Dialog.Root
    v-model:open="isOpen"
    lazy-mount
    unmount-on-exit
  >
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

          <Tabs.Root
            class="dialog-tabs"
            default-value="setup"
            lazy-mount
            unmount-on-exit
            aria-label="Nastavení akordů"
          >
            <Tabs.List class="tabs-list">
              <Tabs.Trigger
                class="tabs-trigger"
                value="setup"
              >
                Transpozice
              </Tabs.Trigger>
              <Tabs.Trigger
                class="tabs-trigger"
                value="diagrams"
              >
                Diagramy
              </Tabs.Trigger>
              <Tabs.Indicator class="tabs-indicator" />
            </Tabs.List>

            <div class="dialog-body">
              <Tabs.Content
                class="tabs-content"
                value="setup"
              >
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
              </Tabs.Content>

              <Tabs.Content
                class="tabs-content"
                value="diagrams"
              >
                <section class="diagram-card">
                  <p class="diagram-label">Diagramy akordů</p>
                  <SongChordOverview
                    v-if="chords.length > 0"
                    class="chord-overview"
                    :chords="chords"
                    :transpose="transpose"
                    :show-label="false"
                  />
                  <p
                    v-else
                    class="diagram-empty"
                  >
                    Pro tuto píseň nejsou dostupné žádné akordy.
                  </p>
                </section>
              </Tabs.Content>
            </div>
          </Tabs.Root>

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
    overflow-y: auto;
    padding-right: 2px;
    flex: 1 1 auto;
    min-height: 0;
  }

  .dialog-tabs {
    margin-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    flex: 1 1 auto;
    min-height: 0;
  }

  .tabs-list {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2xs, 0.25rem);
    padding: var(--space-2xs, 0.25rem);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-secondary) 80%, var(--bg-primary));
    border: 1px solid var(--border-primary);
    isolation: isolate;
  }

  .tabs-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    border: none;
    border-radius: calc(var(--radius-sm) - 2px);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.88rem;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .tabs-trigger[data-selected] {
    color: var(--text-primary);
  }

  .tabs-trigger:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .tabs-indicator {
    position: absolute;
    z-index: -1;
    height: calc(100% - var(--space-2xs, 0.25rem) * 2);
    width: var(--width);
    top: var(--space-2xs, 0.25rem);
    left: var(--left);
    border-radius: calc(var(--radius-sm) - 2px);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-primary));
    transition-property: left, width;
    transition-duration: var(--transition-normal);
    transition-timing-function: ease-out;
  }

  .tabs-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    outline: none;
  }

  .transpose-card {
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

  .diagram-card {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    background: var(--bg-secondary);
  }

  .diagram-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .diagram-empty {
    margin-top: var(--space-sm);
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .chord-overview {
    margin-top: var(--space-sm);
  }

  .dialog-content :deep(.chord-grid) {
    margin-top: var(--space-sm);
  }

  .dialog-content :deep(.chord-card) {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
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
