<script setup lang="ts">
  import { ColorPicker, parseColor, type Color } from '@ark-ui/vue/color-picker';
  import { Menu } from '@ark-ui/vue/menu';
  import { Slider } from '@ark-ui/vue/slider';
  import { Moon, Palette, Settings, Sun } from 'lucide-vue-next';
  import { computed, ref, watch } from 'vue';
  import Button, { type ButtonIcon } from '../../core/Button.vue';
  import { getContrastTextColor, useTheme, type Theme } from '../../../composables/useTheme';

  type ThemeOption = {
    value: Theme;
    label: string;
    icon: ButtonIcon['component'];
  };

  const {
    theme,
    setTheme,
    accentColor,
    chordColor,
    lyricsFontSize,
    chordFontSize,
    setAccentColor,
    setChordColor,
    setLyricsFontSize,
    setChordFontSize,
    resetToDefaults,
  } = useTheme();

  const accentSwatches = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];
  const chordSwatches = ['#292524', '#0f766e', '#1d4ed8', '#92400e', '#7f1d1d'];

  const accentPickerValue = ref(parseColor(accentColor.value));
  const chordPickerValue = ref(parseColor(chordColor.value));
  const isMenuOpen = ref(false);
  const isAccentPickerOpen = ref(false);
  const isChordPickerOpen = ref(false);

  watch(accentColor, (value) => {
    accentPickerValue.value = parseColor(value);
  });

  watch(chordColor, (value) => {
    chordPickerValue.value = parseColor(value);
  });

  watch(isMenuOpen, (isOpen) => {
    if (!isOpen) {
      isAccentPickerOpen.value = false;
      isChordPickerOpen.value = false;
    }
  });

  const toHexString = (colorValue: Color) => colorValue.toString('hex');

  const handleAccentPickerChange = (nextValue: Color) => {
    setAccentColor(toHexString(nextValue));
  };

  const handleChordPickerChange = (nextValue: Color) => {
    setChordColor(toHexString(nextValue));
  };

  const handleAccentTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const nextOpen = !isAccentPickerOpen.value;
    isAccentPickerOpen.value = nextOpen;

    if (nextOpen) {
      isChordPickerOpen.value = false;
    }
  };

  const handleChordTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const nextOpen = !isChordPickerOpen.value;
    isChordPickerOpen.value = nextOpen;

    if (nextOpen) {
      isAccentPickerOpen.value = false;
    }
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    isAccentPickerOpen.value = false;
    isChordPickerOpen.value = false;
  };

  const handleLyricsSizeChange = (details: { value: number[] }) => {
    const [nextSize] = details.value;

    if (typeof nextSize === 'number') {
      setLyricsFontSize(nextSize);
    }
  };

  const handleChordSizeChange = (details: { value: number[] }) => {
    const [nextSize] = details.value;

    if (typeof nextSize === 'number') {
      setChordFontSize(nextSize);
    }
  };

  const accentIconColor = computed(() => getContrastTextColor(accentColor.value));
  const chordIconColor = computed(() => getContrastTextColor(chordColor.value));

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Světlý',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Tmavý',
      icon: Moon,
    },
  ];
</script>

