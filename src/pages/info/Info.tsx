import { History, Route, InfoIcon } from 'lucide-react';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useEffect, useState } from 'react';
import {
  getLastVisitedTimelineTime,
  markLatestTimelineAsVisited,
} from '../../lib/timeline/timeline';
import SegmentGroup from '../../components/_core/segment-group/SegmentGroup';
import type { SegmentOption } from '../../components/_core/segment-group/types';
import type { InfoTab } from './types';
import styles from './Info.module.css';
import { InfoGeneral } from './tabs/info-general/InfoGeneral';
import { InfoHistory } from './tabs/info-history/InfoHistory';
import { InfoRoadmap } from './tabs/info-roadmap/InfoRoadmap';

const tabOptions: SegmentOption[] = [
  { value: 'timeline', label: 'Historie', icon: History },
  { value: 'roadmap', label: 'Plány', icon: Route },
  { value: 'general-info', label: 'Obecné info', icon: InfoIcon },
];

export default function Info() {
  usePageNavigation({ pageTitle: 'Informace' });

  const [activeTab, setActiveTab] = useState<InfoTab>('timeline');
  // Read before the effect overwrites it, so Historie can still tell what is new.
  const [lastVisited] = useState(getLastVisitedTimelineTime);

  useEffect(() => {
    markLatestTimelineAsVisited();
  }, []);

  const showHistory = () => setActiveTab('timeline');

  return (
    <section className={styles.container}>
      <SegmentGroup
        aria-label="Navigace informační stránky"
        options={tabOptions}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as InfoTab)}
      />

      {activeTab === 'timeline' && <InfoHistory lastVisited={lastVisited} />}
      {activeTab === 'roadmap' && <InfoRoadmap onShowHistory={showHistory} />}
      {activeTab === 'general-info' && <InfoGeneral onShowHistory={showHistory} />}
    </section>
  );
}
