<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { ChordStyle, SVGuitarChord } from 'svguitar';
  import { useTheme } from '../../composables/useTheme';
  import { getChordFingerPositions } from '../../lib/chords/chords';
  import type { Instrument } from '../../lib/chords/chords.database';

  const props = defineProps<{
    chord: string;
  }>();

  const chartContainer = ref<HTMLElement | null>(null);
  const { preferredInstrument } = useTheme();
  let chart: SVGuitarChord | null = null;

  const getChartSettings = (instrument: Instrument) => {
    if (instrument === 'ukulele') {
      return {
        strings: 4,
        tuning: ['G', 'C', 'E', 'A'],
      };
    }

    return {
      strings: 6,
      tuning: ['e', 'B', 'G', 'D', 'A', 'E'],
    };
  };

  onMounted(() => {
    if (chartContainer.value) {
      chart = new SVGuitarChord(chartContainer.value);

      render();
    }
  });

  const render = () => {
    if (!chart) {
      return;
    }

    const instrument = preferredInstrument.value;

    chart.configure({
      color: 'var(--color-primary)',
      strokeWidth: 2,
      style: ChordStyle.handdrawn,
      ...getChartSettings(instrument),
    });

    const data = getChordFingerPositions(props.chord, preferredInstrument.value);
    if (data) {
      chart.chord(data).draw();
    }
  };

  // Re-render when the chord or selected instrument changes.
  watch([() => props.chord, preferredInstrument], render);
</script>

<template>
  <span class="chord-title">{{ chord }}</span>
  <div
    ref="chartContainer"
    class="chord-canvas"
  ></div>
</template>

<style scoped>
  .chord-canvas {
    padding: 0.5rem;
    width: 200px;
    height: 250px;
    border: 1px solid var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    border-radius: var(--song-chord-inline-radius, 3px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
  }

  .chord-canvas :deep(svg) {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    display: block;
  }

  .chord-title {
    color: var(--song-chord-inline-color, var(--text-chord));
    line-height: 1;
    font-variant-ligatures: none;
    border-radius: var(--song-chord-inline-radius, 3px) var(--song-chord-inline-radius, 3px) 0 0;
    white-space: nowrap;
    vertical-align: baseline;

    align-items: center;
    justify-content: center;
    display: flex;
    padding: 0.25rem;
    background-color: var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
  }

  @media (max-width: 640px) {
    .chord-canvas {
      width: 150px;
      height: 200px;
    }
  }
</style>

<style>
  .chord-canvas > svg > rect.barre.barre-rectangle {
    fill: color-mix(in srgb, var(--color-primary) 50%, transparent 50%);
  }
</style>
