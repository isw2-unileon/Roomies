import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardRequest } from '@/types/owner'

interface OwnerRequestsTableProps {
  requests: OwnerDashboardRequest[]
}

export default function OwnerRequestsTable({ requests }: OwnerRequestsTableProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.ownerTableWrap}>
      <table className={styles.ownerTable}>
        <thead>
          <tr>
            <th>{t('ownerDashboard.requests.tenant')}</th>
            <th>{t('ownerDashboard.requests.property')}</th>
            <th>{t('ownerDashboard.requests.compatibility')}</th>
            <th>{t('ownerDashboard.requests.status')}</th>
            <th>{t('ownerDashboard.requests.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <strong>{request.tenant}</strong>
                <br />
                {request.profile}
              </td>
              <td>
                <strong>{request.property}</strong>
                <br />
                {request.address}
              </td>
              <td>
                <strong className={styles.ownerStrongPositive}>{request.compatibility}%</strong>
                <br />
                {t('ownerDashboard.requests.veryCompatible')}
              </td>
              <td>
                <span className={`${styles.ownerStatusBadge} ${styles.ownerStatusPending}`}>{t('ownerDashboard.requests.pending')}</span>
                <br />
                {t('ownerDashboard.requests.requested', { date: request.requestedAt })}
              </td>
              <td>
                <div className={styles.ownerActionGroup}>
                  <button type="button" className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}>
                    {t('ownerDashboard.requests.accept')}
                  </button>
                  <button type="button" className={`${styles.ownerActionButton} ${styles.ownerActionReject}`}>
                    {t('ownerDashboard.requests.reject')}
                  </button>
                  <button type="button" className={styles.ownerIconButton} aria-label={t('ownerDashboard.requests.moreActions')}>
                    <EllipsisVerticalIcon className={styles.ownerIconSmall} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
