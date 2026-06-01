import {
    BanknotesIcon,
    HomeIcon,
    MapPinIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroups.module.css'
import type { TenantGroupListItem, TenantGroupUserRelation } from '@/types/tenant'

interface TenantGroupCardProps {
    group: TenantGroupListItem
    onViewGroup: (group: TenantGroupListItem) => void
    onAcceptInvitation: (group: TenantGroupListItem) => void
    onRejectInvitation: (group: TenantGroupListItem) => void
    isRespondingInvitation?: boolean
}

const relationLabels: Record<TenantGroupUserRelation, string> = {
    creator: 'Creador',
    member: 'Miembro',
    pending_invitation: 'Invitación pendiente',
    viewer: 'Disponible',
}

function getRelationClassName(relation: TenantGroupUserRelation) {
    if (relation === 'creator') {
        return styles.relationCreator
    }

    if (relation === 'member') {
        return styles.relationMember
    }

    if (relation === 'viewer') {
        return styles.relationViewer
    }

    return styles.relationPending
}

function formatBudget(min: number, max: number) {
    if (min <= 0 && max <= 0) {
        return 'Sin presupuesto definido'
    }

    if (min === max) {
        return `${min}€`
    }

    return `${min}€ - ${max}€`
}

function formatApartmentSpots(group: TenantGroupListItem) {
    if (!group.apartment) {
        return 'Sin límite definido'
    }

    return `${group.apartment.availableSpots} plazas disponibles`
}

function formatApartmentRequestStatus(status: string) {
	if (status === 'FULLY_CONFIRMED') {
		return 'Solicitud grupal aceptada'
	}
	if (status === 'REJECTED_BY_OWNER') {
		return 'Solicitud grupal rechazada'
	}
	if (status === 'CANCELLED') {
		return 'Solicitud grupal cancelada'
	}
	if (status === 'PENDING_CONFIRMED_TENANTS') {
		return 'Pendiente del grupo'
	}
	return 'Solicitud grupal pendiente'
}

export default function TenantGroupCard({
    group,
    onViewGroup,
    onAcceptInvitation,
    onRejectInvitation,
    isRespondingInvitation = false,
}: TenantGroupCardProps) {
    const hasPendingInvitation = group.userRelation === 'pending_invitation'
    const relationClassName = `${styles.relationBadge} ${getRelationClassName(group.userRelation)}`

    return (
        <article className={styles.groupCard}>
            {group.apartment?.imageUrl ? (
                <img
                    className={styles.groupImage}
                    src={group.apartment.imageUrl}
                    alt=""
                    loading="lazy"
                />
            ) : (
                <div className={styles.groupPlaceholderImage}>
                    <HomeIcon className={styles.iconMedium} aria-hidden="true" />
                    <span>Sin piso asignado</span>
                </div>
            )}

            <div className={styles.groupInfo}>
                <div className={styles.groupTitleRow}>
                    <h2 className={styles.groupTitle}>{group.name}</h2>
                    <span className={relationClassName}>
                        {relationLabels[group.userRelation]}
                    </span>
                    <span className={group.isFullyAccepted ? styles.acceptedBadge : styles.pendingBadge}>
                        {group.isFullyAccepted ? 'Aceptacion completa' : 'Pendiente de aceptacion'}
                    </span>
                </div>

                {group.apartment ? (
                    <p className={styles.location}>
                        <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                        {group.apartment.area} · {group.apartment.address}
                    </p>
                ) : (
                    <p className={styles.apartmentEmpty}>
                        <HomeIcon className={styles.iconTiny} aria-hidden="true" />
                        Sin piso asignado
                    </p>
                )}

                <p className={styles.description}>{group.description}</p>

                <div className={styles.groupBottom}>
                    <div className={styles.groupStats}>
                        <span>{group.acceptedMembersCount} miembros aceptados</span>
                        <span>{group.pendingInvitationsCount} invitaciones pendientes</span>
						{group.currentApartmentRequest ? <span>{formatApartmentRequestStatus(group.currentApartmentRequest.status)}</span> : null}
                    </div>
                </div>
            </div>

            <aside className={styles.groupMeta}>
                <span className={styles.metaItem}>
                    <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                    {formatApartmentSpots(group)}
                </span>

                <span className={styles.metaItem}>
                    <BanknotesIcon className={styles.iconSmall} aria-hidden="true" />
                    Presupuesto: {formatBudget(group.averageBudgetMin, group.averageBudgetMax)}
                </span>

                {group.apartment ? (
                    <span className={styles.metaItem}>
                        <HomeIcon className={styles.iconSmall} aria-hidden="true" />
                        {group.apartment.title} · {group.apartment.baseRent}€/mes
                    </span>
                ) : (
                    <span className={`${styles.metaItem} ${styles.apartmentStatus}`}>
                        <HomeIcon className={styles.iconSmall} aria-hidden="true" />
                        Grupo sin vivienda vinculada
                    </span>
                )}

                <div className={styles.cardButtonRow}>
                    <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => onViewGroup(group)}
                    >
                        Ver grupo
                    </button>

                    {hasPendingInvitation ? (
                        <div className={styles.invitationActions}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => onAcceptInvitation(group)}
                                disabled={isRespondingInvitation}
                            >
                                {isRespondingInvitation ? 'Aceptando...' : 'Aceptar'}
                            </button>

                            <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => onRejectInvitation(group)}
                                disabled={isRespondingInvitation}
                            >
                                Rechazar
                            </button>
                        </div>
                    ) : null}
                </div>
            </aside>
        </article>
    )
}
