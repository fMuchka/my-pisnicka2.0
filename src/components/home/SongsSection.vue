<script setup lang="ts">
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import { Plus } from 'lucide-vue-next';
  import Button from '../core/Button.vue';
  import ErrorMessage from '../core/ErrorMessage.vue';
  import LoadingSpinner from '../core/LoadingSpinner.vue';
  import type { Song } from '../../lib/song';

  interface SongsSectionProps {
    displaySongs: { [key: string]: Song[] };
    songsError: string | null;
    loadingSection: 'sessions' | 'songs' | null;
    openCreateSongDialog: () => void;
    openSong: (song: Song) => void;
  }

  const props = defineProps<SongsSectionProps>();
</script>

<template>
  <section
    class="content-section"
    data-testid="home-songs-section"
  >
    <div class="section-header">
      <h2 class="section-title">Písničky</h2>
      <div class="header-actions">
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <Button
              class="action-btn"
              aria-label="Vytvořit novou píseň"
              :icon="{ position: 'prepend', component: Plus }"
              type="button"
              @click="props.openCreateSongDialog"
            />
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content">Vytvořit novou píseň</Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>
        <Button
          class="view-all-link"
          aria-label="Zobrazit všechny písně"
          color-variation="Primary"
          :label="'Zobrazit všechny písně'"
        />
      </div>
    </div>

    <LoadingSpinner
      v-if="props.loadingSection === 'songs'"
      label="Načítání písní..."
    />

    <ErrorMessage
      v-else-if="props.songsError"
      :message="props.songsError"
    />

    <div
      v-else
      class="song-tree"
    >
      <div
        v-for="(item, key) of props.displaySongs"
        :key="key"
        role="list"
        class="artist-group"
      >
        <div class="artist-name">{{ key }}</div>
        <div class="songs-in-artist">
          <Button
            v-for="song in item"
            :key="song.id"
            type="button"
            role="listitem"
            class="song-item"
            :label="song.title"
            @click="props.openSong(song)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  @import './section-common.css';

  .song-tree {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .artist-group {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    transition: all 150ms ease;
  }

  .artist-group:hover {
    background-color: var(--bg-tertiary);
  }

  .artist-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    padding: var(--space-sm) 0;
    cursor: pointer;
    transition: opacity 150ms ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .artist-name:hover {
    opacity: 0.8;
  }

  .artist-name::before {
    content: '❯ ';
    margin-right: var(--space-xs);
  }

  .songs-in-artist {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-left: var(--space-sm);
  }

  .song-item {
    font-size: 14px;
    color: var(--text-primary);
    padding: var(--space-xs) var(--space-sm);
    cursor: pointer;
    transition: color 150ms ease;
    text-decoration: none;
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    font-family: inherit;
  }

  .song-item:hover {
    color: var(--accent);
  }

  .song-item:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
</style>
