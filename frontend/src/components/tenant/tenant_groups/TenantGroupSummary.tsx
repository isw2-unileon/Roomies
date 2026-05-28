import type { TenantGroupDetailItem } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupSummaryProps {
  group: TenantGroupDetailItem
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
        <p>
          Presupuesto medio: {group.averageBudgetMin}€ - {group.averageBudgetMax}€
        </p>
      </div>
    </section>
  )
}
