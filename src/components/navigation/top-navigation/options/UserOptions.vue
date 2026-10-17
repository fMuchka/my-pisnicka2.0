<script setup lang="ts">
  import { computed, ref } from 'vue';
  import Button from '../../../_core/button/Button.vue';
  import { User, LogOut, Key } from 'lucide-vue-next';
  import { Menu } from '@ark-ui/vue/menu';
  import LoginDialog from '../../../dialogs/login/LoginDialog.vue';
  import ChangePasswordDialog from '../../../dialogs/change-password/ChangePasswordDialog.vue';

  import { useAuth } from '../../../../composables/useAuth';
  import { useRouter } from 'vue-router';
  import Routes from '../../../../router/Routes';
  import type { ButtonIcon } from '../../../_core/button/types.ts';

  type MenuItem = {
    label: string;
    icon?: ButtonIcon;
    ariaLabel: string;
    action: () => void;
  };

  const auth = useAuth();
  const router = useRouter();

  const userLabel = computed(() => {
    const email = auth.user.value?.email?.trim();

    if (email) {
      return email.split('@')[0];
    }

    return 'Melon';
  });

  const menuItems = computed<MenuItem[]>(() => {
    if (!auth.isAuthenticated.value) {
      return [];
    }

    return [
      {
        label: 'Změnit heslo',
        ariaLabel: 'změnit heslo',
        action: () => {
          isChangePasswordDialogOpen.value = true;
        },
        icon: {
          component: Key,
          position: 'append',
        },
      },
      {
        label: 'Odhlásit se',
        ariaLabel: 'odhlásit se',
        action: () => {
          auth.logout().then(() => {
            router.push(Routes.Login);
          });
        },
        icon: {
          component: LogOut,
          position: 'append',
        },
      },
    ];
  });

  const triggerIcon: ButtonIcon = {
    component: User,
    position: 'prepend',
  };

  const isLoginDialogOpen = ref(false);
  const isChangePasswordDialogOpen = ref(false);
</script>

<template>
  <Menu.Root v-if="menuItems.length > 0">
    <Menu.Trigger as-child>
      <Button
        class="user-trigger"
        :icon="triggerIcon"
        :label="userLabel"
        style-variation="text"
        aria-label="Uživatelské možnosti"
      />
    </Menu.Trigger>
    <Menu.Positioner>
      <Menu.Content class="user-options-menu">
        <Menu.Item
          v-for="(menuItem, j) in menuItems"
          :key="j"
          :value="menuItem.label"
          as-child
        >
          <Button
            class="user-menu-button"
            :icon="menuItem.icon"
            :label="menuItem.label"
            style-variation="text"
            :aria-label="menuItem.label"
            @click="menuItem.action"
          />
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>

  <template v-else>
    <Button
      class="user-trigger"
      :icon="triggerIcon"
      :label="userLabel"
      style-variation="text"
      aria-label="Uživatelské možnosti"
      @click="isLoginDialogOpen = true"
    />

    <LoginDialog v-model:open="isLoginDialogOpen" />
  </template>

  <ChangePasswordDialog v-model:open="isChangePasswordDialogOpen" />
</template>

<style scoped>
  .user-options-menu {
    margin-top: var(--space-xs);
    width: 200px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-popover);
    padding: var(--space-xs);
    z-index: 20;
  }

  .user-menu-button {
    width: 100%;
    justify-content: space-between;
    border-radius: var(--radius-md);
    color: var(--ink);
  }

  .user-menu-button:hover {
    background: var(--surface-secondary);
  }

  .user-menu-button:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 1px;
  }

  .user-trigger :deep(span) {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
