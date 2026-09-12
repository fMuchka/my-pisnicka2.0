<script setup lang="ts">
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
    selectedPlaylistId: string | null;
    canEditSelectedPlaylist: boolean;
    availableSongsForPlaylist: Song[];
    playlistSongToAdd: string;
    canAddSongToPlaylist: boolean;
    isAddingPlaylistSong: boolean;
    isPlaylistSongLoading: boolean;
    filteredSongs: Song[];
  }

  interface Emits {
    (event: 'set-playlist-scope', value: 'mine' | 'public'): void;
    (event: 'open-create-playlist-dialog'): void;
    (event: 'set-selected-playlist', value: string): void;
    (event: 'update:playlist-song-to-add', value: string): void;
    (event: 'add-song'): void;
    (event: 'remove-song', value: string): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();
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
      class="song-list__playlist-list"
    >
      <button
        v-for="playlist in playlists"
        :key="playlist.id"
        type="button"
        class="song-list__playlist-item"
        :class="{ 'song-list__playlist-item--active': selectedPlaylistId === playlist.id }"
        @click="emit('set-selected-playlist', playlist.id)"
      >
        <span>{{ playlist.name }}</span>
        <small>{{ playlist.visibility === 'public' ? 'veřejný' : 'soukromý' }}</small>
      </button>
    </div>

    <div
      v-if="canEditSelectedPlaylist && selectedPlaylistId"
      class="song-list__playlist-add"
    >
      <select
        :value="playlistSongToAdd"
        class="song-list__playlist-select"
        aria-label="Přidat globální píseň do playlistu"
        @change="emit('update:playlist-song-to-add', ($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="song in availableSongsForPlaylist"
          :key="song.id"
          :value="song.id"
        >
          {{ song.artist }} - {{ song.title }}
        </option>
      </select>
      <button
        type="button"
        class="song-list__playlist-add-btn"
        :disabled="!canAddSongToPlaylist"
        @click="emit('add-song')"
      >
        {{ isAddingPlaylistSong ? 'Přidávám...' : 'Přidat do playlistu' }}
      </button>
    </div>

    <div
      v-if="isPlaylistSongLoading"
      class="song-list__playlist-note"
    >
      Načítám písně playlistu...
    </div>

    <ul
      v-if="filteredSongs.length > 0 && canEditSelectedPlaylist"
      class="song-list__playlist-song-actions"
    >
      <li
        v-for="song in filteredSongs"
        :key="`remove-${song.id}`"
        class="song-list__playlist-song-actions-item"
      >
        <button
          type="button"
          class="song-list__playlist-remove-btn"
          @click="emit('remove-song', song.id)"
        >
          Odebrat {{ song.artist }} - {{ song.title }}
        </button>
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

  .song-list__playlist-select {
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 8px;
    font: inherit;
  }

  .song-list__playlist-create-btn,
  .song-list__playlist-add-btn,
  .song-list__playlist-remove-btn {
    border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    min-height: 34px;
    padding: 0 10px;
    font: inherit;
    cursor: pointer;
  }

  .song-list__playlist-list {
    display: grid;
    gap: 6px;
  }

  .song-list__playlist-item {
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    text-align: left;
    padding: 8px;
    font: inherit;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .song-list__playlist-item small {
    color: var(--text-secondary);
  }

  .song-list__playlist-item--active {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--bg-tertiary));
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
  }

  .song-list__playlist-add {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-xs);
  }

  .song-list__playlist-song-actions {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }

  .song-list__playlist-song-actions-item {
    display: flex;
  }

  .song-list__playlist-remove-btn {
    width: 100%;
    text-align: left;
  }

  @media (max-width: 560px) {
    .song-list__playlist-add {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