<template>
  <Menu.Root
    :open="isMenuOpen"
    @update:open="isMenuOpen = $event"
  >
    <Menu.Trigger as-child>
      <Button
        :icon="{ component: Settings, position: 'prepend' }"
        style-variation="Text"
        aria-label="Nastavení aplikace"
      />
    </Menu.Trigger>

    <Menu.Positioner>
      <Menu.Content class="app-options-menu">
        <div class="menu-title">Motiv</div>

        <div
          class="theme-grid"
          role="group"
          aria-label="Výběr motivu"
        >
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="theme-card"
            :class="{ 'theme-card--active': theme === option.value }"
            @click="setTheme(option.value)"
          >
            <component
              :is="option.icon"
              :size="16"
            />
            <span>{{ option.label }}</span>
          </button>
        </div>

        <div class="menu-divider" />

        <div class="menu-title">Barva aplikace</div>
        <div
          class="swatch-row"
          role="group"
          aria-label="Výběr barvy aplikace"
        >
          <button
            v-for="color in accentSwatches"
            :key="`accent-${color}`"
            type="button"
            class="swatch-button"
            :class="{ 'swatch-button--active': accentColor === color }"
            @click="setAccentColor(color)"
          >
            <span
              class="swatch-fill"
              :style="{ backgroundColor: color }"
            />
          </button>

          <button
            type="button"
            class="swatch-button swatch-button--custom"
            aria-label="Vybrat vlastní barvu aplikace"
            @click="handleAccentTriggerClick"
          >
            <span
              class="swatch-fill"
              :style="{ backgroundColor: accentColor }"
            />
            <Palette
              :size="11"
              :color="accentIconColor"
            />
          </button>
        </div>

        <ColorPicker.Root
          v-if="isAccentPickerOpen"
          inline
          :model-value="accentPickerValue"
          @update:model-value="handleAccentPickerChange"
        >
          <ColorPicker.Content class="picker-content picker-content--inline">
            <ColorPicker.Area class="picker-area">
              <ColorPicker.AreaBackground class="picker-area-bg" />
              <ColorPicker.AreaThumb class="picker-thumb" />
            </ColorPicker.Area>
            <ColorPicker.ChannelSlider
              class="picker-slider"
              channel="hue"
            >
              <ColorPicker.ChannelSliderTrack class="picker-slider-track" />
              <ColorPicker.ChannelSliderThumb class="picker-thumb" />
            </ColorPicker.ChannelSlider>
            <ColorPicker.ChannelInput
              class="picker-hex-input"
              channel="hex"
            />
          </ColorPicker.Content>
        </ColorPicker.Root>

        <div class="menu-title">Barva akordů</div>
        <div
          class="swatch-row"
          role="group"
          aria-label="Výběr barvy akordů"
        >
          <button
            v-for="color in chordSwatches"
            :key="`chord-${color}`"
            type="button"
            class="swatch-button"
            :class="{ 'swatch-button--active': chordColor === color }"
            @click="setChordColor(color)"
          >
            <span
              class="swatch-fill"
              :style="{ backgroundColor: color }"
            />
          </button>

          <button
            type="button"
            class="swatch-button swatch-button--custom"
            aria-label="Vybrat vlastní barvu akordů"
            @click="handleChordTriggerClick"
          >
            <span
              class="swatch-fill"
              :style="{ backgroundColor: chordColor }"
            />
            <Palette
              :size="11"
              :color="chordIconColor"
            />
          </button>
        </div>

        <ColorPicker.Root
          v-if="isChordPickerOpen"
          inline
          :model-value="chordPickerValue"
          @update:model-value="handleChordPickerChange"
        >
          <ColorPicker.Content class="picker-content picker-content--inline">
            <ColorPicker.Area class="picker-area">
              <ColorPicker.AreaBackground class="picker-area-bg" />
              <ColorPicker.AreaThumb class="picker-thumb" />
            </ColorPicker.Area>
            <ColorPicker.ChannelSlider
              class="picker-slider"
              channel="hue"
            >
              <ColorPicker.ChannelSliderTrack class="picker-slider-track" />
              <ColorPicker.ChannelSliderThumb class="picker-thumb" />
            </ColorPicker.ChannelSlider>
            <ColorPicker.ChannelInput
              class="picker-hex-input"
              channel="hex"
            />
          </ColorPicker.Content>
        </ColorPicker.Root>

        <div class="menu-divider" />

        <div class="menu-title">Velikost textu písně</div>
        <Slider.Root
          class="size-slider"
          :default-value="[lyricsFontSize]"
          :value="[lyricsFontSize]"
          :min="12"
          :max="28"
          :step="1"
          @value-change="handleLyricsSizeChange"
        >
          <div class="slider-meta">
            <Slider.Label class="slider-label">Text</Slider.Label>
            <Slider.ValueText class="slider-value">{{ lyricsFontSize }}px</Slider.ValueText>
          </div>
          <Slider.Control class="slider-control">
            <Slider.Track class="slider-track">
              <Slider.Range class="slider-range" />
            </Slider.Track>
            <Slider.Thumb
              :index="0"
              class="slider-thumb"
            >
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
        </Slider.Root>

        <div class="menu-title menu-title--spaced">Velikost akordů</div>
        <Slider.Root
          class="size-slider"
          :default-value="[chordFontSize]"
          :value="[chordFontSize]"
          :min="12"
          :max="28"
          :step="1"
          @value-change="handleChordSizeChange"
        >
          <div class="slider-meta">
            <Slider.Label class="slider-label">Akordy</Slider.Label>
            <Slider.ValueText class="slider-value">{{ chordFontSize }}px</Slider.ValueText>
          </div>
          <Slider.Control class="slider-control">
            <Slider.Track class="slider-track">
              <Slider.Range class="slider-range" />
            </Slider.Track>
            <Slider.Thumb
              :index="0"
              class="slider-thumb"
            >
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
        </Slider.Root>

        <div class="menu-divider" />

        <Button
          class="reset-button"
          label="Obnovit výchozí"
          color-variation="Secondary"
          style-variation="Text"
          @click="handleResetDefaults"
        />
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>
</template>

