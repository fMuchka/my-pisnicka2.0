import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './IconBackdrop.module.css';
import type { IconBackdropShape, IconBackdropSize } from './types';
import type { VariantClassMap } from '../types';

type IconBackdropProps = {
  shape?: IconBackdropShape | undefined;
  size?: IconBackdropSize | undefined;
  children: ReactNode;
};

const shapeClass: VariantClassMap<IconBackdropShape> = {
  circle: styles.iconBackdropCircle,
  rounded: styles.iconBackdropRounded,
};

const sizeClass: VariantClassMap<IconBackdropSize> = {
  md: styles.iconBackdropMd,
  lg: styles.iconBackdropLg,
};

export default function IconBackdrop({
  shape = 'circle',
  size = 'md',
  children,
}: IconBackdropProps) {
  return (
    <div className={cx(styles.iconBackdrop, shapeClass[shape], sizeClass[size])}>{children}</div>
  );
}
