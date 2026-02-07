<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { Field } from '@ark-ui/vue';
  import { Tooltip } from '@ark-ui/vue/tooltip';
  import { Plus, Link as LinkIcon } from 'lucide-vue-next';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import Button from '../components/core/Button.vue';
</script>

<template>
  <TopNavigation />

  <div
    class="container"
    data-testid="home-view"
  >
    <!-- Sessions Section -->
    <section
      class="content-section"
      data-testid="home-sessions-section"
    >
      <div class="section-header">
        <h2 class="section-title">Relace</h2>
        <div class="header-actions">
          <!-- Create Session Button with Tooltip -->
          <Tooltip.Root :open-delay="300">
            <Tooltip.Trigger as-child>
              <Button
                class="action-btn"
                aria-label="Vytvořit novou relaci"
                :icon="{ position: 'prepend', component: Plus }"
              />
            </Tooltip.Trigger>
            <Teleport to="body">
              <Tooltip.Positioner>
                <Tooltip.Content class="tooltip-content">Vytvořit novou relaci</Tooltip.Content>
              </Tooltip.Positioner>
            </Teleport>
          </Tooltip.Root>

          <!-- Join Session Button with Tooltip -->
          <Tooltip.Root :open-delay="300">
            <Tooltip.Trigger as-child>
              <Button
                class="action-btn"
                aria-label="Připojit se k relaci"
                :icon="{ position: 'prepend', component: LinkIcon }"
                color-variation="Secondary"
              />
            </Tooltip.Trigger>
            <Teleport to="body">
              <Tooltip.Positioner>
                <Tooltip.Content class="tooltip-content">Připojit se k relaci</Tooltip.Content>
              </Tooltip.Positioner>
            </Teleport>
          </Tooltip.Root>

          <a
            href="#"
            class="view-all-link"
          >
            Zobrazit vše →
          </a>
        </div>
      </div>

      <div class="sessions-list">
        <!-- Placeholder for 3 latest sessions -->
        <a
          href="#"
          class="session-item"
        >
          <div class="session-info">
            <h3>Kytarová večeře</h3>
            <div class="session-meta">před 2 hodinami</div>
          </div>
        </a>
        <a
          href="#"
          class="session-item"
        >
          <div class="session-info">
            <h3>Víkendové hraní</h3>
            <div class="session-meta">před 1 dnem</div>
          </div>
        </a>
        <a
          href="#"
          class="session-item"
        >
          <div class="session-info">
            <h3>Plážový oheň</h3>
            <div class="session-meta">před 3 dny</div>
          </div>
        </a>
      </div>
    </section>

    <!-- Songs Section -->
    <section
      class="content-section"
      data-testid="home-songs-section"
    >
      <div class="section-header">
        <h2 class="section-title">Písničky</h2>
        <a
          href="#"
          class="view-all-link"
        >
          Zobrazit vše →
        </a>
      </div>

      <div class="song-tree">
        <!-- Artist Group 1 -->
        <div class="artist-group">
          <div class="artist-name">Umělec A</div>
          <div class="songs-in-artist">
            <a
              href="#"
              class="song-item"
              >Písnička 1</a
            >
            <a
              href="#"
              class="song-item"
              >Písnička 2</a
            >
          </div>
        </div>

        <!-- Artist Group 2 -->
        <div class="artist-group">
          <div class="artist-name">Umělec B</div>
          <div class="songs-in-artist">
            <a
              href="#"
              class="song-item"
              >Písnička 3</a
            >
            <a
              href="#"
              class="song-item"
              >Písnička 4</a
            >
          </div>
        </div>

        <!-- Artist Group 3 -->
        <div class="artist-group">
          <div class="artist-name">Umělec C</div>
          <div class="songs-in-artist">
            <a
              href="#"
              class="song-item"
              >Písnička 5</a
            >
            <a
              href="#"
              class="song-item"
              >Písnička 6</a
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Create Session Dialog -->
    <Dialog.Root>
      <Teleport to="body">
        <Dialog.Backdrop class="dialog-backdrop" />
        <Dialog.Positioner class="dialog-positioner">
          <Dialog.Content
            class="dialog-content"
            data-testid="create-session-dialog"
          >
            <Dialog.Title class="dialog-title"> Vytvořit novou relaci </Dialog.Title>
            <Dialog.Description class="dialog-description">
              Zadejte název nové relace pro zahájení společného hraní.
            </Dialog.Description>

            <Field.Root class="field">
              <Field.Label class="field-label">
                Název relace
                <Field.RequiredIndicator class="field-required">*</Field.RequiredIndicator>
              </Field.Label>
              <Field.Input
                class="field-input"
                placeholder="Např. Kytarová večeře"
              />
              <Field.HelperText class="field-helper">
                Název musí mít alespoň 3 znaky
              </Field.HelperText>
              <Field.ErrorText class="field-error"> Název relace je povinný </Field.ErrorText>
            </Field.Root>

            <div class="dialog-actions">
              <Dialog.CloseTrigger as-child>
                <Button
                  label="Zrušit"
                  color-variation="Secondary"
                  style-variation="Outlined"
                />
              </Dialog.CloseTrigger>
              <Button
                label="Vytvořit"
                data-testid="create-session-submit"
              />
            </div>

            <Dialog.CloseTrigger
              class="dialog-close"
              aria-label="Zavřít dialog"
            >
              ✕
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Teleport>
    </Dialog.Root>
  </div>
