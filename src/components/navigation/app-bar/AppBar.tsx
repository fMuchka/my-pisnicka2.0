import { classNames } from '../../../lib/classNames';
import type { AppBarPage } from './types';
import { Link } from 'react-router';
import styles from './AppBar.module.css';

type AppBarProps = {
  pages: AppBarPage[];
  mainPage: AppBarPage;
  currentPageId: string;
};

export function AppBar({ currentPageId, mainPage, pages }: Readonly<AppBarProps>) {
  const pagesMidIndex = Math.ceil(pages.length / 2);
  const leftSidePages = pages.slice(0, pagesMidIndex);
  const rightSidePages = pages.slice(pagesMidIndex);

  const renderPages = [...leftSidePages, mainPage, ...rightSidePages];

  return (
    <nav className={styles.appBar}>
      {renderPages.map(({ icon: Icon, id, label, link }) => {
        const icon = (
          <Icon
            className={styles.tabIcon}
            aria-hidden="true"
          />
        );

        return (
          <Link
            key={id}
            to={link}
            className={classNames(
              styles.tab,
              id === currentPageId && styles.tabActive,
              id === mainPage.id && styles.tabMain
            )}
            aria-current={id === currentPageId ? 'page' : undefined}
          >
            {id === mainPage.id ? <span className={styles.tabMainCircle}>{icon}</span> : icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
