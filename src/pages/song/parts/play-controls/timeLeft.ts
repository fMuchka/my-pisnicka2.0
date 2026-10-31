/** `m:ss`, e.g. 80 → "1:20". */
export const formatTimeLeft = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
