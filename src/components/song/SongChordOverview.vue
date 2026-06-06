<script setup lang="ts">
  import { computed } from 'vue';
  import { transposeChord } from '../../lib/chords/chords';
  import ChordChart from '../chord/ChordChart.vue';

  interface Props {
    chords: string[];
    transpose?: number;
    showLabel?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    transpose: 0,
    showLabel: true,
  });

  const renderedChords = computed(() =>
    props.chords.map((chord) => transposeChord(chord, props.transpose))
  );
</script>

<template>
  <section class="chord-overview">
    <p
      v-if="showLabel"
      class="chord-overview-label"
    >
      Akordy
    </p>
    <div class="song-chord-list">
      <span
        v-for="(chord, index) in renderedChords"
        :key="`${chord}-${index}`"
        class="chord-chart"
      >
        <ChordChart :chord="chord" />
      </span>
    </div>
  </section>
</template>

<style scoped>
  .chord-overview {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .chord-overview-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
</style>
