<script setup lang="ts">
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import {
    ArrowBigLeftDash,
    ArrowBigRightDash,
    CirclePlay,
    CirclePause,
    Music2,
  } from 'lucide-vue-next';

  interface Props {
    isPlaying: boolean;
    autoScrollSpeed: number;
  }

  interface Emits {
    (event: 'toggle-play'): void;
    (event: 'step-back'): void;
    (event: 'step-forward'): void;
    (event: 'open-chords'): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();
</script>

<template>
  <div class="song-controls-wrap">
    <p
      v-if="isPlaying"
      class="speed-indicator"
      aria-live="polite"
    >
      Rychlost {{ autoScrollSpeed }} px/s
    </p>

    <div class="song-controls">
      <Tooltip.Root :open-delay="300">
        <Tooltip.Trigger as-child>
          <button
            class="control-button"
            type="button"
            aria-label="Posunout zpět a zpomalit"
            @click="emit('step-back')"
          >
            <ArrowBigLeftDash :size="22" />
          </button>
        </Tooltip.Trigger>
        <Teleport to="body">
          <Tooltip.Positioner>
            <Tooltip.Content class="tooltip-content">Posunout zpět a zpomalit</Tooltip.Content>
          </Tooltip.Positioner>
        </Teleport>
      </Tooltip.Root>

      <Tooltip.Root :open-delay="300">
        <Tooltip.Trigger as-child>
          <button
            class="control-button control-button--play"
            type="button"
            :aria-label="isPlaying ? 'Pozastavit auto-scroll' : 'Spustit auto-scroll'"
            @click="emit('toggle-play')"
          >
            <CirclePause
              v-if="isPlaying"
              :size="24"
            />
            <CirclePlay
              v-else
              :size="24"
            />
          </button>
        </Tooltip.Trigger>
        <Teleport to="body">
          <Tooltip.Positioner>
            <Tooltip.Content class="tooltip-content">
              {{ isPlaying ? 'Pozastavit auto-scroll' : 'Spustit auto-scroll' }}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Teleport>
      </Tooltip.Root>

      <Tooltip.Root :open-delay="300">
        <Tooltip.Trigger as-child>
          <button
            class="control-button"
            type="button"
            aria-label="Posunout vpřed a zrychlit"
            @click="emit('step-forward')"
          >
            <ArrowBigRightDash :size="22" />
          </button>
        </Tooltip.Trigger>
        <Teleport to="body">
          <Tooltip.Positioner>
            <Tooltip.Content class="tooltip-content">Posunout vpřed a zrychlit</Tooltip.Content>
          </Tooltip.Positioner>
        </Teleport>
      </Tooltip.Root>

      <Tooltip.Root :open-delay="300">
        <Tooltip.Trigger as-child>
          <button
            class="control-button"
            type="button"
            aria-label="Nastavení akordů"
            @click="emit('open-chords')"
          >
            <Music2 :size="22" />
          </button>
        </Tooltip.Trigger>
        <Teleport to="body">
          <Tooltip.Positioner>
            <Tooltip.Content class="tooltip-content">Nastavení akordů</Tooltip.Content>
          </Tooltip.Positioner>
        </Teleport>
      </Tooltip.Root>
    </div>
  </div>
</template>

<style scoped>
  .song-controls-wrap {
    position: fixed;
    left: 50%;
    bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 30;
    width: fit-content;
    max-width: calc(100vw - var(--space-lg));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .speed-indicator {
    margin: 0;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--bg-primary) 92%, transparent);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    box-shadow: var(--shadow-panel);
    position: relative;
    left: -20px;
  }

  .song-controls {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border: 1px solid color-mix(in srgb, var(--accent) 20%, var(--bg-tertiary));
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
    backdrop-filter: blur(8px);
    box-shadow: var(--shadow-panel);
  }

  .control-button {
    width: 5em;
    height: 5em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 10px;
    background: color-mix(in srgb, var(--bg-secondary) 92%, transparent);
    color: var(--text-primary);
    cursor: pointer;
    transition:
      transform var(--transition-fast),
      background-color var(--transition-fast),
      color var(--transition-fast);
  }

  .control-button:hover {
    background: color-mix(in srgb, var(--bg-tertiary) 90%, transparent);
    transform: translateY(-1px);
  }

  .control-button:active {
    transform: translateY(0);
  }

  .control-button:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: var(--focus-ring-soft);
  }

  .control-button--play {
    color: white;
    background: var(--accent);
  }

  .control-button--play:hover {
    background: var(--accent-light);
  }

  .tooltip-content {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    box-shadow: var(--shadow-soft);
    z-index: 1000;
  }

  @media (max-width: 560px) {
    .song-controls-wrap {
      max-width: calc(100vw - var(--space-md));
    }
  }
</style>
