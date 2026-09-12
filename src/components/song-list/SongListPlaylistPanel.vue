<script setup lang="ts">
  import { computed } from 'vue';
  import { Select, createListCollection } from '@ark-ui/vue/select';
  import { ChevronsUpDown, Music2 } from 'lucide-vue-next';
  import type { Playlist } from '../../lib/playlist';

  type PlaylistScope = 'mine' | 'public' | 'host';
  type PlaylistOption = {
    label: string;
    value: string;
    count: number;
    visibility: Playlist['visibility'];
  };

  interface Props {
    isSessionGuestView: boolean;
    playlistScope: PlaylistScope;
    canCreatePlaylist: boolean;
    playlistError: string | null;
    isPlaylistLoading: boolean;
    playlists: Playlist[];
    playlistSongCounts: Record<string, number>;
    selectedPlaylistId: string | null;
    isPlaylistSongLoading: boolean;
  }

  interface Emits {
    (event: 'set-playlist-scope', value: 'mine' | 'public'): void;
    (event: 'open-create-playlist-dialog'): void;
    (event: 'set-selected-playlist', value: string): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const playlistCollection = computed(() =>
    createListCollection<PlaylistOption>({
      items: props.playlists.map((playlist) => ({
        label: playlist.name,
        value: playlist.id,
        count: props.playlistSongCounts[playlist.id] ?? 0,
        visibility: playlist.visibility,
      })),
    })
  );

  const selectedPlaylistValue = computed({
    get: () => (props.selectedPlaylistId ? [props.selectedPlaylistId] : []),
    set: (value: string[]) => {
      const nextValue = value[0];

      if (nextValue !== undefined) {
        emit('set-selected-playlist', nextValue);
      }
    },
  });

  const selectedPlaylistItem = computed(() => {
    const currentId = props.selectedPlaylistId;

    if (!currentId) {
      return null;
    }

    return playlistCollection.value.items.find((item) => item.value === currentId) ?? null;
  });
</script>

<template>
  <section class="song-list__playlist-panel">
    <p
      v-if="isSessionGuestView"
      class="song-list__playlist-note"
    >
      V relaci vidíš pouze veřejné playlisty hosta.
    </p>

    <div
      v-else
      class="song-list__playlist-scope"
      role="group"
      aria-label="Rozsah playlistů"
    >
      <button
        type="button"
        class="song-list__playlist-scope-btn"
        :class="{ 'song-list__playlist-scope-btn--active': playlistScope === 'mine' }"
        @click="emit('set-playlist-scope', 'mine')"
      >
        Moje
      </button>
      <button
        type="button"
        class="song-list__playlist-scope-btn"
        :class="{ 'song-list__playlist-scope-btn--active': playlistScope === 'public' }"
        @click="emit('set-playlist-scope', 'public')"
      >
        Veřejné
      </button>
    </div>

    <div
      v-if="canCreatePlaylist"
      class="song-list__playlist-create"
    >
      <button
        type="button"
        class="song-list__playlist-create-btn"
        @click="emit('open-create-playlist-dialog')"
      >
        Vytvořit playlist
      </button>
    </div>

    <div
      v-if="playlistError"
      class="song-list__playlist-error"
      role="alert"
    >
      {{ playlistError }}
    </div>

    <div
      v-if="isPlaylistLoading"
      class="song-list__playlist-note"
    >
      Načítám playlisty...
    </div>

    <div
      v-else-if="playlists.length > 0"
      class="song-list__playlist-select-row"
    >
      <Select.Root
        v-model="selectedPlaylistValue"
        :collection="playlistCollection"
        class="song-list__playlist-select-root"
      >
        <Select.Label class="song-list__playlist-select-label">Playlist</Select.Label>
        <Select.Control class="song-list__playlist-select-control">
          <Select.Trigger
            data-testid="playlist-select-trigger"
            class="song-list__playlist-select-trigger"
            aria-label="Vybraný playlist"
          >
            <div
              v-if="selectedPlaylistItem"
              class="song-list__playlist-trigger-value"
            >
              <span class="song-list__playlist-trigger-label">{{
                selectedPlaylistItem.label
              }}</span>
              <span class="song-list__playlist-option-badge">
                <Music2
                  :size="12"
                  aria-hidden="true"
                />
                {{ selectedPlaylistItem.count }}
              </span>
            </div>
            <Select.ValueText
              v-else
              class="song-list__playlist-trigger-placeholder"
              placeholder="Vybrat playlist"
            />
          </Select.Trigger>
          <Select.Indicator class="song-list__playlist-select-indicator">
            <ChevronsUpDown :size="16" />
          </Select.Indicator>
        </Select.Control>

        <Teleport to="body">
          <Select.Positioner>
            <Select.Content class="song-list__playlist-select-content">
              <Select.Item
                v-for="item in playlistCollection.items"
                :key="item.value"
                :item="item"
                class="song-list__playlist-option"
              >
                <div class="song-list__playlist-option-main">
                  <Select.ItemText class="song-list__playlist-option-label">
                    {{ item.label }}
                  </Select.ItemText>
                  <span class="song-list__playlist-option-badge">
                    <Music2
                      :size="12"
                      aria-hidden="true"
                    />
                    {{ item.count }}
                  </span>
                </div>
                <div class="song-list__playlist-option-meta">
                  <span class="song-list__playlist-option-visibility">
                    {{ item.visibility === 'public' ? 'veřejný' : 'soukromý' }}
                  </span>
                </div>
              </Select.Item>
            </Select.Content>
          </Select.Positioner>
        </Teleport>

        <Select.HiddenSelect />
      </Select.Root>
    </div>

    <div
      v-if="isPlaylistSongLoading"
      class="song-list__playlist-note"
    >
      Načítám písně playlistu...
    </div>
  </section>
</template>

<style scoped>
  .song-list__playlist-panel {
    display: grid;
    gap: var(--space-sm);
    border: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-secondary) 75%, var(--bg-primary));
    padding: var(--space-sm);
  }

  .song-list__playlist-note {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .song-list__playlist-error {
    color: var(--color-error-dark);
    background: var(--color-error-light);
    border-radius: var(--radius-sm);
    padding: 6px 8px;
    font-size: 0.85rem;
  }

  .song-list__playlist-scope {
    display: inline-flex;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .song-list__playlist-scope-btn {
    border: none;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 6px 10px;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .song-list__playlist-scope-btn--active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }

  .song-list__playlist-create {
    display: flex;
  }

  .song-list__playlist-create-btn {
    border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 10px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__playlist-select-row {
    display: grid;
  }

  .song-list__playlist-select-root {
    display: grid;
    gap: 4px;
  }

  .song-list__playlist-select-label {
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .song-list__playlist-select-control {
    position: relative;
  }

  .song-list__playlist-select-trigger {
    width: 100%;
    min-height: 38px;
    padding: 0 38px 0 10px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }

  .song-list__playlist-select-trigger[data-placeholder-shown] {
    color: var(--text-secondary);
  }

  .song-list__playlist-select-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 1px;
  }

  .song-list__playlist-select-indicator {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .song-list__playlist-trigger-value {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .song-list__playlist-trigger-label,
  .song-list__playlist-trigger-placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song-list__playlist-select-content {
    min-width: var(--reference-width);
    max-height: min(var(--available-height, 300px), 300px);
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    box-shadow: var(--shadow-panel);
    z-index: 30;
  }

  .song-list__playlist-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: pointer;
  }

  .song-list__playlist-option[data-highlighted] {
    background: color-mix(in srgb, var(--text-primary) 7%, transparent);
  }

  .song-list__playlist-option[data-state='checked'] {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .song-list__playlist-option-main,
  .song-list__playlist-option-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .song-list__playlist-option-label {
    font-weight: 600;
  }

  .song-list__playlist-option-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 28px;
    min-height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .song-list__playlist-option-badge svg {
    flex-shrink: 0;
  }

  .song-list__playlist-option-visibility {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
</style>
