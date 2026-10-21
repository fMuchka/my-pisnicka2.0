import { Drawer as ArkDrawer } from '@ark-ui/react/drawer';
import { Portal } from '@ark-ui/react/portal';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Drawer.module.css';
import type { Icon } from '../types';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Can only be closed from inside (e.g. a confirm button): no close button, Esc, outside click or drag. */
  keepOpen?: boolean;
  hideBackdrop?: boolean;
  title?: string;
  titleIcon?: Icon;
  children?: ReactNode;
};

export default function Drawer({
  open,
  onOpenChange,
  keepOpen = false,
  hideBackdrop = false,
  title = '',
  titleIcon: TitleIcon,
  children,
}: Readonly<DrawerProps>) {
  return (
    <ArkDrawer.Root
      closeOnEscape={!keepOpen}
      closeOnInteractOutside={!keepOpen}
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
    >
      <Portal>
        {!hideBackdrop && <ArkDrawer.Backdrop className={styles.backdrop} />}
        <ArkDrawer.Positioner className={styles.positioner}>
          <ArkDrawer.Content
            className={cx(styles.content, hideBackdrop && styles.contentCard)}
            data-testid="drawer-content"
            draggable={!keepOpen}
          >
            {!keepOpen && (
              <ArkDrawer.Grabber className={styles.grabber}>
                <ArkDrawer.GrabberIndicator className={styles.grabberIndicator} />
              </ArkDrawer.Grabber>
            )}
            <ArkDrawer.Title className={styles.title}>
              {TitleIcon && <TitleIcon aria-hidden="true" />}
              {title}
            </ArkDrawer.Title>
            {children}
            {!keepOpen && (
              <ArkDrawer.CloseTrigger
                className={styles.closeTrigger}
                aria-label="Zavřít"
              >
                <XIcon size={20} />
              </ArkDrawer.CloseTrigger>
            )}
          </ArkDrawer.Content>
        </ArkDrawer.Positioner>
      </Portal>
    </ArkDrawer.Root>
  );
}
