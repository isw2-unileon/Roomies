import { useEffect, useState } from 'react'
import { listTenantGroupCandidates } from '@/services/tenantService'
import type { TenantGroupCandidate } from '@/types/tenant'
import styles from '@/styles/TenantCreateGroup.module.css'

interface Props {
  selected: TenantGroupCandidate[]
  onChange: (candidates: TenantGroupCandidate[]) => void
}

export default function TenantGroupCandidateSelector({ selected, onChange }: Props) {
  const [search, setSearch] = useState('')
  const [candidates, setCandidates] = useState<TenantGroupCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await listTenantGroupCandidates({ search })
        setCandidates(list)
      } catch (err) {
        setCandidates([])
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los candidatos.')
      } finally {
        setLoading(false)
      }
    }
    void loadCandidates()
  }, [search])

  const toggleCandidate = (candidate: TenantGroupCandidate) => {
    if (selected.find((c) => c.userId === candidate.userId)) {
      onChange(selected.filter((c) => c.userId !== candidate.userId))
    } else {
      onChange([...selected, candidate])
    }
  }

  return (
    <div className={styles.selectorContainer}>
      <label className={styles.label}>Invitar perfiles</label>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o correo..."
        className={styles.input}
        aria-label="Buscar candidatos por nombre o correo"
      />
      {error ? <p className={styles.errorMessage}>{error}</p> : null}
      {loading ? (
        <p className={styles.helpText}>Cargando candidatos...</p>
      ) : (
        <ul className={styles.candidatesList}>
          {candidates.length > 0 ? (
            candidates.map((candidate) => {
              const isSelected = selected.some((current) => current.userId === candidate.userId)

              return (
                <li key={candidate.userId}>
                  <button
                    type="button"
                    className={`${styles.candidateItem} ${isSelected ? styles.selectedCandidate : ''}`}
                    onClick={() => toggleCandidate(candidate)}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.itemTitle}>{candidate.name}</span>
                    <span className={styles.itemMeta}>{candidate.email}</span>
                  </button>
                </li>
              )
            })
          ) : (
            <li className={styles.emptyItem}>No se encontraron perfiles para esta busqueda.</li>
          )}
        </ul>
      )}
    </div>
  )
}
