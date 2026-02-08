<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { Menu } from '@ark-ui/vue/menu';
  import { ChevronDown, Plus, GripVertical, ChevronUp, Eye, Code, X } from 'lucide-vue-next';
  import { useSortable } from '@vueuse/integrations/useSortable';
  import Button from '../core/Button.vue';
  import type { LucideProps } from 'lucide-vue-next';
  import type { EmitsOptions, FunctionalComponent } from 'vue';

  type ButtonIcon = {
    position: 'prepend' | 'append';
    component: FunctionalComponent<
      LucideProps,
      Record<string, unknown[]>,
      Record<string, unknown>,
      EmitsOptions
    >;
  };

  interface Props {
    modelValue: string;
    placeholder?: string;
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Začněte psát text písně...',
  });

  const emit = defineEmits<Emits>();

  // Toggle between visual and markdown mode
  const isVisualMode = ref(true);

  // Button icons
  const modeToggleIcon = computed<ButtonIcon>(() => ({
    position: 'prepend',
    component: isVisualMode.value ? Code : Eye,
  }));

  const addSectionIcon = computed<ButtonIcon>(() => ({
    position: 'prepend',
    component: Plus,
  }));

  // Section type definitions with colors
  const sectionTypes = {
    verse: { label: 'Verse', color: '#7dd3fc', borderColor: '#0284c7' },
    chorus: { label: 'Chorus', color: '#bef264', borderColor: '#65a30d' },
    bridge: { label: 'Bridge', color: '#fdba74', borderColor: '#ea580c' },
    intro: { label: 'Intro', color: '#c4b5fd', borderColor: '#7c3aed' },
    outro: { label: 'Outro', color: '#fda4af', borderColor: '#e11d48' },
  } as const;

  type SectionType = keyof typeof sectionTypes;

  interface Section {
    id: string;
    type: SectionType;
    number: number;
    text: string;
    collapsed: boolean;
  }

  const sections = ref<Section[]>([]);
  const sectionsListRef = ref<HTMLElement | null>(null);

  // Parse markdown to sections
  function parseMarkdown(markdown: string): Section[] {
    if (!markdown.trim()) return [];

    const lines = markdown.split('\n');
    const parsed: Section[] = [];
    let currentSection: Section | null = null;
    let sectionCounter = 0;

    for (const line of lines) {
      const match = line.match(/^\[([A-Za-z]+)\s*(\d+)?\]$/);
      if (match) {
        // Save previous section if exists
        if (currentSection) {
          parsed.push(currentSection);
        }

        const type = match[1]?.toLowerCase() as SectionType;
        const number = match[2] ? parseInt(match[2], 10) : 1;

        currentSection = {
          id: `section-${sectionCounter++}`,
          type: type in sectionTypes ? type : 'verse',
          number,
          text: '',
          collapsed: false,
        };
      } else if (currentSection) {
        currentSection.text += (currentSection.text ? '\n' : '') + line;
      }
    }

    // Add last section
    if (currentSection) {
      parsed.push(currentSection);
    }

    return parsed;
  }

  // Serialize sections back to markdown
  function serializeToMarkdown(secs: Section[]): string {
    return secs
      .map((section) => {
        const header = `[${sectionTypes[section.type].label} ${section.number}]`;
        return `${header}\n${section.text}`;
      })
      .join('\n\n');
  }

  // Initialize sections from modelValue
  watch(
    () => props.modelValue,
    (newValue) => {
      if (!isVisualMode.value) return; // Don't parse when in markdown mode
      sections.value = parseMarkdown(newValue);
    },
    { immediate: true }
  );

  // Emit updated markdown when sections change
  function updateMarkdown() {
    const markdown = serializeToMarkdown(sections.value);
    emit('update:modelValue', markdown);
  }

  // Raw markdown editing
  const rawMarkdown = ref(props.modelValue);
  watch(
    () => props.modelValue,
    (newValue) => {
      rawMarkdown.value = newValue;
    }
  );

  function toggleMode() {
    if (isVisualMode.value) {
      // Switching to markdown mode
      rawMarkdown.value = serializeToMarkdown(sections.value);
    } else {
      // Switching to visual mode
      emit('update:modelValue', rawMarkdown.value);
      sections.value = parseMarkdown(rawMarkdown.value);
    }
    isVisualMode.value = !isVisualMode.value;
  }

  // Get valid section options based on existing sections
  function getValidSectionOptions(
    excludeId?: string
  ): Array<{ type: SectionType; number: number }> {
    const options: Array<{ type: SectionType; number: number }> = [];
    const counts: Record<SectionType, number> = {
      verse: 0,
      chorus: 0,
      bridge: 0,
      intro: 0,
      outro: 0,
    };

    // Count existing sections
    sections.value.forEach((section) => {
      if (section.id !== excludeId) {
        counts[section.type] = Math.max(counts[section.type], section.number);
      }
    });

    // Generate valid options
    Object.keys(sectionTypes).forEach((type) => {
      const t = type as SectionType;
      const currentMax = counts[t];
      options.push({ type: t, number: currentMax + 1 });
    });

    return options;
  }

  // Add new section
  function addSection() {
    const validOptions = getValidSectionOptions();
    const firstOption = validOptions[0];
    if (!firstOption) return;

    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: firstOption.type,
      number: firstOption.number,
      text: '',
      collapsed: false,
    };

    sections.value.push(newSection);
    updateMarkdown();
  }

  // Change section type
  function changeSectionType(sectionId: string, type: SectionType, number: number) {
    const section = sections.value.find((s) => s.id === sectionId);
    if (section) {
      section.type = type;
      section.number = number;
      updateMarkdown();
    }
  }

  // Toggle section collapse
  function toggleCollapse(sectionId: string) {
    const section = sections.value.find((s) => s.id === sectionId);
    if (section) {
      section.collapsed = !section.collapsed;
    }
  }

  useSortable(sectionsListRef, sections, {
    animation: 100,
    handle: '.drag-handle',
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    dragClass: 'drag-dragging',
    fallbackOnBody: true,
    swapThreshold: 0.3,
    delay: 150,
    delayOnTouchOnly: true,
    touchStartThreshold: 10,
    forceFallback: true,
    onEnd: () => updateMarkdown(),
  });

  // Update section text
  function updateSectionText(sectionId: string, text: string) {
    const section = sections.value.find((s) => s.id === sectionId);
    if (section) {
      section.text = text;
      updateMarkdown();
    }
  }

  // Delete section
  function deleteSection(sectionId: string) {
    sections.value = sections.value.filter((s) => s.id !== sectionId);
    updateMarkdown();
  }
