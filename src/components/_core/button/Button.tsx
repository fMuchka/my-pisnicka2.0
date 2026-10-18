import type { ComponentProps } from 'react';
import { cx } from '../cx';
import styles from './Button.module.css';
import type { ButtonIcon, ButtonRoleVariation, ButtonStyleVariation } from './types';

type ButtonProps = ComponentProps<'button'> & {
  label?: string | undefined;
  colorVariation?: ButtonRoleVariation | undefined;
  styleVariation?: ButtonStyleVariation | undefined;
  icon?: ButtonIcon | undefined;
};

const colorClass: Record<ButtonRoleVariation, string | undefined> = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
};

const styleClass: Record<ButtonStyleVariation, string | undefined> = {
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
