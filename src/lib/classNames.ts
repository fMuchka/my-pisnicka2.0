/** Joins class names, skipping falsy ones: `classNames(styles.btn, isActive && styles.active)`. */
export const classNames = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(' ');
