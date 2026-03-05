import type { Timestamp } from 'firebase/firestore';

/**
 * Formats session age as human-readable Czech text (e.g., "před 2 hodinami", "před týdnem").
 */
export const formatSessionAge = (sessionCreatedAt: Timestamp) => {
  const hourDiff = calculateHourDiff(new Date(), sessionCreatedAt.toDate());
  return getSessionAgeText(hourDiff);
};

/**
 * Calculates difference between two dates in hours (rounded down).
 */
const calculateHourDiff = (dateA: Date, dateB: Date) => {
  const hourDiff = Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60));

  return hourDiff;
};

/**
 * Converts hour difference to Czech text with proper pluralization.
 */
const getSessionAgeText = (hours: number) => {
  if (hours === 0) {
    return 'před méně než 1 hodinou';
  }

  if (hours === 1) {
    return 'před 1 hodinou';
  }

  if (hours >= 2 && hours < 24) {
    return `před ${hours} hodinami`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return 'před 1 dnem';
  }

  if (days >= 2 && days < 7) {
    return `před ${days} dny`;
  }

  if (days >= 7 && days < 14) {
    return 'před týdnem';
  }

  if (days >= 14 && days < 30) {
    const weeks = Math.floor(days / 7);
    return `před ${weeks} týdny`;
  }

  if (days >= 30 && days < 60) {
    return 'před měsícem';
  }

  const months = Math.floor(days / 30);
  if (months >= 2 && months < 12) {
    return `před ${months} měsíci`;
  }

  if (months >= 12) {
    return 'před více než rokem';
  }

  return `před ${hours} hodinami`; // Fallback
};
