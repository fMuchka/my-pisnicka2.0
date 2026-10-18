/** Joins class names, skipping falsy ones: `cx(styles.btn, isActive && styles.active)`. */
export const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');