</script>

<template>
  <div class="song-text-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <Button
        color-variation="Primary"
        style-variation="Text"
        :aria-label="isVisualMode ? 'Přepnout na text' : 'Přepnout na vizuální režim'"
        :label="isVisualMode ? 'Textové' : 'Vizuální'"
        :icon="modeToggleIcon"
        @click="toggleMode"
      />

      <Button
        v-if="isVisualMode"
        color-variation="Primary"
        style-variation="Text"
        class="add-section-btn"
        aria-label="Přidat sekci"
        :label="'Přidat sekci'"
        :icon="addSectionIcon"
        @click="addSection"
      />
    </div>

    <!-- Visual Mode -->
    <div
      v-if="isVisualMode"
      ref="sectionsListRef"
      class="visual-editor"
    >
      <div
        v-if="sections.length === 0"
        class="empty-state"
      >
        <p>Žádné sekce. Klikněte na "Přidat sekci" pro začátek.</p>
      </div>

      <div
        v-for="section in sections"
        :key="section.id"
        class="section-block"
        :data-id="section.id"
        :style="{
          backgroundColor: sectionTypes[section.type].color,
          borderColor: sectionTypes[section.type].borderColor,
        }"
      >
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-header-left">
            <GripVertical
              :size="20"
              class="drag-handle"
            />

            <Menu.Root>
              <Menu.Trigger class="section-title-btn">
                <span class="section-title">
                  {{ sectionTypes[section.type].label }} {{ section.number }}
                </span>
                <ChevronDown :size="16" />
              </Menu.Trigger>

              <Menu.Positioner>
                <Menu.Content class="menu-content">
                  <Menu.Item
                    v-for="option in getValidSectionOptions(section.id)"
                    :key="`${option.type}-${option.number}`"
                    :value="`${option.type}-${option.number}`"
                    class="menu-item"
                    @select="() => changeSectionType(section.id, option.type, option.number)"
                  >
                    {{ sectionTypes[option.type].label }} {{ option.number }}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </div>

          <div class="section-header-right">
            <Button
              class="icon-btn"
              :aria-label="section.collapsed ? 'Rozbalit' : 'Sbalit'"
              :icon="
                section.collapsed
                  ? { component: ChevronDown, position: 'prepend' }
                  : { component: ChevronUp, position: 'prepend' }
              "
              @click="toggleCollapse(section.id)"
            />
            <Button
              class="icon-btn delete-btn"
              aria-label="Smazat sekci"
              :icon="{ component: X, position: 'append' }"
              @click="deleteSection(section.id)"
            />
          </div>
        </div>

        <!-- Section Content -->
        <div
          v-if="!section.collapsed"
          class="section-content"
        >
          <textarea
            :value="section.text"
            class="section-textarea"
            placeholder="Text a akordy..."
            rows="4"
            @input="updateSectionText(section.id, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- Markdown Mode -->
    <div
      v-else
      class="markdown-editor"
    >
      <textarea
        v-model="rawMarkdown"
        class="markdown-textarea"
        :placeholder="placeholder"
        rows="12"
        @input="emit('update:modelValue', rawMarkdown)"
      />
    </div>
  </div>
