<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Dialog } from '@ark-ui/vue/dialog';
  import { SegmentGroup } from '@ark-ui/vue/segment-group';
  import Button from '../../core/Button.vue';
  import PinCodeInput from '../../core/PinCodeInput.vue';
  import QrCode from '../../core/QrCode.vue';
  import type { PIN } from '../../../lib/pin';

  interface Props {
    open: boolean;
    pin: PIN;
    currentUrl: string;
  }

  interface Emits {
    (event: 'update:open', value: boolean): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const shareView = ref<'qr' | 'pin'>('pin');

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const closeDialog = () => {
    isOpen.value = false;
  };
</script>

<template>
  <Dialog.Root
    v-model:open="isOpen"
    lazy-mount
    unmount-on-exit
  >
    <Teleport to="body">
      <Dialog.Backdrop class="dialog-backdrop" />
      <Dialog.Positioner class="dialog-positioner">
        <Dialog.Content class="dialog-content">
          <Dialog.Title class="dialog-title">Sdílet relaci</Dialog.Title>

          <div class="share-tabs">
            <SegmentGroup.Root
              v-model="shareView"
              class="share-segment"
              aria-label="Způsob sdílení relace"
            >
              <SegmentGroup.Indicator class="share-segment__indicator" />
              <SegmentGroup.Item
                value="pin"
                class="share-segment__item"
              >
                <SegmentGroup.ItemText class="share-segment__item-text">PIN</SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
              <SegmentGroup.Item
                value="qr"
                class="share-segment__item"
              >
                <SegmentGroup.ItemText class="share-segment__item-text">QR</SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            </SegmentGroup.Root>
          </div>

          <div class="share-view">
            <QrCode
              v-if="shareView === 'qr'"
              :value="currentUrl"
            />
            <PinCodeInput
              v-if="shareView === 'pin'"
              :model-value="pin"
              :read-only="true"
              :show-label="false"
              aria-label-prefix="pin číslice"
            />
          </div>

          <div class="dialog-actions">
            <Button
              label="Zavřít"
              type="button"
              @click="closeDialog"
            />
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--overlay-backdrop);
    z-index: 40;
  }

  .dialog-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 41;
  }

  .dialog-content {
    width: min(92vw, 380px);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .dialog-title {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .share-tabs {
    display: flex;
    justify-content: flex-end;
  }

  .share-segment {
    display: inline-flex;
    position: relative;
    isolation: isolate;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    padding: 2px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .share-segment__indicator {
    position: absolute;
    top: var(--top);
    left: var(--left);
    width: var(--width);
    height: var(--height);
    border-radius: calc(var(--radius-sm) - 2px);
    background-color: var(--bg-primary);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--text-primary) 12%, transparent);
    transition-property: width, height, left, top;
    transition-duration: var(--transition-fast);
    transition-timing-function: ease-out;
  }

  .share-segment__item {
    z-index: 1;
    border-radius: calc(var(--radius-sm) - 2px);
    border: none;
    padding: var(--space-xs) var(--space-sm);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--text-primary);
    }

    &[data-state='checked'] {
      color: var(--accent);
    }

    &[data-focus-visible] {
      outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
      outline-offset: 2px;
    }
  }

  .share-segment__item-text {
    position: relative;
    z-index: 1;
  }

  .share-view {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xs) 0;
    min-height: 120px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
