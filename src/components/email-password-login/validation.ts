// Accepts a plain user name, or an e-mail address when the value contains '@'.
export const validateUser = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (!trimmedValue.includes('@')) {
    return true;
  }

  return isEmail(trimmedValue);
};

// Same rule as /^[^\s@]+@[^\s@]+\.[^\s@]+$/, without the regex backtracking.
export const isEmail = (value: string): boolean => {
  if (/\s/.test(value)) {
    return false;
  }

  const atIndex = value.indexOf('@');
  const domain = value.slice(atIndex + 1);
  return atIndex > 0 && !domain.includes('@') && domain.slice(1, -1).includes('.');
};

export const validatePassword = (value: string): boolean => {
  return value.length > 0;
};
