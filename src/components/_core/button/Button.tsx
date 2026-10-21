import type { ComponentProps } from 'react';
import { cx } from '../cx';
import styles from './Button.module.css';
import type { ButtonIcon, ButtonRoleVariation, ButtonStyleVariation } from './types';
import type { VariantClassMap } from '../types';

type ButtonProps = ComponentProps<'button'> & {
  label?: string;
  colorVariation?: ButtonRoleVariation;
  styleVariation?: ButtonStyleVariation;
  icon?: ButtonIcon;
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
  icon,
  className,
  ...buttonProps
}: ButtonProps) {
  const Icon = icon?.component;
  const iconElement = Icon ? <Icon {...icon.props} /> : null;

  return (
    <button
      {...buttonProps}
      className={cx(styles.btn, colorClass[colorVariation], styleClass[styleVariation], className)}
    >
      {icon?.position === 'prepend' && iconElement}
      {label && <span>{label}</span>}
      {icon?.position !== 'prepend' && iconElement}
    </button>
  );
}
