<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { ChordStyle, SVGuitarChord } from 'svguitar';
  import { getChordFingerPositions } from '../../lib/chords/chords';

  const props = defineProps<{
    chord: string;
  }>();

  const chartContainer = ref<HTMLElement | null>(null);
  let chart: SVGuitarChord | null = null;

  onMounted(() => {
    if (chartContainer.value) {
      chart = new SVGuitarChord(chartContainer.value);

      chart.configure({
        color: 'var(--color-primary)',
        strokeWidth: 2,
        style: ChordStyle.handdrawn,
      });

      render();
    }
  });

  const render = () => {
    const data = getChordFingerPositions(props.chord, 'guitar');
    if (chart && data) {
      chart.chord(data).draw();
    }
  };

  // Re-render when the chord prop changes
  watch(() => props.chord, render);
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
    padding-top: 1rem;
    width: 200px;
    height: 250px;
    border: 1px solid var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
    border-radius: var(--song-chord-inline-radius, 3px);
    box-shadow:
      2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white)),
      -2px 0 0 2px var(--song-chord-inline-bg, color-mix(in srgb, var(--accent) 18%, white));
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
