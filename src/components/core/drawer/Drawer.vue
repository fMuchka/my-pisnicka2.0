<script setup lang="ts">
  import { Drawer } from '@ark-ui/vue/drawer';
  import { XIcon } from 'lucide-vue-next';
  import type { FunctionalComponent } from 'vue';
  import type { DrawerTitleIcon } from './types';

  const props = withDefaults(
    defineProps<{
      open: boolean;
      title?: string;
      titleIcon?: DrawerTitleIcon;
      content?: FunctionalComponent;
    }>(),
    {
      title: '',
      titleIcon: undefined,
      content: undefined,
    }
  );

  const emit = defineEmits<{
    (event: 'update:open', open: boolean): void;
  }>();

  const handleOpenChange = (details: { open: boolean }) => {
    emit('update:open', details.open);
  };
</script>

<template>
  <Teleport to="body">
    <Drawer.Root
      :open="props.open"
      @open-change="handleOpenChange"
    >
      <Drawer.Backdrop class="backdrop" />
      <Drawer.Positioner class="positioner">
        <Drawer.Content
          class="content"
          data-testid="drawer-content"
        >
          <Drawer.Grabber class="grabber">
            <Drawer.GrabberIndicator class="grabberIndicator" />
          </Drawer.Grabber>
          <Drawer.Title class="title">
            <component
              :is="props.titleIcon.component"
              v-if="props.titleIcon"
              v-bind="props.titleIcon.props"
            />
            {{ props.title }}
          </Drawer.Title>
          <component
            :is="props.content"
            v-if="props.content"
          />
          <Drawer.CloseTrigger
            class="closeTrigger"
            aria-label="Zavřít"
          >
            <XIcon :size="20" />
          </Drawer.CloseTrigger>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  </Teleport>
</template>

<style scoped>
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop);
    z-index: 999;
  }

  .backdrop[data-state='open'] {
    animation: drawer-fade-in var(--transition-normal) ease-out;
  }

  .backdrop[data-state='closed'] {
    animation: drawer-fade-out var(--transition-fast) ease-in;
  }

  .positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  }

  .positioner[hidden] {
    display: none;
  }

  .content {
    pointer-events: auto;
    box-sizing: border-box;
    width: 100%;
    max-width: 480px;
    max-height: min(85vh, 720px);
    overflow-y: auto;
    background: var(--surface-raised);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    box-shadow: var(--shadow-panel);
    padding: var(--space-sm) var(--space-lg) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    position: relative;
  }

  .content[hidden] {
    display: none;
  }

  .content[data-state='open'] {
    animation: drawer-fade-in var(--transition-normal) ease-out;
  }

  .content[data-state='closed'] {
    animation: drawer-fade-out var(--transition-fast) ease-in;
  }

  .grabber {
    display: flex;
    justify-content: center;
    padding: var(--space-xs) 0;
    cursor: grab;
  }

  .grabberIndicator {
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--border);
  }

  .title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding-right: 40px;
    font: var(--text-title-compact);
    color: var(--ink);
  }

  .closeTrigger {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--ink-muted);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .closeTrigger:hover {
    background: var(--surface-secondary);
  }

  .closeTrigger:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  @keyframes drawer-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes drawer-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
