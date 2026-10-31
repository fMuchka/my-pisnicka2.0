import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Palette, Star } from 'lucide-react';
import { SegmentGroup } from '../../components/_core/segment-group';
import type { SegmentOption } from '../../components/_core/segment-group/types';
import { useAuth } from '../../hooks/useAuth';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { selectActiveSessionRoute, useSessionStore } from '../../stores/session';
import { FeatureSettings } from './parts/feature-settings/FeatureSettings';
import { VisualSettings } from './parts/visual-settings/VisualSettings';
import styles from './Settings.module.css';
import type { SettingsView } from './types';

const viewOptions: SegmentOption[] = [
  { value: 'visual', label: 'Vzhled', icon: Palette },
  { value: 'features', label: 'Funkce', icon: Star },
];

export default function Settings() {
  usePageNavigation({ pageTitle: 'Nastavení' });

  const [currentView, setCurrentView] = useState<SettingsView>('visual');

  const { isGuest } = useAuth();
  const activeSessionRoute = useSessionStore(selectActiveSessionRoute);

  // Guests have no tab bar or menu links, so give them a way back to their session.
  const sessionLink = isGuest ? activeSessionRoute : null;

  return (
    <section className={styles.container}>
      {sessionLink && (
        <Link
          to={sessionLink}
          className={styles.backLink}
        >
          <ChevronLeft
            className={styles.backIcon}
            aria-hidden="true"
          />
          Zpět do relace
        </Link>
      )}

      <SegmentGroup
        aria-label="Sekce nastavení"
        options={viewOptions}
        value={currentView}
        onValueChange={(value) => setCurrentView(value as SettingsView)}
      />

      {currentView === 'visual' && <VisualSettings />}
      {currentView === 'features' && <FeatureSettings />}
    </section>
  );
}
