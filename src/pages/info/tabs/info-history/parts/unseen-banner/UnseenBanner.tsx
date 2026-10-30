import { Bell } from 'lucide-react';
import IconBackdrop from '../../../../../../components/_core/icon-backdrop/IconBackdrop';
import { formatChangeCount } from '../../../../../../lib/timeline/timeline';
import shared from '../../shared.module.css';
import styles from './UnseenBanner.module.css';

type UnseenBannerProps = {
  count: number;
};

export function UnseenBanner({ count }: Readonly<UnseenBannerProps>) {
  return (
    <div className={styles.unseenBanner}>
      <IconBackdrop>
        <Bell
          className={shared.iconSm}
          aria-hidden="true"
        />
      </IconBackdrop>
      <span className={styles.unseenText}>
        <strong>{formatChangeCount(count)} od tvé poslední návštěvy</strong>
        <span>Nové věci mají štítek Nové. Klepni na změnu pro detail.</span>
      </span>
    </div>
  );
}
