<script setup lang="ts">
  import { computed, ref } from 'vue';
  import Button, { type ButtonIcon } from '../../core/Button.vue';
  import { User, LogOut } from 'lucide-vue-next';
  import { Menu } from '@ark-ui/vue/menu';
  import LoginDialog from '../../dialogs/login/LoginDialog.vue';

  import { useAuth } from '../../../composables/useAuth';
  import { useRouter } from 'vue-router';
  import Routes from '../../../router/Routes';

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
      return email;
    }

    return 'Melon';
  });

  const menuItems = computed<MenuItem[]>(() => {
    if (!auth.isAuthenticated.value) {
      return [];
    }

    return [
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
</script>

<template>
  <Menu.Root v-if="menuItems.length > 0">
    <Menu.Trigger as-child>
      <Button
        class="user-trigger"
        :icon="triggerIcon"
        :label="userLabel"
        style-variation="Text"
        aria-label="Uživatelské možnosti"
      />
    </Menu.Trigger>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.Item
          v-for="(menuItem, j) in menuItems"
          :key="j"
          :value="menuItem.label"
        >
          <Button
            :icon="menuItem.icon"
            :label="menuItem.label"
            style-variation="Text"
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
      style-variation="Text"
      aria-label="Uživatelské možnosti"
      @click="isLoginDialogOpen = true"
    />

    <LoginDialog v-model:open="isLoginDialogOpen" />
  </template>
</template>

<style scoped>
  .user-trigger :deep(span) {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
