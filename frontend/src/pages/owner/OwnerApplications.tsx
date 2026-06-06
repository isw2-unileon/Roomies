import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerApplicationDetailModal from '@/components/owner/owner_applications/OwnerApplicationDetailModal'
import OwnerRequestsTable from '@/components/owner/owner_applications/OwnerRequestsTable'
import { approveOwnerApplication, getOwnerApplication, listOwnerApplications, rejectOwnerApplication } from '@/services/ownerService'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardRequest } from '@/types/owner'

type TypeFilter = 'all' | 'individual' | 'group'
type SortOrder = 'recent' | 'compatibility'

const PENDING_STATUSES = new Set(['PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS'])

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'FULLY_CONFIRMED', label: 'Aceptada' },
  { value: 'REJECTED_BY_OWNER', label: 'Rechazada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

export default function OwnerApplications() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<OwnerDashboardRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<OwnerDashboardRequest | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actingApplicationKey, setActingApplicationKey] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterProperty, setFilterProperty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')

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

  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of requests) {
      if (!seen.has(r.apartmentId)) {
        seen.set(r.apartmentId, r.propertyTitle)
      }
    }
    return Array.from(seen, ([id, title]) => ({ value: id, label: title }))
  }, [requests])

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterProperty !== 'all' && r.apartmentId !== filterProperty) return false
      if (filterStatus === 'pending' && !PENDING_STATUSES.has(r.status)) return false
      if (filterStatus !== 'all' && filterStatus !== 'pending' && r.status !== filterStatus) return false
      return true
    })
    if (sortOrder === 'compatibility') {
      filtered.sort((a, b) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0))
    }
    return filtered
  }, [requests, filterType, filterProperty, filterStatus, sortOrder])

  return (
    <OwnerLayout>
      <section className={styles.ownerSectionCard}>
        <header className={styles.ownerSectionHeader}>
          <div>
            <h1 className={styles.ownerSectionTitle}>{t('ownerDashboard.applications.title')}</h1>
            <p className={styles.ownerSectionSubtitle}>{t('ownerDashboard.applications.subtitle')}</p>
          </div>
        </header>

        {!loading && requests.length > 0 && (
          <div className={styles.ownerFiltersBar}>
            <div className={styles.ownerFilterGroup}>
              <label className={styles.ownerFilterLabel} htmlFor="filter-type">Tipo</label>
              <select
                id="filter-type"
                className={styles.ownerFilterSelect}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TypeFilter)}
              >
                <option value="all">Todas</option>
                <option value="individual">Individual</option>
                <option value="group">Grupal</option>
              </select>
            </div>
            <div className={styles.ownerFilterGroup}>
              <label className={styles.ownerFilterLabel} htmlFor="filter-property">Piso</label>
              <select
                id="filter-property"
                className={styles.ownerFilterSelect}
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
              >
                <option value="all">Todos</option>
                {propertyOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.ownerFilterGroup}>
              <label className={styles.ownerFilterLabel} htmlFor="filter-status">Estado</label>
              <select
                id="filter-status"
                className={styles.ownerFilterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.ownerFilterGroup}>
              <label className={styles.ownerFilterLabel} htmlFor="filter-sort">Ordenar por</label>
              <select
                id="filter-sort"
                className={styles.ownerFilterSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="recent">Más recientes</option>
                <option value="compatibility">Mayor compatibilidad</option>
              </select>
            </div>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className={styles.ownerFiltersCount}>
            {filteredRequests.length} {filteredRequests.length === 1 ? 'solicitud' : 'solicitudes'}
          </div>
        )}

        {notice ? <div className={styles.ownerPropertyEmpty}>{notice}</div> : null}
        {error ? <div className={styles.ownerPropertyEmpty}>{error}</div> : null}
        {loading ? (
          <div className={styles.ownerPropertyEmpty}>Cargando solicitudes...</div>
        ) : (
          <OwnerRequestsTable
            requests={filteredRequests}
            onViewDetail={handleViewDetail}
            onApprove={handleApprove}
            onReject={handleReject}
            actingApplicationKey={actingApplicationKey}
          />
        )}
        {loadingDetail ? <div className={styles.ownerPropertyEmpty}>Cargando detalle...</div> : null}
        {selectedRequest && (
          <OwnerApplicationDetailModal
            request={selectedRequest}
            actingApplicationKey={actingApplicationKey}
            onApprove={handleApprove}
            onReject={handleReject}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </section>
    </OwnerLayout>
  )
}
