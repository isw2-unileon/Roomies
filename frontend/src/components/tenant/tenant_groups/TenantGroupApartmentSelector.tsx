import { useState, useEffect } from 'react'
import { listTenantApartments } from '@/services/tenantService'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantCreateGroup.module.css'

interface Props {
  selected: TenantProperty | null
  onChange: (apartment: TenantProperty | null) => void
  allowEmptySelection?: boolean
}

export default function TenantGroupApartmentSelector({ selected, onChange, allowEmptySelection = true }: Props) {
  const [search, setSearch] = useState('')
  const [apartments, setApartments] = useState<TenantProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await listTenantApartments({ query: search, area: search })
        setApartments(list)
      } catch (err) {
        setApartments([])
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los pisos.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [search])

  const selectedApartmentId = selected?.id ?? '__none__'

  return (
    <div className={styles.selectorContainer}>
      <label className={styles.label}>Piso (opcional)</label>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por titulo, direccion o area..."
        className={styles.input}
        aria-label="Buscar piso para el grupo"
      />
      {error ? <p className={styles.errorMessage}>{error}</p> : null}
      {loading ? (
        <p className={styles.helpText}>Cargando pisos...</p>
      ) : (
        <ul className={styles.apartmentsList}>
          {allowEmptySelection ? (
            <li>
              <button
                type="button"
                className={`${styles.apartmentItem} ${selectedApartmentId === '__none__' ? styles.selectedApartment : ''}`}
                onClick={() => onChange(null)}
                aria-pressed={selectedApartmentId === '__none__'}
              >
                <span className={styles.itemTitle}>Sin piso asignado</span>
                <span className={styles.itemMeta}>Puedes asignarlo mas adelante.</span>
              </button>
            </li>
          ) : null}
          {apartments.map((apartment) => {
            const isSelected = selectedApartmentId === apartment.id

            return (
              <li key={apartment.id}>
                <button
                  type="button"
                  className={`${styles.apartmentItem} ${isSelected ? styles.selectedApartment : ''}`}
                  onClick={() => onChange(apartment)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.itemTitle}>{apartment.titleKey}</span>
                  <span className={styles.itemMeta}>{apartment.addressKey}</span>
                  <span className={styles.itemMeta}>{apartment.areaKey} - {apartment.availableRooms} plazas disponibles</span>
                </button>
              </li>
            )
          })}
          {apartments.length === 0 ? (
            <li className={styles.emptyItem}>No se encontraron pisos para esta busqueda.</li>
          ) : null}
        </ul>
      )}
    </div>
  )
}
