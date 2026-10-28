import { cssVar } from '../../styles/tokens';

type Section = {
  color: string;
  label: string;
};

export type SectionTypes = 'intro' | 'verse' | 'bridge' | 'chorus' | 'outro';

export const SECTIONS_DICTIONARY: Record<SectionTypes, Section> = {
  intro: {
    label: 'Úvod',
    color: `color-mix(in srgb, #f59e0b 55%, ${cssVar('accent')})`,
  },
  verse: { label: 'Sloka', color: `color-mix(in srgb, #16a34a 42%, ${cssVar('accent')})` },
  chorus: { label: 'Refrén', color: `color-mix(in srgb, #0284c7 45%, ${cssVar('accent')})` },
  bridge: {
    label: 'Mezihra',
    color: `color-mix(in srgb, ${cssVar('section-bridge-border')} 70%, ${cssVar('accent')})`,
  },
  outro: { label: 'Závěr', color: `color-mix(in srgb, #dc2626 35%, ${cssVar('accent')})` },
} as const;

export const SECTION_TYPE_OPTIONS = Object.keys(SECTIONS_DICTIONARY) as SectionTypes[];
