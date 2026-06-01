import type { TenantGroupDetailItem } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupSummaryProps {
  group: TenantGroupDetailItem
}

function formatApartmentRequestStatus(status: string) {
	if (status === 'FULLY_CONFIRMED') {
		return 'Aceptada por el propietario'
	}
	if (status === 'REJECTED_BY_OWNER') {
		return 'Rechazada por el propietario'
	}
	if (status === 'CANCELLED') {
		return 'Cancelada'
	}
	if (status === 'PENDING_CONFIRMED_TENANTS') {
		return 'Pendiente de confirmacion del grupo'
	}
	return 'Pendiente de revision del propietario'
}

export default function TenantGroupSummary({ group }: TenantGroupSummaryProps) {
  return (
    <section className={styles.summarySection}>
      <h2 className={styles.groupTitle}>{group.name}</h2>
      <p className={group.isFullyAccepted ? styles.acceptedText : styles.pendingText}>
        {group.isFullyAccepted ? 'Grupo totalmente aceptado' : 'Pendiente de aceptacion del grupo'}
      </p>
      <p className={styles.groupDescription}>{group.description}</p>

      <div className={styles.groupMeta}>
        {group.apartment ? (
          <p>
            Piso: {group.apartment.title} · {group.apartment.address} · {group.apartment.availableSpots} plazas disponibles · {group.apartment.baseRent}€/mes
          </p>
        ) : (
          <p>Sin piso asignado</p>
        )}
        <p>
          Miembros aceptados: {group.acceptedMembersCount} · Invitaciones pendientes: {group.pendingInvitationsCount}
        </p>
				{group.currentApartmentRequest ? (
					<p>
						Estado de la solicitud grupal: {formatApartmentRequestStatus(group.currentApartmentRequest.status)}
					</p>
				) : null}
        <p>
          Presupuesto medio: {group.averageBudgetMin}€ - {group.averageBudgetMax}€
        </p>
      </div>
    </section>
  )
}
