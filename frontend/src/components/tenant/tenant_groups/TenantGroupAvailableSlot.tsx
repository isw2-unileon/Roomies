import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroupDetail.module.css'

export default function TenantGroupAvailableSlot() {
    return (
        <article className={styles.availableSlot}>
            <div className={styles.slotInfo}>
                <span className={styles.slotIcon}>
                    <UserGroupIcon className={styles.iconMedium} aria-hidden="true" />
                </span>

                <div>
                    <h2 className={styles.slotTitle}>Plaza disponible</h2>
                    <p className={styles.slotText}>
                        Invita a otra persona compatible para completar el grupo.
                    </p>
                </div>
            </div>

            <button type="button" className={styles.inviteButton}>
                <PlusIcon className={styles.iconSmall} aria-hidden="true" />
                Invitar persona
            </button>
        </article>
    )
}