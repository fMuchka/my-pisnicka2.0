<script setup lang="ts">
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import {
    ArrowBigLeftDash,
    ArrowBigRightDash,
    Check,
    CirclePlay,
    CirclePause,
    Eye,
    FileType,
    Music2,
    X,
  } from 'lucide-vue-next';

  interface Props {
    mode?: 'view' | 'edit';
    isPlaying?: boolean;
    autoScrollSpeed?: number;
    autoScrollEtaLabel?: string;
    editorMode?: 'source' | 'preview';
    confirmDisabled?: boolean;
  }

  interface Emits {
    (event: 'toggle-play'): void;
    (event: 'step-back'): void;
    (event: 'step-forward'): void;
    (event: 'open-chords'): void;
    (event: 'select-source'): void;
    (event: 'select-preview'): void;
    (event: 'cancel'): void;
    (event: 'confirm'): void;
  }

  withDefaults(defineProps<Props>(), {
    mode: 'view',
    isPlaying: false,
    autoScrollSpeed: 0,
    autoScrollEtaLabel: '0:00',
    editorMode: 'preview',
    confirmDisabled: false,
  });
  const emit = defineEmits<Emits>();
</script>

<template>
  <div class="song-controls-wrap">
    <template v-if="mode === 'view'">
      <p
        class="speed-indicator"
        :class="{ 'speed-indicator--compact': isPlaying }"
        aria-live="polite"
      >
        <span class="speed-indicator__eta">Do konce zbývá {{ autoScrollEtaLabel }}</span>
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

        <Tooltip.Root
          v-if="isPlaying === false"
          :open-delay="300"
        >
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
    </template>

    <div
      v-else
      class="song-controls song-controls--edit"
    >
      <div
        class="editor-mode-segment"
        role="group"
        aria-label="Režim editoru"
      >
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              type="button"
              class="control-button segment-button"
              :class="{ 'segment-button--active': editorMode === 'preview' }"
              aria-label="Náhled"
              @click="emit('select-preview')"
            >
              <Eye :size="22" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Náhled</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              type="button"
              class="control-button segment-button"
              :class="{ 'segment-button--active': editorMode === 'source' }"
              aria-label="Zdroj"
              @click="emit('select-source')"
            >
              <FileType :size="22" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Zdroj</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>
      </div>

      <div class="editor-actions">
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              type="button"
              class="action-button control-button"
              aria-label="Zrušit"
              @click="emit('cancel')"
            >
              <X :size="22" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Zrušit</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              type="button"
              class="action-button action-button--confirm control-button"
              aria-label="Potvrdit"
              :disabled="confirmDisabled"
              @click="emit('confirm')"
            >
              <Check :size="22" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Potvrdit</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>
      </div>
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
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--bg-primary) 92%, transparent);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    box-shadow: var(--shadow-panel);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast),
      padding var(--transition-fast),
      font-size var(--transition-fast);
  }

  .speed-indicator--compact {
    padding: 4px 9px;
    font-size: 12px;
    opacity: 0.82;
    transform: scale(0.96);
  }

  .speed-indicator__eta {
    white-space: nowrap;
  }

  .speed-indicator__meta {
    white-space: nowrap;
    color: var(--text-secondary);
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

  .song-controls--edit {
    gap: 2px;
    align-items: center;
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

  .editor-mode-segment,
  .editor-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .segment-button,
  .action-button {
    flex-shrink: 0;
  }

  .segment-button--active {
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    background: color-mix(in srgb, var(--accent) 18%, var(--bg-secondary));
    color: white;
  }

  .action-button--confirm {
    background: var(--accent);
    color: white;
  }

  .action-button--confirm:hover {
    background: var(--accent-light);
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-button:disabled:hover {
    transform: none;
    background: var(--accent);
  }

  @media (max-width: 560px) {
    .song-controls-wrap {
      max-width: calc(100vw - var(--space-md));
    }

    .speed-indicator {
      max-width: calc(100vw - var(--space-xl));
      font-size: 12px;
    }

    .speed-indicator--compact {
      font-size: 11px;
    }

    .song-controls--edit {
      width: auto;
    }
  }
</style>
