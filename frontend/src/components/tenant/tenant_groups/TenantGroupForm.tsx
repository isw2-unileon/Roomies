import { useState, type FormEvent } from 'react'
import TenantGroupCandidateSelector from './TenantGroupCandidateSelector'
import TenantGroupApartmentSelector from './TenantGroupApartmentSelector' 
import { createTenantGroup, type CreateTenantGroupInput } from '@/services/tenantService'
import type { TenantGroupCandidate, TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantCreateGroup.module.css'

interface TenantGroupFormProps {
  onSuccess: (groupId: string) => void
  preselectedUserId?: string
  preselectedApartmentId?: string
}

export default function TenantGroupForm({ onSuccess, preselectedUserId, preselectedApartmentId }: TenantGroupFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<TenantGroupCandidate[]>([])
  const [apartment, setApartment] = useState<TenantProperty | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      setError('El nombre del grupo es obligatorio.')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const input: CreateTenantGroupInput = {
        name: trimmedName,
        description: trimmedDescription,
        apartmentId: apartment?.id ?? null,
        invitedUserIds: selectedCandidates.map((c) => c.userId),
      }

      const groupId = await createTenantGroup(input)
      setSuccess('Grupo creado correctamente.')
      onSuccess(groupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      <label className={styles.label}>
        Nombre
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={styles.input}
        />
      </label>

      <label className={styles.label}>
        Descripción
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
        />
      </label>

      <TenantGroupCandidateSelector
        selected={selectedCandidates}
        onChange={setSelectedCandidates}
        preselectedUserIds={preselectedUserId ? [preselectedUserId] : undefined}
      />

      <TenantGroupApartmentSelector
        selected={apartment}
        onChange={setApartment}
        preselectedApartmentId={preselectedApartmentId}
      />

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Creando grupo...' : 'Crear grupo'}
      </button>
    </form>
  )
}
