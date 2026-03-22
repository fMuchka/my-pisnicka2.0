export type PIN = [string, string, string, string];

export const emptyPin = (): PIN => ['', '', '', ''];

export const normalizePin = (value: readonly string[]): PIN => {
  return [value[0] ?? '', value[1] ?? '', value[2] ?? '', value[3] ?? ''];
};

export const stringToPin = (value: string): PIN => {
  const digits = value.slice(0, 4).split('');
  return normalizePin(digits);
};
