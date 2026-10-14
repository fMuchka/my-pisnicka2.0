<script setup lang="ts">
  import { Drawer } from '@ark-ui/vue/drawer';
  import { MenuIcon } from 'lucide-vue-next';
  import { ref } from 'vue';
  import { RouterLink } from 'vue-router';
  import Button from '../../_core/button/Button.vue';
  import type { TabBarPage } from '../tab-bar/TabBar.vue';

  defineProps<{ pages: TabBarPage[]; currentPageId: string }>();

  const open = ref(false);
</script>

<template>
  <Drawer.Root
    :open="open"
    swipe-direction="right"
    @open-change="open = $event.open"
  >
    <Drawer.Trigger as-child>
      <Button
        :icon="{ component: MenuIcon, position: 'prepend' }"
        style-variation="text"
        aria-label="Otevřít menu"
      />
    </Drawer.Trigger>

    <Teleport to="body">
      <Drawer.Backdrop class="backdrop" />
      <Drawer.Positioner class="positioner">
        <Drawer.Content class="content">
          <!-- Kept for screen readers: Content is aria-labelledby the title. -->
          <Drawer.Title class="visually-hidden">Menu</Drawer.Title>
          <div class="actions">
            <slot name="actions" />
          </div>

          <nav class="links">
            <RouterLink
              v-for="p in pages"
              :key="p.id"
              :to="p.link"
              :class="['link', { 'link--active': p.id === currentPageId }]"
              :aria-current="p.id === currentPageId ? 'page' : undefined"
              @click="open = false"
            >
              <component
                :is="p.icon.component"
                class="link-icon"
                v-bind="p.icon.props"
              />
              {{ p.label }}
            </RouterLink>
          </nav>
        </Drawer.Content>
      </Drawer.Positioner>
    </Teleport>
  </Drawer.Root>
</template>

<style scoped>
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop);
    z-index: 999;
  }

  .backdrop[data-state='open'] {
    animation: fade-in var(--transition-slow);
  }

  .backdrop[data-state='closed'] {
    animation: fade-out var(--transition-normal);
  }

  .positioner {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: flex-end;
    z-index: 1000;
    pointer-events: none;
  }

  .positioner[hidden],
  .content[hidden],
  .backdrop[hidden] {
    display: none;
  }

  .content {
    pointer-events: auto;
    box-sizing: border-box;
    width: min(320px, 85vw);
    height: 100%;
    background: var(--surface-raised);
    border-left: 1px solid var(--border);
    box-shadow: var(--shadow-panel);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    /* Ark sets the drag offset as an inline transform; this eases the snap-back after a released swipe. */
    transition: transform var(--transition-normal);
  }

  /* Animations override Ark's inline transform, so the slide doesn't fight the swipe offset. */
  .content[data-state='open'] {
    animation: slide-in var(--transition-slow);
  }

  .content[data-state='closed'] {
    animation: slide-out var(--transition-normal);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--border);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .link:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .link {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font: var(--text-title-compact);
    color: var(--ink-muted);
    text-decoration: none;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);
  }

  .link:hover {
    background: var(--surface-secondary);
    color: var(--ink);
  }

  .link--active,
  .link--active:hover {
    background: var(--brand-soft);
    color: var(--brand);
  }

  .link-icon {
    width: 22px;
    height: 22px;
  }

  @keyframes slide-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-out {
    from {
      transform: translateX(var(--drawer-translate-x, 0));
    }
    to {
      transform: translateX(100%);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }

  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
</style>