<style scoped>
  .app-options-menu {
    margin-top: var(--space-xs);
    min-width: 220px;
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--text-primary) 12%, transparent);
    padding: var(--space-sm);
    z-index: 20;
  }

  .menu-title {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    margin: 0 0 var(--space-xs);
    padding: 0 var(--space-xs);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .theme-card {
    min-height: 64px;
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .theme-card:hover {
    border-color: color-mix(in srgb, var(--accent) 35%, var(--bg-tertiary));
    transform: translateY(-1px);
  }

  .theme-card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .theme-card--active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-secondary));
  }

  .menu-divider {
    height: 1px;
    margin: var(--space-sm) 0;
    background: color-mix(in srgb, var(--bg-tertiary) 70%, transparent);
  }

  .swatch-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-bottom: var(--space-sm);
  }

  .swatch-button {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid var(--bg-tertiary);
    background: transparent;
    padding: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .swatch-button:hover {
    transform: translateY(-1px);
  }

  .swatch-button--active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .swatch-button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .swatch-fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .swatch-button--custom {
    position: relative;
    overflow: hidden;
  }

  .swatch-button--custom svg {
    position: absolute;
    color: white;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
    pointer-events: none;
  }

  .picker-content {
    margin-top: var(--space-xs);
    width: 190px;
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    z-index: 30;
  }

  .picker-content--inline {
    margin: 0 0 var(--space-sm);
  }

  .reset-button {
    width: 100%;
    justify-content: center;
  }

  .size-slider {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: var(--space-sm);
  }

  .slider-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .slider-label,
  .slider-value {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .slider-value {
    font-variant-numeric: tabular-nums;
  }

  .slider-control {
    position: relative;
    display: flex;
    align-items: center;
    height: 20px;
  }

  .slider-track {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg-tertiary) 70%, transparent);
    overflow: hidden;
  }

  .slider-range {
    height: 100%;
    border-radius: inherit;
    background: color-mix(in srgb, var(--accent) 82%, var(--bg-primary));
  }

  .slider-thumb {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: var(--bg-primary);
    border: 2px solid var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .slider-thumb:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  .menu-title--spaced {
    margin-top: var(--space-xs);
  }

  .picker-area {
    position: relative;
    height: 110px;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .picker-area-bg,
  .picker-slider-track {
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .picker-slider {
    position: relative;
    height: 10px;
    border-radius: 999px;
  }

  .picker-thumb {
    width: 11px;
    height: 11px;
    border-radius: 999px;
    box-shadow:
      0 0 0 2px white,
      0 0 0 3px color-mix(in srgb, var(--text-primary) 16%, transparent);
    transform: translate(-50%, -50%);
  }

  .picker-hex-input {
    width: 100%;
    height: 34px;
    padding: 0 var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-tertiary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font: inherit;
    font-size: 0.83rem;
    text-transform: uppercase;
  }

  .picker-hex-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
</style>
