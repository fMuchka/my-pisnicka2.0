<script setup lang="ts">
  import { ref } from 'vue';
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import { AudioLines, Share2 } from 'lucide-vue-next';
  import ShareSessionDialog from '../dialogs/share-session/ShareSessionDialog.vue';
  import { fetchActiveSongId } from '../../lib/session';
  import { fetchSongById } from '../../lib/song';
  import type { PIN } from '../../lib/pin';

  interface Props {
    sessionId: string;
    pin: PIN;
    currentUrl: string;
  }

  interface Emits {
    (event: 'filter-song', value: string): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const isShareDialogOpen = ref(false);

  const isNowPlayingLoading = ref(false);

  const fetchNowPlaying = async () => {
    isNowPlayingLoading.value = true;

    try {
      const songId = await fetchActiveSongId(props.sessionId);

      if (!songId) {
        return;
      }

      const song = await fetchSongById(songId);

      if (!song) {
        return;
      }

      emit('filter-song', `artist:${song.artist}&&title:${song.title}`);
    } finally {
      isNowPlayingLoading.value = false;
    }
  };
</script>

<template>
  <Teleport to="body">
    <div class="session-controls-wrap">
      <p
        v-if="isNowPlayingLoading"
        class="speed-indicator"
        aria-live="polite"
      >
        Načítám právě hranou píseň…
      </p>

      <div class="session-controls">
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              class="control-button what-is-playing"
              type="button"
              :disabled="isNowPlayingLoading"
              :aria-label="isNowPlayingLoading ? 'Načítám…' : 'Co to hraje?'"
              @click="fetchNowPlaying"
            >
              <AudioLines :size="20" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Co to hraje?</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <button
              class="control-button"
              type="button"
              aria-label="Sdílet relaci"
              @click="isShareDialogOpen = true"
            >
              <Share2 :size="20" />
            </button>
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Sdílet relaci</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>
      </div>
    </div>
  </Teleport>

  <ShareSessionDialog
    v-model:open="isShareDialogOpen"
    :pin="pin"
    :current-url="currentUrl"
  />
</template>

<style scoped>
  .session-controls-wrap {
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
    white-space: nowrap;
  }

  .session-controls {
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

  .control-button.what-is-playing {
    color: white;
    background: var(--accent);
  }

  .control-button.what-is-playing:hover {
    background: var(--accent-light);
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

  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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
    .session-controls-wrap {
      max-width: calc(100vw - var(--space-md));
    }

    .speed-indicator {
      max-width: calc(100vw - var(--space-xl));
      font-size: 12px;
    }
  }
</style>
