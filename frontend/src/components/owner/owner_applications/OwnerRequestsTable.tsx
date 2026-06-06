import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardRequest } from '@/types/owner'

interface OwnerRequestsTableProps {
  requests: OwnerDashboardRequest[]
  onViewDetail?: (applicationID: string) => void
  onApprove?: (applicationID: string) => void
  onReject?: (applicationID: string) => void
  actingApplicationKey?: string | null
}

function formatRequestStatus(status: string) {
  if (status === 'FULLY_CONFIRMED') {
    return 'Aceptada'
  }
  if (status === 'REJECTED_BY_OWNER') {
    return 'Rechazada'
  }
  if (status === 'CANCELLED') {
    return 'Cancelada'
  }
  if (status === 'PENDING_CONFIRMED_TENANTS') {
    return 'Pendiente del grupo'
  }
  return 'Pendiente'
}

function formatRequestSource(request: OwnerDashboardRequest) {
  if (request.type === 'group' && request.group) {
    return `Grupo: ${request.group.name}`
  }
  return 'Solicitud individual'
}

export default function OwnerRequestsTable({ requests, onViewDetail, onApprove, onReject, actingApplicationKey }: OwnerRequestsTableProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.ownerTableWrap}>
      <table className={styles.ownerTable}>
        <thead>
          <tr>
            <th>{t('ownerDashboard.requests.tenant')}</th>
            <th>{t('ownerDashboard.requests.property')}</th>
            <th>Tipo</th>
            <th>{t('ownerDashboard.requests.status')}</th>
            <th>Compatibilidad</th>
            <th>{t('ownerDashboard.requests.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={6}>No hay solicitudes recibidas para tus pisos.</td>
            </tr>
          ) : requests.map((request) => {
            const isPending = request.status === 'PENDING_OWNER'
            const approveKey = `${request.id}:approve`
            const rejectKey = `${request.id}:reject`

            return (
              <tr key={request.id}>
                <td>
                  <strong>{request.type === 'group' ? request.group?.creator.name : request.tenant?.name}</strong>
                  <br />
                  {request.type === 'group'
                    ? `${formatRequestSource(request)} · ${request.group?.members.length ?? 0} miembros`
                    : request.tenant?.email}
                </td>
                <td>
                  <strong>{request.propertyTitle}</strong>
                  <br />
                  {request.address}
                </td>
                <td>
                  <strong>{request.type === 'group' ? 'Grupal' : 'Individual'}</strong>
                  <br />
                  {formatRequestSource(request)}
                </td>
                <td>
                  <span className={`${styles.ownerStatusBadge} ${styles.ownerStatusPending}`}>{formatRequestStatus(request.status)}</span>
                  <br />
                  {t('ownerDashboard.requests.requested', { date: request.createdAt })}
                </td>
                <td>
                  {request.compatibilityScore != null && request.compatibilityScore > 0 ? (
                    <span className={styles.ownerCompatBadge}>{request.compatibilityScore}%</span>
                  ) : (
                    <span className={styles.ownerCompatEmpty}>—</span>
                  )}
                </td>
                <td>
                  <div className={styles.ownerActionGroup}>
                    <button
                      type="button"
                      className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}
                      onClick={() => onViewDetail?.(request.id)}
                    >
                      Ver detalle
                    </button>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}
                          onClick={() => onApprove?.(request.id)}
                          disabled={actingApplicationKey === approveKey}
                        >
                          {actingApplicationKey === approveKey ? 'Aprobando...' : t('ownerDashboard.requests.accept')}
                        </button>
                        <button
                          type="button"
                          className={`${styles.ownerActionButton} ${styles.ownerActionReject}`}
                          onClick={() => onReject?.(request.id)}
                          disabled={actingApplicationKey === rejectKey}
                        >
                          {actingApplicationKey === rejectKey ? 'Rechazando...' : t('ownerDashboard.requests.reject')}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
