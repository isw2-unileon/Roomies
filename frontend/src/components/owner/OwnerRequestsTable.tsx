import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardRequest } from '@/types/owner'

interface OwnerRequestsTableProps {
  requests: OwnerDashboardRequest[]
}

export default function OwnerRequestsTable({ requests }: OwnerRequestsTableProps) {
  return (
    <div className={styles.ownerTableWrap}>
      <table className={styles.ownerTable}>
        <thead>
          <tr>
            <th>Inquilino</th>
            <th>Piso</th>
            <th>Compatibilidad</th>
            <th>Estado</th>
            <th>Acciones</th>
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
                Muy compatible
              </td>
              <td>
                <span className={`${styles.ownerStatusBadge} ${styles.ownerStatusPending}`}>Pendiente</span>
                <br />
                Solicitado {request.requestedAt}
              </td>
              <td>
                <div className={styles.ownerActionGroup}>
                  <button type="button" className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}>
                    Aceptar
                  </button>
                  <button type="button" className={`${styles.ownerActionButton} ${styles.ownerActionReject}`}>
                    Rechazar
                  </button>
                  <button type="button" className={styles.ownerIconButton} aria-label="Mas acciones">
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
