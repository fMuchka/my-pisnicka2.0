import { useState } from 'react';
import type { AppBarPage } from '../app-bar/types';
import { Drawer } from '@ark-ui/react/drawer';
import { Portal } from '@ark-ui/react/portal';
import Button from '../../_core/button/Button';
import { MenuIcon } from 'lucide-react';
import { Link } from 'react-router';
import { classNames } from '../../../lib/classNames';
import styles from './SideMenu.module.css';

type SideMenuProps = {
  pages: AppBarPage[];
  currentPageId: string;
};

export function SideMenu({ currentPageId, pages }: Readonly<SideMenuProps>) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Drawer.Root
      open={open}
      swipeDirection="end"
      onOpenChange={(details) => setOpen(details.open)}
    >
      <Drawer.Trigger asChild>
        <Button
          icon={MenuIcon}
          iconPosition="prepend"
          styleVariation="text"
          aria-label="Otevřít menu"
        />
      </Drawer.Trigger>

      <Portal>
        <Drawer.Backdrop className={styles.backdrop} />
        <Drawer.Positioner className={styles.positioner}>
          <Drawer.Content className={styles.content}>
            {/* Kept for screen readers: Content is aria-labelledby the title. */}
            <Drawer.Title className={styles.visuallyHidden}>Menu</Drawer.Title>

            <nav className={styles.links}>
              {pages.map(({ icon: Icon, id, label, link }) => (
                <Link
                  key={id}
                  to={link}
                  className={classNames(styles.link, id === currentPageId && styles.linkActive)}
                  aria-current={id === currentPageId ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon
                    className={styles.linkIcon}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              ))}
            </nav>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
