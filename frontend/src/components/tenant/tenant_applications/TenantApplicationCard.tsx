import {
    CheckCircleIcon,
    ClockIcon,
    EllipsisHorizontalIcon,
    ExclamationCircleIcon,
    HomeModernIcon,
    MapPinIcon,
    UserGroupIcon,
    UserIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'

import styles from '@/styles/TenantApplications.module.css'
import type { TenantApplication, ApplicationStatus } from '@/types/tenant'

interface TenantApplicationCardProps {
    application: TenantApplication
    onCancel?: (applicationId: string) => void
    isCancelling?: boolean
}

const statusLabels: Record<ApplicationStatus, string> = {
    pending: 'Pendiente',
    approved: 'Aceptada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
}

const statusBadgeStyles: Record<ApplicationStatus, string> = {
    pending: styles.pending ?? '',
    approved: styles.approved ?? '',
    rejected: styles.rejected ?? '',
    cancelled: styles.cancelled ?? '',
}

const statusMessageStyles: Record<ApplicationStatus, string> = {
    pending: styles.messagePending ?? '',
    approved: styles.messageApproved ?? '',
    rejected: styles.messageRejected ?? '',
    cancelled: styles.messageCancelled ?? '',
}

function getStatusIcon(status: ApplicationStatus) {
    if (status === 'approved') {
        return <CheckCircleIcon className={styles.iconMedium} aria-hidden="true" />
    }

    if (status === 'rejected') {
        return <XCircleIcon className={styles.iconMedium} aria-hidden="true" />
    }

    if (status === 'cancelled') {
        return <ExclamationCircleIcon className={styles.iconMedium} aria-hidden="true" />
    }

    return <ClockIcon className={styles.iconMedium} aria-hidden="true" />
}

export default function TenantApplicationCard({ application, onCancel, isCancelling = false }: TenantApplicationCardProps) {
	const groupMembersLabel = application.groupMembers.map((member) => member.name).join(', ')

    return (
        <article className={styles.card}>
            <img className={styles.image} src={application.image} alt="" loading="lazy" />

            <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                    <div>
                        <h2 className={styles.cardTitle}>{application.propertyTitle}</h2>
                        <p className={styles.location}>
                            <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                            {application.address}
                        </p>
                    </div>
                </div>

                <div className={styles.metaGrid}>
                    <span className={styles.metaItem}>
                        <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                        {application.places} plazas
                    </span>

                    <span className={styles.metaItem}>
                        <HomeModernIcon className={styles.iconSmall} aria-hidden="true" />
                        {application.size} m²
                    </span>

                    <span className={styles.metaItem}>
                        <UserIcon className={styles.iconSmall} aria-hidden="true" />
                        {application.bathrooms} baños
                    </span>
                </div>

                <span className={styles.applicationType}>
                    <UserGroupIcon className={styles.iconTiny} aria-hidden="true" />
                    {application.requestType}
                </span>

				{application.isGroupApplication ? (
					<div className={styles.groupDetails}>
						<p className={styles.groupMeta}><strong>Grupo:</strong> {application.groupName || 'Sin nombre'}</p>
						<p className={styles.groupMeta}><strong>Enviada por:</strong> {application.submittedByName || 'Creador del grupo'}</p>
						{application.groupMembers.length > 0 ? (
							<p className={styles.groupMeta}><strong>Miembros:</strong> {groupMembersLabel}</p>
						) : null}
					</div>
				) : null}
            </div>

            <aside className={styles.statusPanel} aria-label={`Estado de ${application.propertyTitle}`}>
                <div className={styles.statusHeader}>
                    <span className={`${styles.badge} ${statusBadgeStyles[application.status]}`}>
                        {statusLabels[application.status]}
                    </span>

                    <p className={styles.dateText}>{application.dateLabel}</p>

                    <p className={styles.compatibilityLabel}>
                        Compatibilidad
                        <span className={styles.compatibilityValue}>{application.compatibility}%</span>
                    </p>
                </div>

                <div className={`${styles.messageBox} ${statusMessageStyles[application.status]}`}>
                    {getStatusIcon(application.status)}
                    <span>{application.statusMessage}</span>
                </div>

                <div className={styles.actions}>
					{application.status === 'approved' ? (
                        <button type="button" className={styles.confirmButton}>
                            Confirmar plaza
                        </button>
					) : application.status === 'pending' && application.canCancel ? (
                        <button
                            type="button"
                            className={styles.detailsButton}
                            onClick={() => onCancel?.(application.id)}
                            disabled={isCancelling}
                        >
                            {isCancelling ? 'Anulando...' : 'Anular solicitud'}
                        </button>
					) : application.status === 'pending' ? (
						<button type="button" className={styles.detailsButton} disabled>
							Pendiente de revision
						</button>
                    ) : (
                        <button type="button" className={styles.detailsButton}>
                            Ver detalles
                        </button>
                    )}

                    <button
                        type="button"
                        className={styles.moreButton}
                        aria-label={`Más opciones de ${application.propertyTitle}`}
                    >
                        <EllipsisHorizontalIcon className={styles.iconMedium} aria-hidden="true" />
                    </button>
                </div>
            </aside>
        </article>
    )
}
