import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import TenantLayout from '@/components/tenant/TenantLayout'
import TenantGroupCard from '@/components/tenant/tenant_groups/TenantGroupCard'
import TenantGroupDetail from '@/components/tenant/tenant_groups/TenantGroupDetail'
import TenantGroupFilters from '@/components/tenant/tenant_groups/TenantGroupFilters'
import type { TenantGroupDisplayStatus } from '@/components/tenant/tenant_groups/groupDisplayStatus'
import {
    acceptTenantGroup,
    createTenantGroupApartmentApplication,
    acceptTenantGroupInvitation,
    createTenantGroupJoinRequest,
    deleteTenantGroup,
    getTenantGroup,
    inviteUsersToTenantGroup,
    listTenantGroupJoinRequests,
    listTenantGroups,
    rejectTenantGroupInvitation,
    voteTenantGroupJoinRequest,
    updateTenantGroupApartment,
} from '@/services/tenantService'
import styles from '@/styles/TenantGroups.module.css'
import type { TenantGroupDetailItem, TenantGroupListItem, TenantProperty } from '@/types/tenant'
import { paths } from '@/routes/paths'

function memberFilterToNumber(value: string) {
    if (value === 'all') {
        return undefined
    }

    if (value === '5+') {
        return 5
    }

    const parsedValue = Number(value)
    return Number.isNaN(parsedValue) ? undefined : parsedValue
}

