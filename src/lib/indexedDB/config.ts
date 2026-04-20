export const DB_NAME = 'mypisnicka';
export const DB_VERSION = 1;

// 30 days
export const VALID_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

export const CACHE_TIMESTAMP_KEY = 'mypisnicka_cache_ts';

export const STORES = {
  SONGS: 'songs',
} as const;
