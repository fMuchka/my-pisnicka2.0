import type { ReactNode } from 'react';
import { classNames } from '../../../lib/classNames';
import styles from './IconBackdrop.module.css';
import type { IconBackdropShape, IconBackdropSize } from './types';
import type { VariantClassMap } from '../types';

type IconBackdropProps = {
  shape?: IconBackdropShape;
  size?: IconBackdropSize;
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
}: Readonly<IconBackdropProps>) {
  return (
    <div className={classNames(styles.iconBackdrop, shapeClass[shape], sizeClass[size])}>
      {children}
    </div>
  );
}