</template>

<style scoped>
  .song-text-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  /* Toolbar */
  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-sm);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
  }

  .add-section-btn {
    margin-left: auto;
  }

  /* Visual Editor */
  .visual-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .empty-state {
    padding: var(--space-lg);
    text-align: center;
    color: var(--text-secondary);
    border: 2px dashed var(--border-primary);
    border-radius: var(--radius-sm);
  }

  /* Section Block */
  .section-block {
    border: 3px solid;
    border-radius: var(--radius-md);
    padding: var(--space-md);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .section-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .section-header-right {
    display: flex;
    gap: var(--space-xs);
  }

  .drag-handle {
    cursor: grab;
    color: rgba(0, 0, 0, 0.4);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-ghost {
    opacity: 0.5;
    box-shadow: none;
    filter: grayscale(0.1);
  }

  .drag-chosen {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .drag-dragging {
    cursor: grabbing;
  }

  .section-title-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 600;
    font-size: 1.125rem;
    transition: background-color 0.2s;
  }

  .section-title-btn:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  .section-title {
    font-weight: 700;
    font-size: 1.25rem;
  }

  .icon-btn {
    padding: var(--space-xs);
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
  }

  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .delete-btn:hover {
    background: rgba(220, 38, 38, 0.2);
    color: #dc2626;
  }

  /* Section Content */
  .section-content {
    margin-top: var(--space-sm);
  }

  .section-textarea {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 1rem;
    resize: vertical;
    background: rgba(255, 255, 255, 0.5);
    min-height: 80px;
  }

  .section-textarea:focus {
    outline: 2px solid rgba(0, 0, 0, 0.3);
    outline-offset: 1px;
  }

  /* Markdown Editor */
  .markdown-textarea {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 1rem;
    resize: vertical;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 300px;
  }

  .markdown-textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  /* Menu Dropdown */
  .menu-content {
    background: white;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    padding: var(--space-xs);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 150px;
    z-index: 1000;
  }

  .menu-item {
    padding: var(--space-xs) var(--space-sm);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s;
  }

  .menu-item:hover {
    background-color: var(--bg-secondary);
  }
</style>
