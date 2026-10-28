import { useState } from 'react';
import type { HomeTile } from './types';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { hasUnseenTimelineUpdates } from '../../lib/timeline/timeline';
import { NavTile } from '../../components/nav-tile';
import styles from './Home.module.css';
import Routes from '../../router/Routes';
import { PLACEHOLDER_USER_NAME, tiles } from './constants';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showInfoBadge, setShowInfoBadge] = useState(hasUnseenTimelineUpdates);

  const userName = user?.email?.trim().split('@')[0] || PLACEHOLDER_USER_NAME;

  // Info marks the timeline as visited itself; doing it here would hide its "new" highlights.
  const openTile = (tile: HomeTile) => {
    if (tile.route === Routes.Info) {
      setShowInfoBadge(false);
    }
    void navigate(tile.route);
  };

  return (
    <div
      className={styles.container}
      data-testid="home-view"
    >
      <header>
        <p className={styles.greetingEyebrow}>Vítej zpět</p>
        <h1 className={styles.greetingName}>{userName}</h1>
      </header>

      <nav
        className={styles.homeNav}
        aria-label="Home navigation"
      >
        {tiles.map((tile) => (
          <NavTile
            key={tile.route}
            label={tile.label}
            meta={tile.meta}
            icon={tile.icon}
            badge={tile.route === Routes.Info && showInfoBadge ? 'Nové' : undefined}
            onClick={() => openTile(tile)}
          />
        ))}
      </nav>
    </div>
  );
}
