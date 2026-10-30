import type { ComponentProps } from 'react';
import { classNames } from '../../../lib/classNames';
import styles from './Button.module.css';
import type { ButtonIconPosition, ButtonRoleVariation, ButtonStyleVariation } from './types';
import type { Icon, VariantClassMap } from '../types';

type ButtonProps = ComponentProps<'button'> & {
  label?: string;
  colorVariation?: ButtonRoleVariation;
  styleVariation?: ButtonStyleVariation;
  icon?: Icon;
  iconPosition?: ButtonIconPosition;
};

const colorClass: VariantClassMap<ButtonRoleVariation> = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
};

const styleClass: VariantClassMap<ButtonStyleVariation> = {
  filled: styles.btnFilled,
  outlined: styles.btnOutlined,
  text: styles.btnText,
};

export default function Button({
  label = '',
  colorVariation = 'primary',
  styleVariation = 'filled',
  icon: Icon,
  iconPosition = 'prepend',
  className,
  ...buttonProps
}: Readonly<ButtonProps>) {
  const iconElement = Icon ? <Icon aria-hidden="true" /> : null;

  return (
    <button
      {...buttonProps}
      className={classNames(
        styles.btn,
        colorClass[colorVariation],
        styleClass[styleVariation],
        className
      )}
    >
      {iconPosition === 'prepend' && iconElement}
      {label && <span>{label}</span>}
      {iconPosition === 'append' && iconElement}
    </button>
  );
}
