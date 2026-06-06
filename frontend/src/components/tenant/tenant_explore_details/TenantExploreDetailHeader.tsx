import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { paths } from '@/routes/paths'
import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantProperty } from '@/types/tenant'

interface TenantExploreDetailHeaderProps {
  property: TenantProperty
  canApply: boolean
  canCancel: boolean
  canLeave: boolean
  hasActiveApplication: boolean
  isApplying: boolean
  onApply: () => void
  onCancel: () => void
  onLeave: () => void
}

export default function TenantExploreDetailHeader({
  property,
  canApply,
  canCancel,
  canLeave,
  hasActiveApplication,
  isApplying,
  onApply,
  onCancel,
  onLeave,
}: TenantExploreDetailHeaderProps) {
  const { t } = useTranslation()
  const showCancelButton = canCancel && hasActiveApplication
  const showApplyButton = canApply && !hasActiveApplication

  return (
    <>
      <div className={styles.breadcrumbs}>
        <Link to={paths.tenantExplore} className={styles.crumbLink}>{t('tenantDashboard.sidebar.explore')}</Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>{t(property.titleKey)}</span>
      </div>

      <div className={styles.topBar}>
        <Link to={paths.tenantExplore} className={styles.backButton}>
          <ArrowLeftIcon className={styles.iconSmall} aria-hidden="true" />
          {t('tenantDashboard.detail.backToResults')}
        </Link>
      </div>

      <section className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{t(property.titleKey)}</h1>
            <span className={styles.statusBadge}>{t(`tenantDashboard.property.status.${property.status}`)}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
              {t(property.addressKey)}
            </span>
            <button type="button" className={styles.mapLink}>{t('tenantDashboard.detail.viewOnMap')}</button>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.shareButton}>
            <ArrowUpTrayIcon className={styles.iconTiny} aria-hidden="true" />
            {t('tenantDashboard.detail.share')}
          </button>

          {canLeave ? (
            <button type="button" className={styles.leaveButton} onClick={onLeave} disabled={isApplying}>
              {isApplying ? t('tenantDashboard.detail.leaving') : t('tenantDashboard.detail.leaveApartment')}
            </button>
          ) : null}

          {showCancelButton ? (
            <button type="button" className={styles.applyButton} onClick={onCancel} disabled={isApplying}>
              {isApplying ? t('tenantDashboard.detail.cancelling') : t('tenantDashboard.detail.cancelApplication')}
            </button>
          ) : null}

          {showApplyButton ? (
            <button type="button" className={styles.applyButton} onClick={onApply} disabled={isApplying}>
              {isApplying ? t('tenantDashboard.detail.applying') : t('tenantDashboard.detail.apply')}
            </button>
          ) : null}
        </div>
      </section>
    </>
  )
}
