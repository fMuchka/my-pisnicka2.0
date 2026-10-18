<script setup lang="ts">
  import { ArrowDown, ChevronDown, ExternalLink, History, Music, Users } from 'lucide-vue-next';
  import IconBackdrop from '../../_core/icon-backdrop/IconBackdrop.vue';
  import { getTimelineEntries } from '../../../lib/timeline/timeline';

  const emit = defineEmits<{
    showHistory: [];
  }>();

  const LOGO_SRC = '/mypisnicka-icon.svg';
  const lastChangeLabel = getTimelineEntries()[0]?.label ?? null;

  const FEATURES = [
    {
      icon: Music,
      title: 'Akordy a diagramy',
      text: 'Akordy nad textem, diagramy pro kytaru i ukulele, transpozice a capo.',
    },
    {
      icon: ArrowDown,
      title: 'Automatický posun',
      text: 'Text jede sám, rychlost si nastavíš a mezi sekcemi skáčeš jedním klepnutím.',
    },
    {
      icon: Users,
      title: 'Relace',
      text: 'Společné hraní v reálném čase — všichni koukají na stejnou píseň. (Posun se nesynchronizuje.)',
    },
  ];

  const FAQS = [
    {
      question: 'Jaké výhody má účet?',
      answer: 'Můžeš přidávat písně, ukládat si je do playlistů a vytvářet Relace.',
    },
    {
      question: 'Jak získám účet?',
      answer:
        'Účet pro nové členy vytváří jen FM. Mít ho ale nemusíš — připojit se jde i bez účtu.',
    },
    {
      question: 'Kdo ručí za písně?',
      answer: 'Kdo píseň přidá, ten za ni odpovídá. Autor stránek za obsah písní neručí.',
    },
    {
      question: 'Co se o mně ukládá?',
      answer:
        'Jen pár dat v prohlížeči, aby aplikace fungovala. Sama se časem smažou. Žádná analytika, žádné reklamy.',
    },
  ];
</script>

<template>
  <div class="general">
    <section class="hero">
      <div class="hero-brand">
        <img
          :src="LOGO_SRC"
          alt=""
          class="hero-logo"
        />
        <h2 class="hero-title">
          MyPísnička
          <span class="hero-version">2.0</span>
        </h2>
      </div>
      <p class="hero-text">
        Nástroj pro kytaristy a skupiny, kteří chtějí jednoduše trénovat, sdílet písně a hrát spolu
        v reálném čase.
      </p>
      <div class="hero-meta">
        <button
          v-if="lastChangeLabel"
          type="button"
          class="meta-pill meta-pill--link"
          @click="emit('showHistory')"
        >
          <History
            class="icon-xs"
            aria-hidden="true"
          />
          Poslední změna {{ lastChangeLabel }}
        </button>
        <span class="meta-pill">Bez reklam · bez analytiky</span>
      </div>
    </section>

    <section class="block">
      <h3 class="eyebrow">Co aplikace umí</h3>
      <ul class="features">
        <li
          v-for="feature in FEATURES"
          :key="feature.title"
          class="feature"
        >
          <IconBackdrop aria-hidden="true">
            <component
              :is="feature.icon"
              class="icon-sm"
            />
          </IconBackdrop>
          <span>
            <strong class="feature-title">{{ feature.title }}</strong>
            <span class="feature-text">{{ feature.text }}</span>
          </span>
        </li>
      </ul>
    </section>

    <figure class="block">
      <h3 class="eyebrow">Hlavní cíl</h3>
      <blockquote class="goal">
        Podpořit společné hraní bez složitého nastavování, bez reklam a bez bariér.
      </blockquote>
    </figure>

    <section class="block">
      <h3 class="eyebrow">Dobré vědět</h3>
      <details
        v-for="(faq, index) in FAQS"
        :key="faq.question"
        class="faq"
        :open="index === 0"
      >
        <summary class="faq-question">
          {{ faq.question }}
          <ChevronDown
            class="chevron"
            aria-hidden="true"
          />
        </summary>
        <p class="faq-answer">{{ faq.answer }}</p>
      </details>
    </section>

    <a
      class="v1-link"
      href="https://fmuchka.github.io/my-pisnicka/"
      target="_blank"
      rel="noopener"
    >
      <span class="v1-text">
        <span>První verze MyPísničky</span>
        <span class="v1-meta">Statický zpěvník ze září 2025</span>
      </span>
      <ExternalLink
        class="icon-sm"
        aria-hidden="true"
      />
    </a>
  </div>
</template>

<style scoped>
  .general {
    display: grid;
    gap: var(--space-lg);
  }

  .hero {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--brand) 8%, var(--surface-secondary));
  }

  .hero-brand {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .hero-logo {
    width: 28px;
    height: 28px;
  }

  .hero-title {
    font-size: 1.3rem;
    color: var(--ink);
  }

  .hero-version {
    font-weight: 500;
    color: var(--ink-muted);
  }

  .hero-text {
    color: var(--ink);
    line-height: 1.5;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .meta-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    font: inherit;
    font-size: 0.8rem;
    color: var(--ink-muted);
  }

  .meta-pill--link {
    background: var(--surface);
    color: var(--ink);
    font-weight: 500;
    cursor: pointer;
  }

  .meta-pill--link:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .block {
    display: grid;
    gap: var(--space-sm);
  }

  .eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .features {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-sm);
  }

  .feature {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: 14px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-secondary);
  }

  .feature-title {
    display: block;
    color: var(--ink);
  }

  .feature-text {
    display: block;
    margin-top: 2px;
    font-size: 0.85rem;
    color: var(--ink-muted);
  }

  .icon-sm {
    width: 1rem;
    height: 1rem;
  }

  .icon-xs {
    width: 0.85rem;
    height: 0.85rem;
  }

  .goal {
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--ink);
  }

  .faq {
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-secondary);
  }

  .faq-question {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 52px;
    padding: var(--space-sm) 14px;
    font-weight: 600;
    color: var(--ink);
    list-style: none;
    cursor: pointer;
  }

  .faq-question::-webkit-details-marker {
    display: none;
  }

  .faq-question:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .chevron {
    flex-shrink: 0;
    margin-left: auto;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--ink-muted);
    transition: transform var(--transition-fast);
  }

  .faq[open] .chevron {
    transform: rotate(180deg);
  }

  .faq-answer {
    padding: 0 14px 14px;
    font-size: 0.9rem;
    color: var(--ink-muted);
  }

  .v1-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    min-height: 52px;
    padding: var(--space-sm) 14px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    color: var(--ink);
    text-decoration: none;
  }

  .v1-link:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-soft);
  }

  .v1-text {
    display: grid;
    gap: 2px;
    font-weight: 500;
  }

  .v1-meta {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--ink-muted);
  }
</style>
