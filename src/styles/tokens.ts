// Single source of truth for CSS custom properties. tokens.generated.css is built from this file
// (by the css-tokens Vite plugin), and code references tokens through cssVar()/cssVarName().
// Values may reference other tokens with a plain `var(--x)`; the tokens test checks those too.

type ThemedValue = { light: string; dark: string };
// null: no stylesheet default. The token is set from code or by a scoped rule in CSS_TOKEN_SCOPES.
type TokenValue = string | ThemedValue | null;

export const COLOR_PRESETS = ['red', 'orange', 'green', 'teal', 'blue', 'purple'] as const;

export const CSS_TOKENS = {
  /* Design system colors (MyPísnička design system) */
  surface: { light: '#fafaf9', dark: '#1c1917' },
  'surface-raised': { light: '#ffffff', dark: '#241b19' },
  'surface-secondary': { light: '#f5f5f4', dark: '#292524' },
  'surface-selected': { light: '#f4dcdb', dark: '#452928' },
  border: { light: '#e7e5e4', dark: '#44403c' },
  'border-soft': { light: 'rgba(231, 229, 228, 0.7)', dark: 'rgba(68, 64, 60, 0.7)' },
  ink: { light: '#1c1917', dark: '#fafaf9' },
  'ink-muted': { light: '#57534e', dark: '#a8a29e' },
  brand: { light: '#dc2626', dark: '#ef4444' },
  'brand-fill': '#dc2626',
  'brand-light': { light: '#ef4444', dark: '#f87171' },
  'brand-soft': { light: 'rgba(220, 38, 38, 0.14)', dark: 'rgba(239, 68, 68, 0.14)' },
  'on-brand': '#ffffff',
  danger: { light: '#b91c1c', dark: '#f87171' },
  'danger-fill': '#7f1d1d',
  'on-danger': '#fecaca',
  success: { light: '#15803d', dark: '#22c55e' },
  'accent-track': { light: '#b92222', dark: '#c93c3c' },
  'overlay-backdrop': 'rgba(0, 0, 0, 0.5)',
  'preset-red-vivid': { light: '#dc2626', dark: '#ef4444' },
  'preset-red-fill': '#dc2626',
  'preset-orange-vivid': { light: '#c2410c', dark: '#f97316' },
  'preset-orange-fill': '#c2410c',
  'preset-green-vivid': { light: '#15803d', dark: '#22c55e' },
  'preset-green-fill': '#15803d',
  'preset-teal-vivid': { light: '#0f766e', dark: '#14b8a6' },
  'preset-teal-fill': '#0f766e',
  'preset-blue-vivid': { light: '#2563eb', dark: '#3b82f6' },
  'preset-blue-fill': '#2563eb',
  'preset-purple-vivid': { light: '#9333ea', dark: '#c084fc' },
  'preset-purple-fill': '#9333ea',
  'preset-vivid': null,
  'preset-fill': null,

  /* Design system typography */
  'font-sans': "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  'font-mono': "'JetBrains Mono', 'Fira Code', monospace",
  'text-heading': '600 28px/42px var(--font-sans)',
  'text-display': '600 22px/28px var(--font-sans)',
  'text-body': '400 16px/24px var(--font-sans)',
  'text-label': '500 14px/21px var(--font-sans)',
  'text-button': '500 16px/24px var(--font-sans)',
  'text-button-compact': '600 16px/24px var(--font-sans)',
  'text-button-pill': '500 13px/18px var(--font-sans)',
  'text-title': '600 20px/30px var(--font-sans)',
  'text-title-compact': '600 16px/24px var(--font-sans)',
  'text-item-title': '600 18.4px/22.08px var(--font-sans)',
  'text-item-title-compact': '600 15px/20px var(--font-sans)',
  'text-item-meta': '500 15.2px/1.4 var(--font-sans)',
  'text-item-meta-compact': '500 12px/1.4 var(--font-sans)',
  'text-eyebrow': '600 12.48px/18.72px var(--font-sans)',
  'text-eyebrow-tracking': '0.4992px',
  'text-caption': '400 13.12px/19.68px var(--font-sans)',
  'text-badge-text': '700 11.84px/11.84px var(--font-sans)',
  'text-toggle': '400 12.8px/1.4 var(--font-sans)',
  'text-chip-text': '400 12.48px/1.4 var(--font-sans)',
  'text-lyric-line': '400 18px/1.4 var(--font-mono)',
  'text-chord-label': '400 16px/1.4 var(--font-mono)',

  /* Design system spacing */
  'space-xs': '4px',
  'space-sm': '8px',
  'space-md': '16px',
  'space-lg': '24px',
  'space-xl': '32px',
  'space-2xl': '48px',
  'space-3xl': '64px',

  /* Design system radius */
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-xl': '20px',
  'radius-full': '999px',

  /* Design system shadows */
  'shadow-raised': {
    light: '0px 4px 24px 0px rgba(28, 25, 23, 0.24)',
    dark: '0px 4px 24px 0px rgba(250, 250, 249, 0.24)',
  },
  'shadow-popover': {
    light: '0px 10px 22px 0px rgba(28, 25, 23, 0.12)',
    dark: '0px 10px 22px 0px rgba(250, 250, 249, 0.12)',
  },
  'shadow-panel': {
    light: '0px 18px 50px 0px rgba(28, 25, 23, 0.08)',
    dark: '0px 18px 50px 0px rgba(250, 250, 249, 0.14)',
  },

  /* App-specific — not (yet) covered by the design system */
  'text-disabled': { light: '#a8a29e', dark: '#78716c' },
  'text-chord': { light: '#292524', dark: '#e7e5e4' },
  'shadow-soft': {
    light: '0 2px 8px color-mix(in srgb, var(--ink) 16%, transparent)',
    dark: '0 2px 8px color-mix(in srgb, var(--ink) 20%, transparent)',
  },
  'shadow-accent': {
    light: '0 4px 12px color-mix(in srgb, var(--brand) 20%, transparent)',
    dark: '0 4px 12px color-mix(in srgb, var(--brand) 26%, transparent)',
  },
  'focus-ring-soft': {
    light: '0 0 0 3px color-mix(in srgb, var(--brand) 12%, transparent)',
    dark: '0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent)',
  },
  'surface-qr': { light: '#ffffff', dark: 'var(--surface)' },
  'text-qr': { light: '#111111', dark: 'var(--ink)' },
  'scrollbar-size': '8px',
  'scrollbar-size-desktop': '12px',
  'scrollbar-track': 'color-mix(in srgb, var(--ink) 8%, transparent)',
  'scrollbar-thumb': 'color-mix(in srgb, var(--brand) 50%, var(--border))',
  'scrollbar-thumb-active': 'color-mix(in srgb, var(--brand) 72%, var(--ink))',
  'section-verse-bg': { light: '#e7ece3', dark: '#2b312a' },
  'section-verse-border': { light: '#8ea27f', dark: '#7c8f6f' },
  'section-chorus-bg': { light: '#f1e6d6', dark: '#3a3328' },
  'section-chorus-border': { light: '#c19b6c', dark: '#b58a56' },
  'section-bridge-bg': { light: '#efe1d7', dark: '#3b2f2a' },
  'section-bridge-border': { light: '#b77a64', dark: '#a96f5b' },
  'section-intro-bg': { light: '#e3e8ee', dark: '#2c3138' },
  'section-intro-border': { light: '#7c8ea6', dark: '#6f829b' },
  'section-outro-bg': { light: '#f1dfe2', dark: '#3a2c2f' },
  'section-outro-border': { light: '#b36b72', dark: '#a36067' },
  'transition-fast': '150ms ease-out',
  'transition-normal': '200ms ease-out',
  'transition-slow': '300ms ease-out',

  /* Set from code */
  // Older components still read these instead of --brand; useTheme points them at the chosen preset.
  accent: null,
  'accent-light': null,
  'color-primary': null,
  'song-chord-inline-bg': null,
  'song-chord-inline-color': null,
  'chord-icon-contrast': null,
  'font-size-lyrics': null,
  'font-size-chords': null,
  'section-option-accent': null,
} as const satisfies Record<string, TokenValue>;

