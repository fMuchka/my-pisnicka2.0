<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { TreeView, createTreeCollection } from '@ark-ui/vue/tree-view';
  import {
    ChevronsDownUp,
    ChevronsUpDown,
    ChevronRight,
    Folder,
    FolderOpen,
    Music2,
  } from 'lucide-vue-next';
  import type { Song } from '../../../lib/song';

  type SongTreeNode = {
    id: string;
    name: string;
    children?: SongTreeNode[];
  };

  const props = withDefaults(
    defineProps<{
      songs: Song[];
      artistsLabel: string;
      autoExpandOnFilter?: boolean;
      onSongClick: (song: Song) => void;
      isInteractive: boolean;
    }>(),
    {
      autoExpandOnFilter: false,
    }
  );

  const groupedSongs = computed(() => {
    const groups = new Map<string, Song[]>();

    for (const song of props.songs) {
      const artistSongs = groups.get(song.artist);
      if (artistSongs) {
        artistSongs.push(song);
      } else {
        groups.set(song.artist, [song]);
      }
    }

    return Array.from(groups, ([artist, songs]) => ({ artist, songs }));
  });

  const collection = computed(() => {
    return createTreeCollection<SongTreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: {
        id: 'ROOT',
        name: 'Songs',
        children: groupedSongs.value.map((artistGroup) => ({
          id: `artist:${artistGroup.artist}`,
          name: artistGroup.artist,
          children: artistGroup.songs.map((song) => ({
            id: `song:${song.id}`,
            name: song.title,
          })),
        })),
      },
    });
  });

  const artistNodes = computed(() => {
    return collection.value.rootNode.children ?? [];
  });

  const expandedValue = ref<string[]>([]);

  const artistNodeIds = computed(() => artistNodes.value.map((node) => node.id));

  watch(
    [artistNodeIds, () => props.autoExpandOnFilter],
    ([ids, autoExpandOnFilter]) => {
      if (autoExpandOnFilter) {
        expandedValue.value = ids;
      }
    },
    { immediate: true }
  );

  const songsByNodeId = computed(() => {
    return new Map<string, Song>(
      props.songs.map((song): [string, Song] => [`song:${song.id}`, song])
    );
  });

  const allExpanded = computed(
    () =>
      artistNodeIds.value.length > 0 &&
      artistNodeIds.value.every((id) => expandedValue.value.includes(id))
  );

  const expandAll = (): void => {
    expandedValue.value = artistNodeIds.value;
  };

  const collapseAll = (): void => {
    expandedValue.value = [];
  };

  const handleSongNodeClick = (songNodeId: string) => {
    const song = songsByNodeId.value.get(songNodeId);
    if (!song) {
      return;
    }

    props.onSongClick(song);
  };
</script>

<template>
  <TreeView.Root
    v-model:expanded-value="expandedValue"
    :collection="collection"
    class="song-list__tree"
  >
    <div class="song-list__tree-header">
      <TreeView.Label class="song-list__tree-label">{{ artistsLabel }}</TreeView.Label>
      <div
        v-if="artistNodes.length > 0"
        class="song-list__tree-controls"
      >
        <button
          type="button"
          class="song-list__tree-control-btn"
          :disabled="allExpanded"
          aria-label="Rozbalit vše"
          @click="expandAll"
        >
          <ChevronsUpDown :size="14" />
          Rozbalit
        </button>
        <button
          type="button"
          class="song-list__tree-control-btn"
          :disabled="!allExpanded"
          aria-label="Sbalit vše"
          @click="collapseAll"
        >
          <ChevronsDownUp :size="14" />
          Sbalit
        </button>
      </div>
    </div>
    <TreeView.Tree class="song-list__tree-root song-list__list-reset">
      <TreeView.NodeProvider
        v-for="(artistNode, artistIndex) in artistNodes"
        :key="artistNode.id"
        :node="artistNode"
        :index-path="[artistIndex]"
      >
        <TreeView.NodeContext v-slot="nodeState">
          <TreeView.Branch class="song-list__branch">
            <TreeView.BranchControl class="song-list__branch-control">
              <TreeView.BranchIndicator class="song-list__branch-indicator">
                <ChevronRight />
              </TreeView.BranchIndicator>
              <TreeView.BranchText class="song-list__branch-text">
                <FolderOpen v-if="nodeState.expanded" />
                <Folder v-else />
                {{ artistNode.name }}
              </TreeView.BranchText>
            </TreeView.BranchControl>

            <TreeView.BranchContent class="song-list__branch-content">
              <TreeView.BranchIndentGuide class="song-list__branch-guide" />

              <TreeView.NodeProvider
                v-for="(songNode, songIndex) in artistNode.children"
                :key="songNode.id"
                :node="songNode"
                :index-path="[artistIndex, songIndex]"
              >
                <TreeView.Item
                  class="song-list__tree-item"
                  :class="{ 'song-list__tree-item--readonly': !props.isInteractive }"
                  :aria-disabled="!props.isInteractive"
                  @click="handleSongNodeClick(songNode.id)"
                >
                  <TreeView.ItemText class="song-list__tree-item-text">
                    <Music2 />
                    {{ songNode.name }}
                  </TreeView.ItemText>
                </TreeView.Item>
              </TreeView.NodeProvider>
            </TreeView.BranchContent>
          </TreeView.Branch>
        </TreeView.NodeContext>
      </TreeView.NodeProvider>
    </TreeView.Tree>
  </TreeView.Root>
