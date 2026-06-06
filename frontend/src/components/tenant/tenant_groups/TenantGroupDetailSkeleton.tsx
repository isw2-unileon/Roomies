import styles from '@/styles/TenantGroupDetail.module.css'

export default function TenantGroupDetailSkeleton() {
    return (
        <div className={styles.detailContainer}>
            <section className={styles.apartmentHeroSection}>
                <div className={`${styles.skeleton} ${styles.skeletonHero}`} aria-hidden="true" />
                <div className={styles.apartmentHeroBody}>
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`} aria-hidden="true" />
                    <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} aria-hidden="true" />
                    <div className={styles.summaryChips}>
                        <div className={`${styles.skeleton} ${styles.skeletonChip}`} aria-hidden="true" />
                        <div className={`${styles.skeleton} ${styles.skeletonChip}`} aria-hidden="true" />
                        <div className={`${styles.skeleton} ${styles.skeletonChip}`} aria-hidden="true" />
                    </div>
                </div>
            </section>

            <section className={styles.summarySection}>
                <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} aria-hidden="true" />
                <div className={`${styles.skeleton} ${styles.skeletonLine}`} aria-hidden="true" style={{ marginTop: '0.6rem' }} />
                <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} aria-hidden="true" style={{ marginTop: '0.45rem' }} />
            </section>

            <section className={styles.membersSection}>
                <div className={styles.sectionHeader}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} aria-hidden="true" />
                    <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineVeryShort}`} aria-hidden="true" />
                </div>
                <div className={styles.membersList}>
                    <div className={`${styles.skeleton} ${styles.skeletonMemberCard}`} aria-hidden="true" />
                    <div className={`${styles.skeleton} ${styles.skeletonMemberCard}`} aria-hidden="true" />
                </div>
            </section>

            <section className={styles.budgetSection}>
                <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} aria-hidden="true" />
                <div className={`${styles.skeleton} ${styles.skeletonLine}`} aria-hidden="true" style={{ marginTop: '0.6rem' }} />
            </section>
        </div>
    )
}
