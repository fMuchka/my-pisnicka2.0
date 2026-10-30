import { getRecentNewChanges } from '../../../../lib/timeline/timeline';
import { groupFeaturesByArea } from '../../../../lib/upcoming-features/upcomingFeatures';
import { RECENTLY_DONE_LIMIT } from './constants';
import { FeatureAreaSection } from './parts/feature-area-section/FeatureAreaSection';
import { RecentlyDone } from './parts/recently-done/RecentlyDone';
import styles from './InfoRoadmap.module.css';

type InfoRoadmapProps = {
  onShowHistory: () => void;
};

export function InfoRoadmap({ onShowHistory }: Readonly<InfoRoadmapProps>) {
  const groups = groupFeaturesByArea();
  const recentlyDone = getRecentNewChanges(RECENTLY_DONE_LIMIT);

  return (
    <div className={styles.roadmap}>
      <header className={styles.intro}>
        <h2 className={styles.introTitle}>Na čem se pracuje</h2>
        <p className={styles.introText}>
          Pořadí není pevné — co dozraje, to přijde. Hotové věci se stěhují do Historie.
        </p>
      </header>

      {groups.map((group) => (
        <FeatureAreaSection
          key={group.area ?? 'other'}
          group={group}
        />
      ))}

      {recentlyDone.length > 0 && (
        <RecentlyDone
          items={recentlyDone}
          onShowHistory={onShowHistory}
        />
      )}

      <p className={styles.outro}>Chybí ti tu něco? Řekni to FM.</p>
    </div>
  );
}
