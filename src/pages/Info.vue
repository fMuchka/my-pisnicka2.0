<script setup lang="ts">
  import { Tabs } from '@ark-ui/vue/tabs';
  import { History, Route, Info as InfoIcon } from 'lucide-vue-next';
  import { getTimelineEvents } from '../lib/timeline/timeline';
  import { getUpcomingFeatures } from '../lib/upcoming-features/upcomingFeatures';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';

  const TITLE = 'Informace';
  const TAG_LINE = 'Silmarillion MyPísničky';
  const timelineEvents = getTimelineEvents();
  const upcomingFeatures = getUpcomingFeatures();
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
    :show-back="true"
  />

  <section class="container">
    <Tabs.Root
      class="info-tabs"
      default-value="timeline"
      lazy-mount
      unmount-on-exit
      aria-label="Navigace informační stránky"
    >
      <Tabs.List class="tabs-list">
        <Tabs.Trigger
          class="tabs-trigger"
          value="timeline"
        >
          <History class="tabs-icon" />
          <span>Historie</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          class="tabs-trigger"
          value="roadmap"
        >
          <Route class="tabs-icon" />
          <span>Plány</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          class="tabs-trigger"
          value="general-info"
        >
          <InfoIcon class="tabs-icon" />
          <span>Obecné info</span>
        </Tabs.Trigger>
        <Tabs.Indicator class="tabs-indicator" />
      </Tabs.List>

      <Tabs.Content
        class="tabs-content"
        value="timeline"
      >
        <article class="panel-card">
          <h2 class="panel-title">Historie</h2>
          <p class="panel-description">
            Přehled důležitých milníků od prvních nápadů až po aktuální stav aplikace.
          </p>
          <ul class="event-list">
            <li
              v-for="event in timelineEvents"
              :key="`${event.time}-${event.text}`"
              class="event-item"
            >
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>{{ event.time }}</strong>
                <p>{{ event.text }}</p>
              </div>
            </li>
          </ul>
        </article>
      </Tabs.Content>

      <Tabs.Content
        class="tabs-content"
        value="roadmap"
      >
        <article class="panel-card">
          <h2 class="panel-title">Plány</h2>
          <p class="panel-description">Na čem plánuji pracovat.</p>
          <ul class="event-list">
            <li
              v-for="feature in upcomingFeatures"
              :key="feature.text"
              class="event-item"
            >
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>{{ feature.text }}</strong>
              </div>
            </li>
          </ul>
        </article>
      </Tabs.Content>

      <Tabs.Content
        class="tabs-content"
        value="general-info"
      >
        <article class="panel-card">
          <h2 class="panel-title">Obecné info</h2>
          <p class="panel-description">
            MyPísnička je nástroj pro kytaristy a skupiny, které chtějí jednoduše trénovat, sdílet
            písně a hrát spolu v reálném čase.
          </p>
          <ul class="event-list">
            <li class="event-item">
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>Co aplikace umí</strong>
                <p>Zobrazení akordů, automatické scrollování textu a týmové relace.</p>
              </div>
            </li>
            <li class="event-item">
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>Hlavní cíl</strong>
                <p>Podpořit společné hraní bez složitého nastavování, bez reklam a bez bariér.</p>
              </div>
            </li>
            <li class="event-item">
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>Vytvoření účtu</strong>
                <p>Účet pro nové členy může vytvořit pouze <b>FM</b>. Všichni účet mít nemusí.</p>
              </div>
            </li>
            <li class="event-item">
              <span
                class="event-dot"
                aria-hidden="true"
              ></span>
              <div>
                <strong>Vytváření písní</strong>
                <p>
                  Autor stránek nebere odpovědnost za tvorbu písní. Každý, kdo přidá píseň, za ni
                  bere odpovědnost.
                </p>
              </div>
            </li>
          </ul>
        </article>
      </Tabs.Content>
    </Tabs.Root>
  </section>
</template>

<style lang="css" scoped>
  .container {
    max-width: 980px;
    margin: 0 auto;
    width: 100%;
    padding: var(--space-xl) var(--space-md);
  }

  .info-tabs {
    display: grid;
    gap: var(--space-lg);
  }

  .tabs-list {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-xs);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-secondary) 80%, var(--bg-primary));
    border: 1px solid var(--border-primary);
    isolation: isolate;
  }

  .tabs-indicator {
    position: absolute;
    z-index: -1;
    height: calc(100% - var(--space-xs) * 2);
    width: var(--width);
    top: var(--space-xs);
    left: var(--left);
    border-radius: calc(var(--radius-md) - 4px);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-primary));
    transition-property: left, width;
    transition-duration: var(--transition-normal);
    transition-timing-function: ease-out;
  }

  .tabs-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    width: 100%;
    min-height: 44px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: calc(var(--radius-md) - 4px);
    font-size: 0.95rem;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .tabs-trigger[data-selected] {
    color: var(--text-primary);
  }

  .tabs-trigger:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .tabs-icon {
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
  }

  .tabs-content {
    outline: none;
  }

  .panel-card {
    padding: var(--space-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
    background: color-mix(in srgb, var(--bg-secondary) 65%, var(--bg-primary));
    box-shadow: var(--shadow-soft);
  }

  .panel-title {
    font-size: 1.2rem;
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .panel-description {
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
  }

  .event-list {
    list-style: none;
    display: grid;
    gap: var(--space-md);
  }

  .event-item {
    display: grid;
    grid-template-columns: 12px 1fr;
    gap: var(--space-sm);
    align-items: start;
  }

  .event-item strong {
    display: inline-block;
    margin-bottom: 2px;
    color: var(--text-primary);
  }

  .event-item p {
    color: var(--text-secondary);
  }

  .event-dot {
    width: 10px;
    height: 10px;
    margin-top: 0.45rem;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }

  @media (max-width: 720px) {
    .container {
      padding: var(--space-lg) var(--space-md);
    }

    .tabs-list {
      grid-template-columns: 1fr;
    }

    .tabs-indicator {
      width: calc(100% - var(--space-xs) * 2);
      height: var(--height);
      top: var(--top);
      left: var(--space-xs);
      transition-property: top, height;
    }

    .tabs-trigger {
      justify-content: flex-start;
      padding-inline: var(--space-md);
    }

    .panel-card {
      padding: var(--space-md);
    }
  }
</style>
