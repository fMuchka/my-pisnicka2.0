<script setup lang="ts">
  import { ArrowRight, Check, ChevronDown, List, Music, Sparkles, Users } from 'lucide-vue-next';
  import IconBackdrop from '../../core/icon-backdrop/IconBackdrop.vue';
  import { getRecentNewChanges } from '../../../lib/timeline/timeline';
  import {
    groupFeaturesByArea,
    type FeatureArea,
  } from '../../../lib/upcoming-features/upcomingFeatures';

  const emit = defineEmits<{
    showHistory: [];
  }>();

  const AREA_ICONS: Record<FeatureArea, typeof Users> = {
    relace: Users,
    pisne: Music,
    seznamy: List,
  };

  const groups = groupFeaturesByArea();
  const recentlyDone = getRecentNewChanges(2);
</script>

<template>
  <div class="roadmap">
    <header class="intro">
      <h2 class="intro-title">Na čem se pracuje</h2>
      <p class="intro-text">
        Pořadí není pevné — co dozraje, to přijde. Hotové věci se stěhují do Historie.
      </p>
    </header>

    <section
      v-for="group in groups"
      :key="group.area ?? 'other'"
      class="area"
    >
      <h3 class="eyebrow">
        <component
          :is="group.area ? AREA_ICONS[group.area] : Sparkles"
          class="eyebrow-icon"
          aria-hidden="true"
        />
        {{ group.label }}
      </h3>

      <ul class="features">
        <li
          v-for="feature in group.features"
          :key="feature.title"
          class="feature"
        >
          <details v-if="feature.details">
            <summary class="feature-row">
              <IconBackdrop aria-hidden="true">
                <component
                  :is="group.area ? AREA_ICONS[group.area] : Sparkles"
                  class="icon-sm"
                />
              </IconBackdrop>
              <span class="feature-heading">
                <span class="feature-title">{{ feature.title }}</span>
                <span
                  v-if="feature.inProgress"
                  class="status"
                >
                  Rozpracováno
                </span>
              </span>
              <ChevronDown
                class="chevron"
                aria-hidden="true"
              />
            </summary>
            <p class="feature-details">{{ feature.details }}</p>
          </details>
          <div
            v-else
            class="feature-row"
          >
            <IconBackdrop aria-hidden="true">
              <component
                :is="group.area ? AREA_ICONS[group.area] : Sparkles"
                class="icon-sm"
              />
            </IconBackdrop>
            <span class="feature-heading">
              <span class="feature-title">{{ feature.title }}</span>
              <span
                v-if="feature.inProgress"
                class="status"
              >
                Rozpracováno
              </span>
            </span>
          </div>
        </li>
      </ul>
    </section>

    <section
      v-if="recentlyDone.length > 0"
      class="done"
    >
      <h3 class="eyebrow">Nedávno hotovo</h3>
      <ul class="done-list">
        <li
          v-for="item in recentlyDone"
          :key="item.text"
          class="done-item"
        >
          <span
            class="done-check"
            aria-hidden="true"
          >
            <Check class="icon-xs" />
          </span>
          <span>
            {{ item.text }}
            <span class="done-date">{{ item.label }}</span>
          </span>
        </li>
      </ul>
      <button
        type="button"
        class="link-button"
        @click="emit('showHistory')"
      >
        Celá historie
        <ArrowRight
          class="icon-sm"
          aria-hidden="true"
        />
      </button>
    </section>

    <p class="outro">Chybí ti tu něco? Řekni to FM.</p>
  </div>
</template>

<style scoped>
  .roadmap {
    display: grid;
    gap: var(--space-lg);
  }

  .intro {
    display: grid;
    gap: var(--space-xs);
  }

  .intro-title {
    font-size: 1.2rem;
    color: var(--ink);
  }

  .intro-text {
    color: var(--ink-muted);
  }

  .area {
    display: grid;
    gap: var(--space-sm);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .eyebrow-icon {
    width: 0.9rem;
    height: 0.9rem;
  }

  .features {
    list-style: none;
    display: grid;
    gap: var(--space-sm);
  }

  .feature {
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-secondary);
    overflow: hidden;
  }

  summary {
    list-style: none;
    cursor: pointer;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .feature-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 56px;
    padding: var(--space-sm) 14px;
  }

  .feature-heading {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px var(--space-sm);
  }

  .feature-title {
    font-weight: 600;
    color: var(--ink);
  }

  .status {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--brand) 45%, var(--border));
    background: color-mix(in srgb, var(--brand) 14%, var(--surface));
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
  }

  .icon-sm {
    width: 1rem;
    height: 1rem;
  }

  .icon-xs {
    width: 0.75rem;
    height: 0.75rem;
  }

  .chevron {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--ink-muted);
    transition: transform var(--transition-fast);
  }

  details[open] .chevron {
    transform: rotate(180deg);
  }

  .feature-details {
    padding: 0 14px 14px calc(14px + 32px + var(--space-sm));
    font-size: 0.9rem;
    color: var(--ink-muted);
  }

  .done {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--text-disabled);
  }

  .done-list {
    list-style: none;
    display: grid;
    gap: var(--space-sm);
  }

  .done-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .done-check {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand) 14%, transparent);
    color: var(--brand);
  }

  .done-date {
    display: block;
    font-size: 0.8rem;
    color: var(--ink-muted);
  }

  .link-button {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .link-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .outro {
    text-align: center;
    font-size: 0.85rem;
    color: var(--ink-muted);
  }
</style>