export type CssToken = keyof typeof CSS_TOKENS;

type ScopedRule = { selector: string; values: Partial<Record<CssToken, string>> };

// Red is the hand-tuned default above; the other presets derive their brand tokens.
// :root[...] outranks [data-theme='dark'], so these win in both themes.
export const CSS_TOKEN_SCOPES: ScopedRule[] = [
  {
    selector: ":root[data-color]:not([data-color='red'])",
    values: {
      brand: 'var(--preset-vivid)',
      'brand-fill': 'var(--preset-fill)',
      'brand-light': 'color-mix(in srgb, var(--preset-vivid) 80%, white)',
      'brand-soft': 'color-mix(in srgb, var(--preset-vivid) 14%, transparent)',
    },
  },
  ...COLOR_PRESETS.filter((preset) => preset !== 'red').map((preset) => ({
    selector: `:root[data-color='${preset}']`,
    values: {
      'preset-vivid': `var(--preset-${preset}-vivid)`,
      'preset-fill': `var(--preset-${preset}-fill)`,
    },
  })),
];

export const cssVarName = <T extends CssToken>(token: T) => `--${token}` as const;

export const cssVar = (token: CssToken, fallback?: string) =>
  fallback === undefined ? `var(--${token})` : `var(--${token}, ${fallback})`;
