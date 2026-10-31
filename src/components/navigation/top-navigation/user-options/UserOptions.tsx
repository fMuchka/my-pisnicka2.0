import { Menu } from '@ark-ui/react/menu';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import Button from '../../../_core/button/Button';
import type { Icon } from '../../../_core/types';
import { useAuth } from '../../../../hooks/useAuth';
import Routes from '../../../../router/Routes';
import { PLACEHOLDER_USER_NAME } from '../../../../pages/home/constants';
import styles from './UserOptions.module.css';

type MenuItem = {
  value: string;
  label: string;
  icon: Icon;
  action: () => void;
};

export function UserOptions() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const userLabel = user?.email?.trim().split('@')[0] || PLACEHOLDER_USER_NAME;

  // TODO: Add "Změnit heslo" once ChangePasswordDialog is ported.
  const menuItems: MenuItem[] = [
    {
      value: 'logout',
      label: 'Odhlásit se',
      icon: LogOut,
      action: () => {
        void logout().then(() => navigate(Routes.Login));
      },
    },
  ];

  if (!isAuthenticated) {
    // TODO: Open LoginDialog in place once it is ported; the Login page stands in for it.
    return (
      <Button
        className={styles.userTrigger}
        icon={User}
        label={userLabel}
        styleVariation="text"
        aria-label="Uživatelské možnosti"
        onClick={() => navigate(Routes.Login)}
      />
    );
  }

  return (
    <Menu.Root onSelect={({ value }) => menuItems.find((item) => item.value === value)?.action()}>
      <Menu.Trigger asChild>
        <Button
          className={styles.userTrigger}
          icon={User}
          label={userLabel}
          styleVariation="text"
          aria-label="Uživatelské možnosti"
        />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={styles.userOptionsMenu}>
          {menuItems.map((item) => (
            <Menu.Item
              key={item.value}
              value={item.value}
              asChild
            >
              <Button
                className={styles.userMenuButton}
                icon={item.icon}
                iconPosition="append"
                label={item.label}
                styleVariation="text"
              />
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
