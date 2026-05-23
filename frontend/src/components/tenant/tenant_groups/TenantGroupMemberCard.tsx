import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroupMember } from '@/types/tenant'

interface TenantGroupMemberCardProps {
    member: TenantGroupMember
}

export default function TenantGroupMemberCard({ member }: TenantGroupMemberCardProps) {
    return (
        <article className={styles.memberCard}>
            <div className={styles.memberMain}>
                <img
                    className={styles.memberAvatar}
                    src={member.avatar}
                    alt=""
                    loading="lazy"
                />

                <div className={styles.memberData}>
                    <div className={styles.memberNameRow}>
                        {member.isCurrentUser ? (
                            <span className={styles.youBadge}>Tú</span>
                        ) : null}

                        <h2 className={styles.memberName}>
                            {member.name}, {member.age}
                        </h2>
                    </div>

                    <p className={styles.memberStudies}>{member.studies}</p>

                    <div className={styles.tags}>
                        {member.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {member.role ? (
                <span className={styles.roleBadge}>{member.role}</span>
            ) : (
                <span />
            )}

            <div className={styles.compatibilityBlock}>
                <span className={styles.compatibilityLabel}>
                    Compatibilidad con el grupo
                </span>
                <strong className={styles.compatibilityValue}>
                    {member.compatibility}%
                </strong>
                <span className={styles.compatibilityText}>
                    Muy compatible
                </span>
            </div>

            <button
                type="button"
                className={styles.memberOptionsButton}
                aria-label={`Más opciones de ${member.name}`}
            >
                <EllipsisHorizontalIcon className={styles.iconMedium} aria-hidden="true" />
            </button>
        </article>
    )
}