</template>

<style scoped>
  /* Main container */
  .container {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    padding: var(--space-xl) var(--space-md);
  }

  /* Content Sections */
  .content-section {
    background-color: white;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    gap: var(--space-sm);
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .action-btn {
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--text-primary);
    transition: all 150ms ease;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
  }

  .action-btn:hover {
    color: var(--accent);
    background-color: var(--bg-secondary);
  }

  .view-all-link {
    color: var(--accent);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 150ms ease;
  }

  .view-all-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  /* Sessions List */
  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    text-decoration: none;
    color: inherit;
    transition: all 150ms ease;
  }

  .session-item:hover {
    background-color: var(--bg-tertiary);
  }

  .session-info h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 4px 0;
  }

  .session-meta {
    font-size: 14px;
    color: var(--text-secondary);
  }

  /* Fade-out effect for preview items */
  .fade-out {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Songs Tree View */
  .song-tree {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .artist-group {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    transition: all 150ms ease;
  }

  .artist-group:hover {
    background-color: var(--bg-tertiary);
  }

  .artist-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    padding: var(--space-sm) 0;
    cursor: pointer;
    transition: opacity 150ms ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .artist-name:hover {
    opacity: 0.8;
  }

  .artist-name::before {
    content: '❯ ';
    margin-right: var(--space-xs);
  }

  .songs-in-artist {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-left: var(--space-sm);
  }

  .song-item {
    font-size: 14px;
    color: var(--text-secondary);
    padding: var(--space-xs) 0;
    cursor: pointer;
    transition: color 150ms ease;
    text-decoration: none;
    display: block;
  }

  .song-item:hover {
    color: var(--accent);
  }

  /* Tooltip */
  .tooltip-content {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  /* Dialog */
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog-content {
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--space-sm);
  }

  .dialog-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);
  }

  .dialog-close {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: var(--space-xs);
    line-height: 1;
  }

  .dialog-close:hover {
    color: var(--text-primary);
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }

  /* Field */
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .field-required {
    color: var(--accent);
  }

  .field-input {
    padding: var(--space-sm);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
  }

  .field-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .field-helper {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .field-error {
    font-size: 0.75rem;
    color: var(--accent);
  }

  /* Responsive */
  @media (min-width: 768px) {
    .container {
      padding: var(--space-2xl) var(--space-xl);
    }
  }
</style>
