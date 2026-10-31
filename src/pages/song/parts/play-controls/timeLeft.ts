import { useState } from 'react';

const TIME_LEFT_VISIBLE_STORAGE_KEY = 'my-pisnicka:play-time-left-visible';

/** `m:ss`, e.g. 80 → "1:20". */
export const formatTimeLeft = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const readVisible = () => {
  try {
    return localStorage.getItem(TIME_LEFT_VISIBLE_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

/** Whether the time left is shown, remembered across visits. Shown until the user hides it. */
export function useTimeLeftVisible() {
  const [visible, setVisible] = useState(readVisible);

  const toggle = () => {
    const next = !visible;
    setVisible(next);

    try {
      localStorage.setItem(TIME_LEFT_VISIBLE_STORAGE_KEY, String(next));
    } catch {
      // Storage blocked: the choice just lasts until the page is left.
    }
  };

  return [visible, toggle] as const;
}
