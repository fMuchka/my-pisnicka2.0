<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Accordion } from '@ark-ui/vue/accordion';
  import { ChevronDownIcon } from 'lucide-vue-next';
  import { transposeChord } from '../../lib/chords/chords';
  import ChordChart from '../chord/ChordChart.vue';

  interface Props {
    chords: string[];
    transpose?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    transpose: 0,
  });

  const renderedChords = computed(() =>
    props.chords.map((chord) => transposeChord(chord, props.transpose))
  );

  const openValue = ref<string[]>(['']);
</script>

<template>
  <Accordion.Root
    class="chord-accordion"
    collapsible
    :default-value="openValue"
  >
    <Accordion.Item
      value="chords"
      class="chord-accordion-item"
    >
      <Accordion.ItemTrigger class="chord-accordion-trigger">
        <span class="chord-accordion-label">Akordy</span>
        <Accordion.ItemIndicator class="chord-accordion-indicator">
          <ChevronDownIcon />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent class="chord-accordion-content">
        <div class="song-chord-list">
          <span
            v-for="(chord, index) in renderedChords"
            :key="`${chord}-${index}`"
            class="chord-chart"
          >
            <ChordChart :chord="chord" />
          </span>
        </div>
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion.Root>
</template>

<style scoped>
  .chord-accordion {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .chord-accordion-item {
    display: block;
    border-bottom: 1px solid var(--border-color, color-mix(in srgb, var(--accent) 30%, transparent));
  }

  .chord-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.5rem 0;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }

  .chord-accordion-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chord-accordion-indicator {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-muted);
    transition: rotate 200ms ease;

    &[data-state='open'] {
      rotate: 180deg;
    }

    & svg {
      width: 1rem;
      height: 1rem;
    }
  }

  .chord-accordion-content {
    overflow: hidden;

    &[data-state='open'] {
      animation: slideDown 200ms ease-out;
    }

    &[data-state='closed'] {
      animation: slideUp 200ms ease-out;
    }
  }

  .song-chord-list {
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 0.75rem;
    color: var(--song-chord-inline-color, var(--text-chord));
    border-radius: var(--song-chord-inline-radius, 3px);
    font-family: var(--song-chord-inline-font-family, inherit);
    font-size: var(--song-chord-font-size, var(--song-chord-inline-font-size, 0.95em));
    font-weight: var(--song-chord-font-weight, var(--song-chord-inline-font-weight, 700));
  }

  .chord-chart {
    padding: 1rem;
  }

  @keyframes slideDown {
    from {
      opacity: 0.01;
      height: 0;
    }
    to {
      opacity: 1;
      height: var(--height);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      height: var(--height);
    }
    to {
      opacity: 0.01;
      height: 0;
    }
  }
</style>
