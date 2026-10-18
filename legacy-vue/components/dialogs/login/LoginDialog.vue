<script setup lang="ts">
  import { Dialog } from '@ark-ui/vue/dialog';
  import { computed } from 'vue';
  import EmailPasswordLogin from '../../EmailPasswordLogin.vue';

  interface Props {
    open?: boolean;
  }

  interface Emits {
    (e: 'update:open', value: boolean): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
  });

  const emit = defineEmits<Emits>();

  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });

  const handleLoginSuccess = () => {
    isOpen.value = false;
  };
</script>

<template>
  <Dialog.Root v-model:open="isOpen">
    <Teleport to="body">
      <Dialog.Backdrop class="login-backdrop" />
      <Dialog.Positioner class="login-positioner">
        <Dialog.Content class="login-content">
          <Dialog.Title class="login-title">Přihlásit se</Dialog.Title>
          <Dialog.Description class="login-description">
            Přihlaste se svým účtem pro přístup k hostitelským funkcím.
          </Dialog.Description>

          <EmailPasswordLogin @login="handleLoginSuccess" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>

<style scoped>
  .login-backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop);
    z-index: 1200;
  }

  .login-positioner {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 1201;
  }

  .login-content {
    width: min(92vw, 360px);
    background: var(--bg-primary);
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-dialog);
    padding: var(--space-md);
  }

  .login-title {
    margin: 0 0 var(--space-xs);
    font-size: 1.05rem;
    font-weight: 700;
  }

  .login-description {
    margin: 0 0 var(--space-md);
    color: var(--text-secondary);
    font-size: 0.88rem;
  }
</style>
