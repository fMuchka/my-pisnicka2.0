<script setup lang="ts">
  import { QrCode } from '@ark-ui/vue';

  withDefaults(
    defineProps<{
      value: string;
      size?: number;
      overlaySrc?: string;
      overlayAlt?: string;
    }>(),
    {
      size: 224,
      overlaySrc: '/android/android-launchericon-192-192.png',
      overlayAlt: 'MyPísnička',
    }
  );
</script>

<template>
  <QrCode.Root
    class="qr-code"
    :model-value="value"
    :encoding="{ ecc: 'H' }"
  >
    <QrCode.Frame
      class="qr-frame"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <QrCode.Pattern class="qr-pattern" />
    </QrCode.Frame>
    <QrCode.Overlay class="qr-overlay">
      <img
        class="qr-overlay-image"
        :src="overlaySrc"
        :alt="overlayAlt"
      />
    </QrCode.Overlay>
  </QrCode.Root>
</template>

<style scoped>
  .qr-code {
    display: inline-flex;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: #fff;
    color: #111;
  }

  .qr-frame {
    fill: currentColor;
  }

  .qr-pattern {
    fill: inherit;
  }

  .qr-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28%;
    height: 28%;
    padding: 6px;
    border-radius: var(--radius-sm);
    background: #fff;
  }

  .qr-overlay-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