</template>

<style scoped>
  @import '../SongListShared.css';

  .song-list__tree {
    --tree-item-gap: 0.45rem;
    --tree-indentation: 1rem;
    --tree-padding-inline: 0.65rem;
    --tree-padding-block: 0.35rem;
    --tree-icon-size: 1rem;

    display: grid;
    gap: var(--space-xs);
  }

  .song-list__tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .song-list__tree-label {
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
  }

  .song-list__tree-controls {
    display: flex;
    gap: 2px;
  }

  .song-list__tree-control-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .song-list__tree-control-btn:hover:not(:disabled) {
    color: var(--text-primary);
    background-color: color-mix(in srgb, var(--text-primary) 8%, transparent);
  }

  .song-list__tree-control-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .song-list__tree-control-btn:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: 1px;
  }

  .song-list__tree-root {
    display: grid;
    gap: 2px;
    font-size: 0.95rem;
  }

  .song-list__branch {
    position: relative;
  }

  .song-list__branch-control,
  .song-list__tree-item {
    display: flex;
    align-items: center;
    gap: var(--tree-item-gap);
    width: 100%;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    text-align: left;
    font: inherit;
    font-size: 20px;
    user-select: none;
    cursor: pointer;

    --tree-depth: calc(var(--depth) - 1);
    --tree-indentation-offset: calc(var(--tree-indentation) * var(--tree-depth));
    --tree-icon-offset: calc(var(--tree-icon-size) * var(--tree-depth) * 0.5);
    --tree-offset: calc(
      var(--tree-padding-inline) + var(--tree-indentation-offset) + var(--tree-icon-offset)
    );

    padding-inline-start: var(--tree-offset);
    padding-inline-end: var(--tree-padding-inline);
    padding-block: var(--tree-padding-block);
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .song-list__tree-item--readonly {
    cursor: default;
  }

  .song-list__branch-control:hover,
  .song-list__tree-item:hover {
    background-color: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    color: var(--text-primary);
  }

  .song-list__branch-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: transform var(--transition-fast);
  }

  .song-list__branch-indicator[data-state='open'] {
    transform: rotate(90deg);
  }

  .song-list__branch-indicator svg,
  .song-list__branch-text svg,
  .song-list__tree-item-text svg {
    width: var(--tree-icon-size);
    height: var(--tree-icon-size);
    flex-shrink: 0;
  }

  .song-list__branch-text,
  .song-list__tree-item-text {
    display: inline-flex;
    align-items: center;
    gap: var(--tree-item-gap);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song-list__branch-text {
    font-weight: 650;
    color: var(--text-primary);
  }

  .song-list__branch-content {
    position: relative;
  }

  .song-list__branch-content[data-state='open'] {
    animation:
      songlist-expand 150ms ease-out,
      songlist-fade-in 150ms ease-out;
  }

  .song-list__branch-content[data-state='closed'] {
    animation:
      songlist-collapse 150ms ease-out,
      songlist-fade-out 150ms ease-out;
  }

  .song-list__branch-guide {
    position: absolute;
    height: 100%;
    width: 1px;
    background: color-mix(in srgb, var(--text-secondary) 25%, transparent);

    --tree-depth: calc(var(--depth) - 1);
    --tree-indentation-offset: calc(var(--tree-indentation) * var(--tree-depth));
    --tree-offset: calc(var(--tree-padding-inline) + var(--tree-indentation-offset));
    --tree-icon-offset: calc(var(--tree-icon-size) * 0.5 * var(--depth));

    inset-inline-start: calc(var(--tree-offset) + var(--tree-icon-offset));
  }

  @keyframes songlist-expand {
    from {
      height: 0;
    }
    to {
      height: var(--height);
    }
  }

  @keyframes songlist-collapse {
    from {
      height: var(--height);
    }
    to {
      height: 0;
    }
  }

  @keyframes songlist-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes songlist-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
