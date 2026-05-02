import { useTranslation } from 'react-i18next'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantPropertyCard.module.css'

interface TenantPropertyCardProps {
    property: TenantProperty
    onDetails?: () => void
}

function MapPinIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    )
}

function HomeIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
    )
}

function UsersIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.278-2.18-.832-3.177a9.318 9.318 0 00-1.652-1.91c-.442-.536-.965-.95-1.542-1.22M15 10.475a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    )
}

function HeartIcon() {
    return (
        <svg className={styles.iconMedium} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg className={styles.iconTiny} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.22a1 1 0 111.416-1.414l4.03 4.03 6.542-6.544a1 1 0 011.42 0z" clipRule="evenodd" />
        </svg>
    )
}

const availabilityLabels: Record<TenantProperty['status'], { labelKey: string; statusClass: string }> = {
    available: { labelKey: 'tenantDashboard.property.status.available', statusClass: styles.available ?? '' },
    occupied: { labelKey: 'tenantDashboard.property.status.occupied', statusClass: styles.occupied ?? '' },
    full: { labelKey: 'tenantDashboard.property.status.full', statusClass: styles.full ?? '' },
}

export default function TenantPropertyCard({ property, onDetails = () => {} }: TenantPropertyCardProps) {
    const { t } = useTranslation()
    const availability = availabilityLabels[property.status]
    const image = property.images[0]

    return (
        <article
            onClick={onDetails}
            className={styles.card}
        >
            <div className={styles.imageWrap}>
                {image ? (
                    <img
                        src={image}
                        alt={t(property.titleKey)}
                        className={styles.image}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.imageFallback}>
                        {t('tenantDashboard.property.noImage')}
                    </div>
                )}
                <button
                    type="button"
                    className={styles.saveButton}
                    aria-label={t('tenantDashboard.property.save')}
                    onClick={(event) => event.stopPropagation()}
                >
                    <HeartIcon />
                </button>
            </div>

            <div className={styles.body}>
                <div className={styles.topLine}>
                    <div className={styles.titleBlock}>
                        <h3 className={styles.title}>
                            {t(property.titleKey)}
                        </h3>
                        <p className={styles.address}>{t(property.addressKey)}</p>
                    </div>
                    <div className={styles.priceBlock}>
                        <p className={styles.price}>
                            {property.rent}€
                            <span className={styles.perMonth}>{t('tenantDashboard.property.perMonth')}</span>
                        </p>
                        <span className={styles.perRoom}>{t('tenantDashboard.property.perRoom')}</span>
                    </div>
                </div>

                <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                        <MapPinIcon />
                        <span>{t(property.areaKey)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <HomeIcon />
                        <span>
                            {t('tenantDashboard.property.roomsAvailable', {
                                available: property.availableRooms,
                                total: property.totalRooms,
                            })}
                        </span>
                    </div>
                    <div className={styles.metaItem}>
                        <UsersIcon />
                        <span>{t('tenantDashboard.property.roommates', { count: property.totalRooms - property.availableRooms + 1 })}</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.badges}>
                        <span className={`${styles.statusBadge} ${availability.statusClass}`}>
                            {t(availability.labelKey)}
                        </span>
                        <span className={styles.compatibilityBadge}>
                            <CheckIcon />
                            {t('tenantDashboard.property.compatible', { count: property.compatibilityScore })}
                        </span>
                    </div>
                    <button
                        type="button"
                        className={styles.detailsButton}
                        onClick={(event) => {
                            event.stopPropagation()
                            onDetails()
                        }}
                    >
                        {t('tenantDashboard.property.details')}
                    </button>
                </div>
            </div>
        </article>
    )
}
