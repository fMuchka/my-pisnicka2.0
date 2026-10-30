import { Tabs } from '@ark-ui/react';
import { History, Route, InfoIcon } from 'lucide-react';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useEffect, useState } from 'react';
import {
  getLastVisitedTimelineTime,
  markLatestTimelineAsVisited,
} from '../../lib/timeline/timeline';
import type { InfoTab } from './types';
import styles from './Info.module.css';
import { InfoGeneral } from './tabs/info-general/InfoGeneral';
import { InfoHistory } from './tabs/info-history/InfoHistory';
import { InfoRoadmap } from './tabs/info-roadmap/InfoRoadmap';

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
      <Tabs.Root
        value={activeTab}
        onValueChange={(details) => setActiveTab(details.value as InfoTab)}
        className={styles.infoTabs}
        lazyMount
        unmountOnExit
        aria-label="Navigace informační stránky"
      >
        <Tabs.List className={styles.tabsList}>
          <Tabs.Trigger
            className={styles.tabsTrigger}
            value="timeline"
          >
            <History className={styles.tabsIcon} />
            <span>Historie</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            className={styles.tabsTrigger}
            value="roadmap"
          >
            <Route className={styles.tabsIcon} />
            <span>Plány</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            className={styles.tabsTrigger}
            value="general-info"
          >
            <InfoIcon className={styles.tabsIcon} />
            <span>Obecné info</span>
          </Tabs.Trigger>
          <Tabs.Indicator className={styles.tabsIndicator} />
        </Tabs.List>

        <Tabs.Content
          className={styles.tabsContent}
          value="timeline"
        >
          <InfoHistory lastVisited={lastVisited} />
        </Tabs.Content>

        <Tabs.Content
          className={styles.tabsContent}
          value="roadmap"
        >
          <InfoRoadmap onShowHistory={showHistory} />
        </Tabs.Content>

        <Tabs.Content
          className={styles.tabsContent}
          value="general-info"
        >
          <InfoGeneral onShowHistory={showHistory} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
