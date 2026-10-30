import { Music, ArrowDown, Users } from 'lucide-react';
import type { Faq, Feature } from './types';

export const LOGO_SRC = '/mypisnicka-icon.svg';

export const FEATURES: Feature[] = [
  {
    icon: Music,
    title: 'Akordy a diagramy',
    text: 'Akordy nad textem, diagramy pro kytaru i ukulele, transpozice a capo.',
  },
  {
    icon: ArrowDown,
    title: 'Automatický posun',
    text: 'Text jede sám, rychlost si nastavíš a mezi sekcemi skáčeš jedním klepnutím.',
  },
  {
    icon: Users,
    title: 'Relace',
    text: 'Společné hraní v reálném čase — všichni koukají na stejnou píseň. (Posun se nesynchronizuje.)',
  },
];

export const FAQS: Faq[] = [
  {
    question: 'Jaké výhody má účet?',
    answer: 'Můžeš přidávat písně, ukládat si je do playlistů a vytvářet Relace.',
  },
  {
    question: 'Jak získám účet?',
    answer: 'Účet pro nové členy vytváří jen FM. Mít ho ale nemusíš — připojit se jde i bez účtu.',
  },
  {
    question: 'Kdo ručí za písně?',
    answer: 'Kdo píseň přidá, ten za ni odpovídá. Autor stránek za obsah písní neručí.',
  },
  {
    question: 'Co se o mně ukládá?',
    answer:
      'Jen pár dat v prohlížeči, aby aplikace fungovala. Sama se časem smažou. Žádná analytika, žádné reklamy.',
  },
];
