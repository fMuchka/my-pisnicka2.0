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
      class="section"
      data-testid="home-sessions-section"
    >
      <div class="section-header">
        <h2>Relace</h2>
        <a
          href="#"
          class="view-all-link"
        >
          Zobrazit vše
        </a>
      </div>

      <ul class="sessions-list">
        <!-- Placeholder for 3 latest sessions -->
        <li class="session-item">
          <span class="session-name">Název relace 1</span>
          <span class="session-date">před 2 hodinami</span>
        </li>
        <li class="session-item">
          <span class="session-name">Název relace 2</span>
          <span class="session-date">před 1 dnem</span>
        </li>
        <li class="session-item">
          <span class="session-name">Název relace 3</span>
          <span class="session-date">před 3 dny</span>
        </li>
      </ul>

      <div class="section-actions">
        <!-- Create Session Button with Tooltip -->
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <Button
              aria-label="Vytvořit novou relaci"
              :icon="{ position: 'prepend', component: Plus }"
            />
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content"> Vytvořit novou relaci </Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>

        <!-- Join Session Button with Tooltip -->
        <Tooltip.Root :open-delay="300">
          <Tooltip.Trigger as-child>
            <Button
              aria-label="Připojit se k relaci"
              :icon="{ position: 'prepend', component: LinkIcon }"
              color-variation="Secondary"
            />
          </Tooltip.Trigger>
          <Teleport to="body">
            <Tooltip.Positioner>
              <Tooltip.Content class="tooltip-content"> Připojit se k relaci </Tooltip.Content>
            </Tooltip.Positioner>
          </Teleport>
        </Tooltip.Root>
      </div>
    </section>

    <!-- Songs Section -->
    <section
      class="section"
      data-testid="home-songs-section"
    >
      <div class="section-header">
        <h2>Písničky</h2>
        <a
          href="#"
          class="view-all-link"
        >
          Zobrazit vše
        </a>
      </div>

      <ul class="songs-list">
        <!-- Placeholder for up to 6 songs -->
        <li class="song-item">
          <span class="song-title">Písnička 1</span>
          <span class="song-artist">Umělec A</span>
        </li>
        <li class="song-item">
          <span class="song-title">Písnička 2</span>
          <span class="song-artist">Umělec A</span>
        </li>
        <li class="song-item">
          <span class="song-title">Písnička 3</span>
          <span class="song-artist">Umělec B</span>
        </li>
        <li class="song-item">
          <span class="song-title">Písnička 4</span>
          <span class="song-artist">Umělec B</span>
        </li>
        <li class="song-item">
          <span class="song-title">Písnička 5</span>
          <span class="song-artist">Umělec C</span>
        </li>
        <li class="song-item">
          <span class="song-title">Písnička 6</span>
          <span class="song-artist">Umělec C</span>
        </li>
      </ul>
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
    max-width: 400px;
    margin: auto;
    width: 100%;

    font-family: var(--font-body);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    gap: var(--space-lg);
  }

  /* Section Styles */
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .view-all-link {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .view-all-link:hover {
    text-decoration: underline;
  }

  /* Sessions List */
  .sessions-list {
    list-style: none;
    padding: 0;
    margin: 0;
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
    border: 1px solid var(--bg-tertiary);
  }

  .session-name {
    font-weight: 500;
  }

  .session-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  /* Section Actions */
  .section-actions {
    display: flex;
    gap: var(--space-sm);
  }

  /* Songs List */
  .songs-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-sm);
  }

  .song-item {
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-tertiary);
  }

  .song-title {
    font-weight: 500;
    margin-bottom: var(--space-xs);
  }

  .song-artist {
    font-size: 0.875rem;
    color: var(--text-secondary);
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
</style>
