<script setup lang="ts">
  import { Bell, ChevronDown, ExternalLink, Flag, Plus, TrendingUp, Wrench } from 'lucide-vue-next';
  import { computed } from 'vue';
  import {
    formatChangeCount,
    getTimelineEntries,
    getUnseenReleaseDates,
    groupChangesByType,
    summarizeChanges,
    type ChangeType,
  } from '../../lib/timeline/timeline';

  const props = defineProps<{
    lastVisited: string | null;
  }>();

  const GROUP_ICONS: Record<ChangeType, typeof Plus> = {
    new: Plus,
    improved: TrendingUp,
    fix: Wrench,
  };

  const entries = getTimelineEntries();
  const unseenDates = computed(() => getUnseenReleaseDates(props.lastVisited, entries));

  const unseenCount = computed(() =>
    entries.reduce(
      (count, entry) =>
        entry.kind === 'release' && unseenDates.value.has(entry.date)
          ? count + entry.changes.length
          : count,
      0
    )
  );
</script>

<template>
  <div class="history">
    <div
      v-if="unseenCount > 0"
      class="unseen-banner"
    >
      <span
        class="icon-backdrop"
        aria-hidden="true"
      >
        <Bell class="icon-sm" />
      </span>
      <span class="unseen-text">
        <strong>{{ formatChangeCount(unseenCount) }} od tvé poslední návštěvy</strong>
        <span>Nové věci mají štítek Nové. Klepni na změnu pro detail.</span>
      </span>
    </div>

    <ol class="timeline">
      <li
        v-for="(entry, index) in entries"
        :key="entry.date"
        class="timeline-item"
      >
        <span
          class="timeline-dot"
          :class="{
            'timeline-dot--latest': index === 0,
            'timeline-dot--milestone': entry.kind === 'milestone',
          }"
          aria-hidden="true"
        ></span>

        <details
          v-if="entry.kind === 'release'"
          class="release"
          :open="index === 0"
        >
          <summary class="release-summary">
            <span class="release-heading">
              <span class="release-date">
                {{ entry.label }}
                <span
                  v-if="unseenDates.has(entry.date)"
                  class="badge-new"
                >
                  Nové
                </span>
              </span>
              <span
                v-if="entry.title"
                class="release-title"
              >
                {{ entry.title }}
              </span>
              <span class="release-meta">{{ summarizeChanges(entry.changes) }}</span>
            </span>
            <ChevronDown
              class="chevron"
              aria-hidden="true"
            />
          </summary>

          <div class="release-body">
            <section
              v-for="group in groupChangesByType(entry.changes)"
              :key="group.type ?? 'other'"
            >
              <h3
                v-if="group.type && group.label"
                class="group-title"
                :class="`group-title--${group.type}`"
              >
                <component
                  :is="GROUP_ICONS[group.type]"
                  class="group-icon"
                  aria-hidden="true"
                />
                <span>{{ group.label }}</span>
                <span class="group-count">{{ group.changes.length }}</span>
              </h3>

              <ul class="changes">
                <li
                  v-for="change in group.changes"
                  :key="change.text"
                >
                  <details
                    v-if="change.details"
                    class="change"
                  >
                    <summary class="change-row">
                      <span
                        class="bullet"
                        :class="{ 'bullet--new': change.type === 'new' }"
                        aria-hidden="true"
                      ></span>
                      <span>{{ change.text }}</span>
                      <ChevronDown
                        class="chevron chevron--sm"
                        aria-hidden="true"
                      />
                    </summary>
                    <p class="change-details">{{ change.details }}</p>
                  </details>
                  <div
                    v-else
                    class="change-row change-row--plain"
                  >
                    <span
                      class="bullet"
                      :class="{ 'bullet--new': change.type === 'new' }"
                      aria-hidden="true"
                    ></span>
                    <span>{{ change.text }}</span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </details>

        <article
          v-else
          class="milestone"
        >
          <span
            class="icon-backdrop"
            aria-hidden="true"
          >
            <Flag class="icon-sm" />
          </span>
          <div class="milestone-content">
            <span class="release-date">{{ entry.label }} · Milník</span>
            <h3 class="release-title">{{ entry.title }}</h3>
            <p class="milestone-text">{{ entry.text }}</p>
            <a
              v-if="entry.link"
              class="milestone-link"
              :href="entry.link"
              target="_blank"
              rel="noopener"
            >
              Otevřít
              <ExternalLink
                class="icon-xs"
                aria-hidden="true"
              />
            </a>
          </div>
        </article>
      </li>
    </ol>
  </div>
