import { HeartIcon, HomeIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantPropertyCard.module.css'

interface TenantPropertyCardProps {
    property: TenantProperty
    onDetails?: () => void
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
                    <HeartIcon className={styles.iconMedium} aria-hidden="true" />
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
                        <MapPinIcon className={styles.iconSmall} aria-hidden="true" />
                        <span>{t(property.areaKey)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <HomeIcon className={styles.iconSmall} aria-hidden="true" />
                        <span>
                            {t('tenantDashboard.property.roomsAvailable', {
                                available: property.availableRooms,
                                total: property.totalRooms,
                            })}
                        </span>
                    </div>
                    <div className={styles.metaItem}>
                        <UsersIcon className={styles.iconSmall} aria-hidden="true" />
                        <span>{t('tenantDashboard.property.roommates', { count: property.totalRooms - property.availableRooms + 1 })}</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.badges}>
                        <span className={`${styles.statusBadge} ${availability.statusClass}`}>
                            {t(availability.labelKey)}
                        </span>
                        <span className={styles.compatibilityBadge}>
                            <CheckIcon className={styles.iconTiny} aria-hidden="true" />
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
