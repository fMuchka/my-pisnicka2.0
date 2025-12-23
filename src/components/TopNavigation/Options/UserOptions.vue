<script setup lang="ts">
  import Button, { type ButtonIcon } from '../../core/Button.vue';
  import { User, LogOut } from 'lucide-vue-next';
  import { Menu } from '@ark-ui/vue/menu';

  import { useAuth } from '../../../composables/useAuth';
  import { useRouter } from 'vue-router';
  import Routes from '../../../router/Routes';

  type MenuItems = {
    items?: {
      label: string;
      icon?: ButtonIcon;
      ariaLabel: string;
      action: () => void;
    }[];
  };

  const auth = useAuth();
  const router = useRouter();

  const buttonsSpecs: (ButtonIcon & MenuItems)[] = [
    {
      component: User,
      position: 'prepend',
      items: [
        {
          label: 'Odhlásit se',
          ariaLabel: 'log out',
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
      ],
    },
  ];
</script>

<template>
  <Menu.Root
    v-for="(item, i) in buttonsSpecs"
    :key="i"
  >
    <Menu.Trigger as-child>
      <Button
        :icon="item"
        style-variation="Text"
        aria-label="user options"
      />
    </Menu.Trigger>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.Item
          v-for="(menuItem, j) in item.items"
          :key="j"
          :value="menuItem.label"
        >
          <Button
            :icon="menuItem.icon"
            :label="menuItem.label"
            style-variation="Text"
            :aria-label="menuItem.ariaLabel"
            @click="menuItem.action"
          />
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>
</template>

<style scoped>
  /* Top Navigation */
  .top-nav {
    height: 48px;
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-md);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-title {
    font-size: 20px;
    font-weight: 600;
  }

  .nav-actions {
    display: flex;
    gap: var(--space-sm);
  }
</style>