</template>

<style scoped>
  .history {
    display: grid;
    gap: var(--space-md);
  }

  .unseen-banner {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border-primary));
  }

  .unseen-text {
    display: grid;
    gap: 2px;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .unseen-text strong {
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .icon-backdrop {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
  }

  .icon-sm {
    width: 1rem;
    height: 1rem;
  }

  .icon-xs {
    width: 0.85rem;
    height: 0.85rem;
  }

  .timeline {
    position: relative;
    list-style: none;
    display: grid;
    gap: var(--space-sm);
    padding-left: 22px;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 14px;
    bottom: 14px;
    width: 2px;
    border-radius: 2px;
    background: var(--border-primary);
  }

  .timeline-item {
    position: relative;
  }

  .timeline-dot {
    position: absolute;
    left: -21px;
    top: 20px;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--bg-primary);
    border: 2px solid var(--text-disabled);
  }

  .timeline-dot--latest {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .timeline-dot--milestone {
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-primary));
    border-color: var(--accent);
  }

  .release {
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
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

  .release-summary {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 44px;
    padding: var(--space-sm) var(--space-md);
  }

  .release-heading {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .release-date {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .release-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .release-meta {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .badge-new {
    border-radius: 999px;
    /* Plain --accent under white text drops below 4.5:1 in dark theme. */
    background: color-mix(in srgb, var(--accent) 85%, black);
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
    padding: 0.22rem 0.45rem;
    text-transform: uppercase;
  }

  .chevron {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--text-secondary);
    transition: transform var(--transition-fast);
  }

  .chevron--sm {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 1px;
  }

  details[open] > summary > .chevron {
    transform: rotate(180deg);
  }

  .release-body {
    --group-icon-size: 0.9rem;
    --group-icon-gap: 6px;

    display: grid;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-md) var(--space-sm);
    border-top: 1px solid var(--border-primary);
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: var(--group-icon-gap);
    margin-top: var(--space-sm);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .group-icon {
    width: var(--group-icon-size);
    height: var(--group-icon-size);
  }

  .group-title--new .group-icon {
    color: var(--accent);
  }

  .group-count {
    margin-left: auto;
    letter-spacing: 0;
  }

  .changes {
    list-style: none;
  }

  /* Bullets start where the heading text starts, so the type icons hang out as section markers. */
  .group-title + .changes {
    padding-left: calc(var(--group-icon-size) + var(--group-icon-gap));
  }

  .change-row {
    display: grid;
    grid-template-columns: 14px 1fr 20px;
    gap: var(--space-sm);
    align-items: start;
    min-height: 44px;
    padding: 11px 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text-primary);
  }

  .change-row--plain {
    grid-template-columns: 14px 1fr;
  }

  .bullet {
    width: 6px;
    height: 6px;
    margin-top: 0.45rem;
    border-radius: 999px;
    background: var(--text-disabled);
  }

  .bullet--new {
    background: var(--accent);
  }

  .change-details {
    margin: 0 0 var(--space-sm) 22px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.45;
  }

  .milestone {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    border: 1px dashed var(--text-disabled);
  }

  .milestone-content {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .milestone-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .milestone-link {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    text-underline-offset: 3px;
  }
</style>
