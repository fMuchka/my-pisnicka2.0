import { classNames } from '../../../../../../lib/classNames';
import type { VariantClassMap } from '../../../../../../components/_core/types';
import type { ChangeGroup, ChangeType } from '../../../../../../lib/timeline/timeline';
import { ChangeItem } from '../change-item/ChangeItem';
import { GROUP_ICONS } from '../../constants';
import styles from './ChangeGroupSection.module.css';

type ChangeGroupSectionProps = {
  group: ChangeGroup;
};

const titleClass: VariantClassMap<ChangeType> = {
  new: styles.groupTitleNew,
  improved: undefined,
  fix: undefined,
};

export function ChangeGroupSection({ group }: Readonly<ChangeGroupSectionProps>) {
  const Icon = group.type ? GROUP_ICONS[group.type] : null;

  return (
    <section className={styles.group}>
      {group.type && Icon && group.label && (
        <h3 className={classNames(styles.groupTitle, titleClass[group.type])}>
          <Icon
            className={styles.groupIcon}
            aria-hidden="true"
          />
          <span>{group.label}</span>
        </h3>
      )}

      <ul className={styles.changes}>
        {group.changes.map((change) => (
          <li key={change.text}>
            <ChangeItem change={change} />
          </li>
        ))}
      </ul>
    </section>
  );
}
