<script setup lang="ts">
  import { computed } from 'vue';
  import { ChevronRight, Music2, X } from 'lucide-vue-next';
  import type { Playlist } from '../../lib/playlist';
  import type { Song } from '../../lib/song';

  type PlaylistScope = 'mine' | 'public' | 'host';

  interface Props {
    isSessionGuestView: boolean;
    playlistScope: PlaylistScope;
    canCreatePlaylist: boolean;
    playlistError: string | null;
    isPlaylistLoading: boolean;
    playlists: Playlist[];
    playlistSongCounts: Record<string, number>;
    selectedPlaylistId: string | null;
    selectedPlaylistSongs: Song[];
    canEditSelectedPlaylist: boolean;
    isPlaylistSongLoading: boolean;
    isUpdatingPlaylist: boolean;
  }

  interface Emits {
    (event: 'set-playlist-scope', value: 'mine' | 'public'): void;
    (event: 'open-create-playlist-dialog'): void;
    (event: 'toggle-playlist', value: string): void;
    (event: 'remove-song', value: string): void;
    (event: 'song-click', value: Song): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const playlistsEmptyMessage = computed(() => {
    if (props.isSessionGuestView) {
      return 'Host zatím nemá žádný veřejný playlist.';
    }

    if (props.playlistScope === 'public') {
      return 'Zatím nejsou dostupné veřejné playlisty.';
    }

    return 'Zatím nemáš žádný playlist.';
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

    <p
      v-else-if="playlists.length === 0"
      class="song-list__playlist-note"
    >
      {{ playlistsEmptyMessage }}
    </p>

    <ul
      v-else
      class="song-list__playlist-tree song-list__list-reset"
      role="tree"
    >
      <li
        v-for="playlist in playlists"
        :key="playlist.id"
        class="song-list__playlist-node"
        role="treeitem"
        :aria-expanded="selectedPlaylistId === playlist.id"
      >
        <button
          type="button"
          class="song-list__playlist-row"
          @click="emit('toggle-playlist', playlist.id)"
        >
          <ChevronRight
            :size="16"
            class="song-list__playlist-chevron"
            :class="{ 'song-list__playlist-chevron--open': selectedPlaylistId === playlist.id }"
            aria-hidden="true"
          />
          <span class="song-list__playlist-row-name">{{ playlist.name }}</span>
          <span class="song-list__playlist-badge">
            <Music2
              :size="12"
              aria-hidden="true"
            />
            {{ playlistSongCounts[playlist.id] ?? 0 }}
          </span>
          <span
            v-if="playlist.visibility === 'public'"
            class="song-list__playlist-row-visibility"
          >
            veřejný
          </span>
        </button>

        <div
          v-if="selectedPlaylistId === playlist.id"
          class="song-list__playlist-songs"
        >
          <p
            v-if="isPlaylistSongLoading"
            class="song-list__playlist-note"
          >
            Načítám písně playlistu...
          </p>

          <p
            v-else-if="selectedPlaylistSongs.length === 0"
            class="song-list__playlist-note"
          >
            Playlist je zatím prázdný.
          </p>

          <ul
            v-else
            class="song-list__playlist-song-list song-list__list-reset"
          >
            <li
              v-for="song in selectedPlaylistSongs"
              :key="song.id"
              class="song-list__playlist-song-row"
            >
              <button
                type="button"
                class="song-list__playlist-song-title"
                @click="emit('song-click', song)"
              >
                {{ song.artist }} - {{ song.title }}
              </button>
              <button
                v-if="canEditSelectedPlaylist"
                type="button"
                class="song-list__playlist-song-remove"
                aria-label="Odebrat píseň z playlistu"
                :disabled="isUpdatingPlaylist"
                @click="emit('remove-song', song.id)"
              >
                <X :size="14" />
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
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

  .song-list__list-reset {
    list-style: none;
    margin: 0;
    padding: 0;
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

  .song-list__playlist-tree {
    display: grid;
    gap: 2px;
  }

  .song-list__playlist-node {
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .song-list__playlist-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .song-list__playlist-chevron {
    flex-shrink: 0;
    color: var(--text-secondary);
    transition: transform var(--transition-fast);
  }

  .song-list__playlist-chevron--open {
    transform: rotate(90deg);
  }

  .song-list__playlist-row-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .song-list__playlist-row-visibility {
    color: var(--text-secondary);
    font-size: 0.78rem;
  }

  .song-list__playlist-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-shrink: 0;
    min-width: 28px;
    min-height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .song-list__playlist-badge svg {
    flex-shrink: 0;
  }

  .song-list__playlist-songs {
    display: grid;
    gap: 4px;
    padding: 6px 8px 8px 34px;
    background: color-mix(in srgb, var(--bg-primary) 60%, var(--bg-secondary));
  }

  .song-list__playlist-song-list {
    display: grid;
    gap: 2px;
  }

  .song-list__playlist-song-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .song-list__playlist-song-title {
    flex: 1;
    min-width: 0;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    padding: 8px 6px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song-list__playlist-song-title:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
  }

  .song-list__playlist-song-remove {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--bg-tertiary);
    border-radius: 999px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .song-list__playlist-song-remove:hover {
    color: var(--color-error-dark);
    border-color: color-mix(in srgb, var(--color-error-dark) 55%, var(--bg-tertiary));
  }

  .song-list__playlist-song-remove:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
