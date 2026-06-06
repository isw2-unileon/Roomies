import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerRequestsTable from '@/components/owner/owner_applications/OwnerRequestsTable'
import { approveOwnerApplication, getOwnerApplication, listOwnerApplications, rejectOwnerApplication } from '@/services/ownerService'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardRequest } from '@/types/owner'

export default function OwnerApplications() {
  const { t } = useTranslation()
	const [requests, setRequests] = useState<OwnerDashboardRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [selectedRequest, setSelectedRequest] = useState<OwnerDashboardRequest | null>(null)
	const [loadingDetail, setLoadingDetail] = useState(false)
	const [actingApplicationKey, setActingApplicationKey] = useState<string | null>(null)

	const loadApplications = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			setRequests(await listOwnerApplications())
		} catch (loadError) {
			setRequests([])
			setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las solicitudes recibidas.')
		} finally {
			setLoading(false)
		}
	}, [])

	async function handleViewDetail(applicationID: string) {
		setLoadingDetail(true)
		setError('')
		try {
			setSelectedRequest(await getOwnerApplication(applicationID))
		} catch (detailError) {
			setError(detailError instanceof Error ? detailError.message : 'No se pudo cargar el detalle de la solicitud.')
		} finally {
			setLoadingDetail(false)
		}
	}

	useEffect(() => {
		void loadApplications()
	}, [loadApplications])

	async function handleApprove(applicationID: string) {
		setActingApplicationKey(`${applicationID}:approve`)
		setError('')
		setNotice('')
		try {
			await approveOwnerApplication(applicationID)
			setNotice('Solicitud aprobada correctamente.')
			setSelectedRequest(null)
			await loadApplications()
		} catch (approveError) {
			setError(approveError instanceof Error ? approveError.message : 'No se pudo aprobar la solicitud.')
		} finally {
			setActingApplicationKey(null)
		}
	}

	async function handleReject(applicationID: string) {
		setActingApplicationKey(`${applicationID}:reject`)
		setError('')
		setNotice('')
		try {
			await rejectOwnerApplication(applicationID)
			setNotice('Solicitud rechazada correctamente.')
			setSelectedRequest(null)
			await loadApplications()
		} catch (rejectError) {
			setError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la solicitud.')
		} finally {
			setActingApplicationKey(null)
		}
	}

  return (
    <OwnerLayout>
      <section className={styles.ownerSectionCard}>
        <header className={styles.ownerSectionHeader}>
          <div>
            <h1 className={styles.ownerSectionTitle}>{t('ownerDashboard.applications.title')}</h1>
            <p className={styles.ownerSectionSubtitle}>{t('ownerDashboard.applications.subtitle')}</p>
          </div>
        </header>
				{notice ? <div className={styles.ownerPropertyEmpty}>{notice}</div> : null}
				{error ? <div className={styles.ownerPropertyEmpty}>{error}</div> : null}
				{loading ? (
					<div className={styles.ownerPropertyEmpty}>Cargando solicitudes...</div>
				) : (
					<OwnerRequestsTable
						requests={requests}
						onViewDetail={handleViewDetail}
						onApprove={handleApprove}
						onReject={handleReject}
						actingApplicationKey={actingApplicationKey}
					/>
				)}
				{loadingDetail ? <div className={styles.ownerPropertyEmpty}>Cargando detalle...</div> : null}
				{selectedRequest ? (
					<section className={styles.ownerRequestDetailCard}>
						<h2 className={styles.ownerRequestDetailTitle}>Detalle de la solicitud</h2>
						<p className={styles.ownerRequestDetailMeta}>
							{selectedRequest.type === 'group' ? 'Solicitud grupal' : 'Solicitud individual'} · {selectedRequest.propertyTitle}
						</p>
						<p className={styles.ownerRequestDetailMeta}>Direccion: {selectedRequest.address}</p>
						<p className={styles.ownerRequestDetailMeta}>Estado: {selectedRequest.status}</p>
						<p className={styles.ownerRequestDetailMeta}>Fecha: {selectedRequest.createdAt}</p>
						{selectedRequest.group ? (
							<>
								<p className={styles.ownerRequestDetailMeta}>Grupo: {selectedRequest.group.name}</p>
								<p className={styles.ownerRequestDetailMeta}>Creador: {selectedRequest.group.creator.name} · {selectedRequest.group.creator.email}</p>
								<p className={styles.ownerRequestDetailMeta}>Miembros totales: {selectedRequest.group.members.length}</p>
								<ul className={styles.ownerRequestMembersList}>
									{selectedRequest.group.members.map((member) => (
										<li key={member.userId} className={styles.ownerRequestMemberItem}>
											<strong>{member.name}</strong>
											<span>{member.email}</span>
										</li>
									))}
								</ul>
							</>
						) : selectedRequest.tenant ? (
							<>
								<p className={styles.ownerRequestDetailMeta}>Solicitante: {selectedRequest.tenant.name}</p>
								<p className={styles.ownerRequestDetailMeta}>Email: {selectedRequest.tenant.email}</p>
							</>
						) : null}
						<div className={styles.ownerActionGroup}>
							<button
								type="button"
								className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}
								onClick={() => handleApprove(selectedRequest.id)}
								disabled={selectedRequest.status !== 'PENDING_OWNER' || actingApplicationKey === `${selectedRequest.id}:approve`}
							>
								{actingApplicationKey === `${selectedRequest.id}:approve` ? 'Aprobando...' : 'Aceptar solicitud'}
							</button>
							<button
								type="button"
								className={`${styles.ownerActionButton} ${styles.ownerActionReject}`}
								onClick={() => handleReject(selectedRequest.id)}
								disabled={selectedRequest.status !== 'PENDING_OWNER' || actingApplicationKey === `${selectedRequest.id}:reject`}
							>
								{actingApplicationKey === `${selectedRequest.id}:reject` ? 'Rechazando...' : 'Rechazar solicitud'}
							</button>
						</div>
					</section>
				) : null}
      </section>
    </OwnerLayout>
  )
}
