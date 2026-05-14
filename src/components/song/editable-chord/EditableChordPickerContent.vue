<script setup lang="ts">
  import { Tabs } from '@ark-ui/vue/tabs';
  import { CHORD_QUALITIES, CHORD_ROOTS } from '../../../lib/chords/chords.database';
  import ChordChart from '../../chord/ChordChart.vue';

  interface Props {
    usedChords: string[];
    chordPickerTab: 'used' | 'all';
    selectedRoot: (typeof CHORD_ROOTS)[number];
    selectedQuality: (typeof CHORD_QUALITIES)[number];
    quickRoots: (typeof CHORD_ROOTS)[number][];
    selectedChord: string;
  }

  interface Emits {
    (event: 'update:chordPickerTab', value: 'used' | 'all'): void;
    (event: 'update:selectedRoot', value: (typeof CHORD_ROOTS)[number]): void;
    (event: 'update:selectedQuality', value: (typeof CHORD_QUALITIES)[number]): void;
    (event: 'pick', value: string): void;
    (event: 'close'): void;
  }

  defineProps<Props>();
  defineEmits<Emits>();
</script>

<template>
  <div class="chord-picker-popover">
    <div class="chord-picker-header">
      <h3 class="chord-picker-title">Akordy</h3>
      <button
        type="button"
        class="chord-picker-close"
        @click="$emit('close')"
      >
        x
      </button>
    </div>

    <Tabs.Root
      :model-value="chordPickerTab"
      class="chord-picker-tabs"
      @update:model-value="(value) => $emit('update:chordPickerTab', value as 'used' | 'all')"
    >
      <Tabs.List class="chord-picker-tab-list">
        <Tabs.Trigger
          value="used"
          class="chord-picker-tab-trigger"
          :disabled="usedChords.length === 0"
        >
          Použité
        </Tabs.Trigger>
        <Tabs.Trigger
          value="all"
          class="chord-picker-tab-trigger"
        >
          Všechny
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content
        value="used"
        class="chord-picker-tab-content"
      >
        <div class="chord-picker-grid">
          <button
            v-for="chord in usedChords"
            :key="`used-${chord}`"
            type="button"
            class="chord-picker-item"
            @click="$emit('pick', chord)"
          >
            {{ chord }}
          </button>
        </div>
      </Tabs.Content>

      <Tabs.Content
        value="all"
        class="chord-picker-tab-content"
      >
        <div class="chord-all-builder">
          <div class="chord-all-row">
            <div class="chord-all-key-block">
              <span class="chord-all-label">Tónina:</span>
              <div class="chord-all-quick-roots">
                <button
                  v-for="root in quickRoots"
                  :key="`all-quick-${root}`"
                  type="button"
                  class="chord-all-root-btn"
                  :class="{ 'chord-all-root-btn--active': selectedRoot === root }"
                  @click="$emit('update:selectedRoot', root)"
                >
                  {{ root }}
                </button>
              </div>
              <label class="chord-all-more-root">
                Více
                <select
                  :value="selectedRoot"
                  class="chord-all-select"
                  @change="
                    (event) =>
                      $emit(
                        'update:selectedRoot',
                        (event.target as HTMLSelectElement).value as (typeof CHORD_ROOTS)[number]
                      )
                  "
                >
                  <option
                    v-for="root in CHORD_ROOTS"
                    :key="`all-root-${root}`"
                    :value="root"
                  >
                    {{ root }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div class="chord-all-row">
            <label class="chord-all-suffix">
              Druh:
              <select
                :value="selectedQuality"
                class="chord-all-select"
                @change="
                  (event) =>
                    $emit(
                      'update:selectedQuality',
                      (event.target as HTMLSelectElement).value as (typeof CHORD_QUALITIES)[number]
                    )
                "
              >
                <option
                  v-for="quality in CHORD_QUALITIES"
                  :key="`all-quality-${quality || 'dur'}`"
                  :value="quality"
                >
                  {{ quality || 'dur' }}
                </option>
              </select>
            </label>
          </div>

          <div class="chord-all-preview">
            <ChordChart :chord="selectedChord" />
          </div>

          <div class="chord-all-actions">
            <button
              type="button"
              class="chord-all-action-btn chord-all-action-btn--ghost"
              @click="$emit('close')"
            >
              Zrušit
            </button>
            <button
              type="button"
              class="chord-all-action-btn chord-all-action-btn--primary"
              @click="$emit('pick', selectedChord)"
            >
              Ok
            </button>
          </div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </div>
</template>

<style scoped>
  .chord-picker-popover {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(450px, 92vw);
    max-height: min(450px, 70vh);
    padding: 0.5rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-primary) 90%, var(--bg-secondary));
    box-shadow: var(--shadow-panel);
    z-index: 1202;
  }

  .chord-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .chord-picker-title {
    margin: 0;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .chord-picker-close {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .chord-picker-tabs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
  }

  .chord-picker-tab-list {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 12%, transparent);
    padding-bottom: 0.25rem;
  }

  .chord-picker-tab-trigger {
    border: none;
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .chord-picker-tab-trigger:disabled {
    text-decoration: line-through;
  }

  .chord-picker-tab-trigger[data-selected] {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--text-primary);
  }

  .chord-picker-tab-content {
    min-height: 0;
  }

  .chord-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: 0.35rem;
    max-height: min(220px, 42vh);
    overflow-y: auto;
    padding-right: 0.125rem;
  }

  .chord-all-builder {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .chord-all-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .chord-all-key-block {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    width: 100%;
  }

  .chord-all-label {
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-weight: 700;
  }

  .chord-all-quick-roots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    flex: 1;
  }

  .chord-all-root-btn {
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 6px;
    padding: 0.2rem 0.45rem;
    background: color-mix(in srgb, var(--bg-primary) 92%, var(--bg-secondary));
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .chord-all-root-btn--active {
    background: color-mix(in srgb, var(--accent) 26%, transparent);
  }

  .chord-all-more-root,
  .chord-all-suffix {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-weight: 700;
  }

  .chord-all-select {
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--bg-primary) 92%, var(--bg-secondary));
    color: var(--text-primary);
    font-size: 0.82rem;
    padding: 0.2rem 0.4rem;
    min-width: 78px;
  }

  .chord-all-preview {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-self: center;
    scale: 0.75;
    height: 200px;
  }

  .chord-all-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.35rem;
  }

  .chord-all-action-btn {
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
  }

  .chord-all-action-btn--ghost {
    background: transparent;
    color: var(--text-secondary);
  }

  .chord-all-action-btn--primary {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: var(--text-primary);
  }

  .chord-picker-item {
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--bg-primary) 92%, var(--bg-secondary));
    color: var(--text-primary);
    padding: 0.28rem 0.4rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .chord-picker-item:hover {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }
</style>