export default function TenantGroupsPage() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState<TenantGroupListItem[]>([])
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<TenantGroupDisplayStatus>('all')
    const [hasApartment, setHasApartment] = useState('all')
    const [selectedMembers, setSelectedMembers] = useState('all')
    const [sort, setSort] = useState('recent')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<TenantGroupDetailItem | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [acceptingGroupId, setAcceptingGroupId] = useState<string | null>(null)
    const [creatingApartmentApplicationGroupId, setCreatingApartmentApplicationGroupId] = useState<string | null>(null)
    const [creatingJoinRequestGroupId, setCreatingJoinRequestGroupId] = useState<string | null>(null)
    const [votingJoinRequestKey, setVotingJoinRequestKey] = useState<string | null>(null)
    const [linkingApartmentGroupId, setLinkingApartmentGroupId] = useState<string | null>(null)
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
    const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null)

    const loadGroups = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const loadedGroups = await listTenantGroups({
                search,
                status,
                hasApartment,
                members: memberFilterToNumber(selectedMembers),
                sort,
            })

            setGroups(loadedGroups)
        } catch (loadError) {
            setGroups([])
            setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus grupos.')
        } finally {
            setLoading(false)
        }
    }, [hasApartment, search, selectedMembers, sort, status])

    useEffect(() => {
        void loadGroups()
    }, [loadGroups])

    function handleClearFilters() {
        setSearch('')
        setStatus('all')
        setHasApartment('all')
        setSelectedMembers('all')
        setSort('recent')
        setNotice('')
    }

    async function handleViewGroup(group: TenantGroupListItem) {
        setError('')
        setNotice('')
        setLoadingDetail(true)

        try {
            const detail = await getTenantGroup(group.id)
            setSelectedGroup(detail)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del grupo.')
        } finally {
            setLoadingDetail(false)
        }
    }

    async function handleAcceptInvitation(group: TenantGroupListItem) {
        if (!group.invitationId) {
            setError('No se ha encontrado la invitación asociada a este grupo.')
            return
        }

        setRespondingInvitationId(group.invitationId)
        setError('')
        setNotice('')

        try {
            await acceptTenantGroupInvitation(group.invitationId)
            setNotice('Invitación aceptada. Pendiente de aprobación del grupo.')
            if (selectedGroup?.id === group.id) {
                const detail = await getTenantGroup(group.id)
                setSelectedGroup(detail)
            }
            await loadGroups()
        } catch (acceptError) {
            setError(acceptError instanceof Error ? acceptError.message : 'No se pudo aceptar la invitación.')
        } finally {
            setRespondingInvitationId(null)
        }
    }

    async function handleRejectInvitation(group: TenantGroupListItem) {
        if (!group.invitationId) {
            setError('No se ha encontrado la invitación asociada a este grupo.')
            return
        }

        setRespondingInvitationId(group.invitationId)
        setError('')
        setNotice('')

        try {
            await rejectTenantGroupInvitation(group.invitationId)
            setNotice('Invitación rechazada correctamente.')
            await loadGroups()
        } catch (rejectError) {
            setError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la invitación.')
        } finally {
            setRespondingInvitationId(null)
        }
    }

    async function handleAcceptGroup(group: TenantGroupDetailItem) {
        setAcceptingGroupId(group.id)
        setError('')
        setNotice('')

        try {
            await acceptTenantGroup(group.id)
            setNotice('Has aceptado el grupo correctamente.')
            const detail = await getTenantGroup(group.id)
            setSelectedGroup(detail)
            await loadGroups()
        } catch (acceptError) {
            setError(acceptError instanceof Error ? acceptError.message : 'No se pudo aceptar el grupo.')
        } finally {
            setAcceptingGroupId(null)
        }
    }

    async function handleCreateJoinRequest(group: TenantGroupDetailItem) {
        setCreatingJoinRequestGroupId(group.id)
        setError('')
        setNotice('')

        try {
            await createTenantGroupJoinRequest(group.id)
            setNotice('Solicitud enviada al grupo.')
            const detail = await getTenantGroup(group.id)
            setSelectedGroup(detail)
            await loadGroups()
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud.')
        } finally {
            setCreatingJoinRequestGroupId(null)
        }
    }

	async function handleCreateApartmentApplication(group: TenantGroupDetailItem) {
		setCreatingApartmentApplicationGroupId(group.id)
		setError('')
		setNotice('')

		try {
			const result = await createTenantGroupApartmentApplication(group.id)
			setNotice(result.created ? 'Solicitud grupal enviada al propietario del piso.' : 'Ya existia una solicitud grupal para este piso. Se muestra su estado actual.')
			const detail = await getTenantGroup(group.id)
			setSelectedGroup(detail)
			await loadGroups()
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud grupal al piso.')
		} finally {
			setCreatingApartmentApplicationGroupId(null)
		}
	}

	async function handleLinkApartment(group: TenantGroupDetailItem, apartment: TenantProperty) {
		setLinkingApartmentGroupId(group.id)
		setError('')
		setNotice('')

		try {
			await updateTenantGroupApartment(group.id, apartment.id)
			setNotice('Vivienda vinculada correctamente al grupo.')
			const detail = await getTenantGroup(group.id)
			setSelectedGroup(detail)
			await loadGroups()
		} catch (linkError) {
			setError(linkError instanceof Error ? linkError.message : 'No se pudo vincular la vivienda al grupo.')
		} finally {
			setLinkingApartmentGroupId(null)
		}
	}

    async function handleInviteMembers(group: TenantGroupDetailItem, invitedUserIDs: string[]) {
        setInvitingGroupId(group.id)
        setError('')
        setNotice('')

        try {
            await inviteUsersToTenantGroup(group.id, invitedUserIDs)
            setNotice('Invitaciones enviadas correctamente.')
            const detail = await getTenantGroup(group.id)
            setSelectedGroup(detail)
            await loadGroups()
        } catch (inviteError) {
            setError(inviteError instanceof Error ? inviteError.message : 'No se pudo invitar a los nuevos miembros.')
            throw inviteError
        } finally {
            setInvitingGroupId(null)
        }
    }

    async function handleDeleteGroup(group: TenantGroupDetailItem) {
        const confirmed = window.confirm('Eliminar grupo\n\n¿Seguro que quieres eliminar este grupo? Esta accion no se puede deshacer.')
        if (!confirmed) {
            return
        }

        setDeletingGroupId(group.id)
        setError('')
        setNotice('')

        try {
            await deleteTenantGroup(group.id)
            setSelectedGroup(null)
            setNotice('Grupo eliminado correctamente.')
            await loadGroups()
            navigate(paths.tenantGroups)
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el grupo.')
        } finally {
            setDeletingGroupId(null)
        }
    }

    async function handleVoteJoinRequest(groupID: string, requestID: string, decision: 'APPROVE' | 'REJECT') {
        setVotingJoinRequestKey(`${requestID}:${decision}`)
        setError('')
        setNotice('')

        try {
            await voteTenantGroupJoinRequest(groupID, requestID, decision)
            const [detail, joinRequests] = await Promise.all([
                getTenantGroup(groupID),
                listTenantGroupJoinRequests(groupID),
            ])
            setSelectedGroup({ ...detail, joinRequests })
            await loadGroups()
        } catch (voteError) {
            setError(voteError instanceof Error ? voteError.message : 'No se pudo registrar el voto.')
        } finally {
            setVotingJoinRequestKey(null)
        }
    }

    return (
        <TenantLayout>
            <div className={styles.content}>
                <section className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Mis grupos</h1>
                        <p className={styles.subtitle}>
                            Gestiona los grupos que has creado, aquellos en los que participas y tus invitaciones pendientes.
                        </p>
                    </div>
                </section>

                <div className={styles.pageGrid}>
                    <section className={styles.mainColumn}>
                        <div className={styles.toolbar}>
                            <label className={styles.searchBox}>
                                <MagnifyingGlassIcon
                                    className={styles.iconSmall}
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar grupos por nombre o descripción..."
                                    aria-label="Buscar grupos"
                                />
                            </label>

                            <div className={styles.toolbarActions}>
                                <button
                                    type="button"
                                    className={styles.createButton}
                                    onClick={() => navigate(paths.tenantCreateGroup)}
                                >
                                    <UserGroupIcon
                                        className={styles.iconSmall}
                                        aria-hidden="true"
                                    />
                                    Crear grupo
                                </button>
                            </div>
                        </div>

                        <div className={styles.resultsBar}>
                            <span>
                                {loading ? 'Cargando grupos...' : `${groups.length} grupos encontrados`}
                            </span>

                            <label className={styles.sortControl}>
                                Ordenar por:
                                <select
                                    className={styles.sortSelect}
                                    value={sort}
                                    onChange={(event) => setSort(event.target.value)}
                                >
                                    <option value="recent">Más recientes</option>
                                    <option value="members">Número de miembros</option>
                                    <option value="budget">Presupuesto</option>
                                </select>
                            </label>
                        </div>

                        {notice ? (
                            <div className={styles.statusMessage}>
                                {notice}
                            </div>
                        ) : null}

                        {error ? (
                            <div className={styles.errorState}>
                                {error}
                            </div>
                        ) : null}

                        {loading ? (
                            <div className={styles.loadingState}>
                                Cargando tus grupos...
                            </div>
                        ) : (
                            <div className={styles.groupList}>
                                {groups.length > 0 ? (
                                    groups.map((group) => (
                                        <TenantGroupCard
                                            key={group.id}
                                            group={group}
                                            onViewGroup={handleViewGroup}
                                            onAcceptInvitation={handleAcceptInvitation}
                                            onRejectInvitation={handleRejectInvitation}
                                            isRespondingInvitation={respondingInvitationId === group.invitationId}
                                        />
                                    ))
                                ) : (
                                    <div className={styles.empty}>
                                        <div>
                                            <p className={styles.emptyTitle}>
                                                No se han encontrado grupos
                                            </p>
                                            <p className={styles.emptySubtitle}>
                                                Prueba con otra búsqueda o ajusta los filtros laterales.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedGroup && (
                            <div className={styles.detailWrapper}>
                                {loadingDetail ? (
                                    <p>Cargando detalle del grupo...</p>
                                ) : (
                                    <TenantGroupDetail
                                         group={selectedGroup}
                                         onAcceptGroup={handleAcceptGroup}
                                         isAcceptingGroup={acceptingGroupId === selectedGroup.id}
                                         onDeleteGroup={handleDeleteGroup}
                                         isDeletingGroup={deletingGroupId === selectedGroup.id}
                                         onCreateApartmentApplication={handleCreateApartmentApplication}
                                         isCreatingApartmentApplication={creatingApartmentApplicationGroupId === selectedGroup.id}
                                         onCreateJoinRequest={handleCreateJoinRequest}
                                         isCreatingJoinRequest={creatingJoinRequestGroupId === selectedGroup.id}
                                         onInviteMembers={handleInviteMembers}
                                         isInvitingMembers={invitingGroupId === selectedGroup.id}
                                         onVoteJoinRequest={(groupID, request, decision) => handleVoteJoinRequest(groupID, request.id, decision)}
                                         votingJoinRequestKey={votingJoinRequestKey}
                                         onLinkApartment={handleLinkApartment}
                                         isLinkingApartment={linkingApartmentGroupId === selectedGroup.id}
                                     />
                                 )}
                             </div>
                        )}
                    </section>

                    <TenantGroupFilters
                        selectedMembers={selectedMembers}
                        onSelectedMembersChange={setSelectedMembers}
                        status={status}
                        onStatusChange={setStatus}
                        hasApartment={hasApartment}
                        onHasApartmentChange={setHasApartment}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </div>
        </TenantLayout>
    )
}
