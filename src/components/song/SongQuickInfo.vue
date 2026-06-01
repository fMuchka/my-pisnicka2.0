<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    capo?: number;
    originalKey?: string;
    transpose: number;
  }

  const props = defineProps<Props>();

  const capoLabel = computed(() => {
    if (props.capo == null) {
      return '—';
    }

    return `${props.capo}`;
  });

  const originalKeyLabel = computed(() => {
    const key = props.originalKey?.trim();
    return key && key.length > 0 ? key : '—';
  });

  const transpositionLabel = computed(() => {
    if (props.transpose > 0) {
      return `+${props.transpose}`;
    }

    return `${props.transpose}`;
  });
</script>

<template>
  <section
    class="song-quick-info"
    aria-label="Rychlé informace o písni"
  >
    <div class="info-item">
      <span class="info-label">Capo</span>
      <span class="info-value">{{ capoLabel }}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Tónina</span>
      <span class="info-value">{{ originalKeyLabel }}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Transpozice</span>
      <span class="info-value">{{ transpositionLabel }}</span>
    </div>
  </section>
</template>

<style scoped>
  .song-quick-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-md);
    padding: var(--space-sm) 0 var(--space-md);
    border-bottom: 1px solid var(--border-color, color-mix(in srgb, var(--accent) 30%, transparent));
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs, 0.25rem);
  }

  .info-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .info-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
</style>
