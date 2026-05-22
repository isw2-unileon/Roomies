import { AcademicCapIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroups.module.css'
import type { TenantGroup } from '@/types/tenant'

interface TenantGroupCardProps {
    group: TenantGroup
    onViewGroup: (group: TenantGroup) => void
}

export default function TenantGroupCard({ group, onViewGroup }: TenantGroupCardProps) {
    const remainingMembers = Math.max(group.maxMembers - group.memberAvatars.length, 0)

    return (
        <article className={styles.groupCard}>
            <img className={styles.groupImage} src={group.image} alt="" loading="lazy" />

            <div className={styles.groupInfo}>
                <div className={styles.groupTitleRow}>
                    <h2 className={styles.groupTitle}>{group.title}</h2>
                    {group.badge ? <span className={styles.newBadge}>{group.badge}</span> : null}
                </div>

                <p className={styles.location}>
                    <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                    {group.location}
                </p>

                <p className={styles.description}>{group.description}</p>

                <div className={styles.groupBottom}>
                    <div className={styles.avatarStack}>
                        {group.memberAvatars.map((avatar) => (
                            <img key={avatar} className={styles.avatar} src={avatar} alt="" loading="lazy" />
                        ))}

                        {remainingMembers > 0 ? (
                            <span className={styles.extraAvatar}>+{remainingMembers}</span>
                        ) : null}
                    </div>

                    <div className={styles.groupStats}>
                        <span>{group.members} miembros</span>
                        <span>Presupuesto: {group.budget}</span>
                    </div>
                </div>
            </div>

            <aside className={styles.groupMeta}>
                <span className={styles.metaItem}>
                    <AcademicCapIcon className={styles.iconSmall} aria-hidden="true" />
                    {group.university}
                </span>

                <span className={styles.metaItem}>
                    <CalendarDaysIcon className={styles.iconSmall} aria-hidden="true" />
                    Entrada: {group.entryDate}
                </span>

                <button type="button" className={styles.viewButton} onClick={() => onViewGroup(group)}>
                    Ver grupo
                </button>
            </aside>
        </article>
    )
}