import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/api'
import { useNotice } from '@/hooks/useNotice'
import styles from '@/styles/OwnerPublishProperty.module.css'

interface PublishValues {
  title: string
  address: string
  area: string
  totalSpots: string
  bathrooms: string
  baseRent: string
  description: string
  availableFrom: string
  imageUrls: string
}

const initialValues: PublishValues = {
  title: '',
  address: '',
  area: '',
  totalSpots: '3',
  bathrooms: '1',
  baseRent: '350',
  description: '',
  availableFrom: '',
  imageUrls: '',
}

interface CreateApartmentResponse {
  message?: string
  apartment_id?: string
  error?: string
}

export default function OwnerPropertyPublishForm() {
  const [values, setValues] = useState<PublishValues>(initialValues)
  const [isLoading, setIsLoading] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  function updateField<K extends keyof PublishValues>(key: K, value: PublishValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function extractImageURLs(raw: string) {
    return raw
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    const parsedTotalSpots = Number.parseInt(values.totalSpots, 10)
    const parsedBathrooms = Number.parseInt(values.bathrooms, 10)
    const parsedBaseRent = Number.parseInt(values.baseRent, 10)
    const parsedImageURLs = extractImageURLs(values.imageUrls)

    if (values.title.trim().length < 3) {
      showError('El titulo debe tener al menos 3 caracteres.')
      return
    }
    if (values.address.trim().length < 5) {
      showError('La direccion debe tener al menos 5 caracteres.')
      return
    }
    if (!Number.isFinite(parsedTotalSpots) || parsedTotalSpots <= 0) {
      showError('El numero de plazas debe ser mayor que 0.')
      return
    }
    if (!Number.isFinite(parsedBathrooms) || parsedBathrooms <= 0) {
      showError('El numero de banos debe ser mayor que 0.')
      return
    }
    if (!Number.isFinite(parsedBaseRent) || parsedBaseRent <= 0) {
      showError('El precio mensual debe ser mayor que 0.')
      return
    }

    const token = localStorage.getItem('roomies.access_token')
    if (!token) {
      showError('Tu sesion ha caducado. Inicia sesion de nuevo.')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiFetch('/api/apartments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          address: values.address.trim(),
          area: values.area.trim(),
          total_spots: parsedTotalSpots,
          bathrooms: parsedBathrooms,
          base_rent: parsedBaseRent,
          available_from: values.availableFrom || '',
          image_urls: parsedImageURLs,
        }),
      })

      const data = (await response.json()) as CreateApartmentResponse

      if (!response.ok) {
        showError(data.error ?? 'No se pudo publicar el piso. Intentalo de nuevo.')
        return
      }

      showSuccess(data.message ?? 'Piso publicado correctamente.')
      setValues(initialValues)
    } catch {
      showError('No se pudo publicar el piso. Intentalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Publicar piso</h1>
        <p className={styles.pageSubtitle}>Crea tu anuncio con la informacion principal para recibir solicitudes.</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Titulo</span>
            <input
              className={styles.input}
              value={values.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Piso luminoso en el centro"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Direccion</span>
            <input
              className={styles.input}
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder="Calle Ancha, 12"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Zona</span>
            <input
              className={styles.input}
              value={values.area}
              onChange={(event) => updateField('area', event.target.value)}
              placeholder="Centro"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Plazas totales</span>
            <input
              type="number"
              min={1}
              className={styles.input}
              value={values.totalSpots}
              onChange={(event) => updateField('totalSpots', event.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Banos (se guarda en descripcion)</span>
            <input
              type="number"
              min={1}
              className={styles.input}
              value={values.bathrooms}
              onChange={(event) => updateField('bathrooms', event.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Precio mensual (EUR)</span>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={values.baseRent}
              onChange={(event) => updateField('baseRent', event.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Disponible desde (se guarda en descripcion)</span>
            <input
              type="date"
              className={styles.input}
              value={values.availableFrom}
              onChange={(event) => updateField('availableFrom', event.target.value)}
            />
          </label>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>URLs de imagenes</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={values.imageUrls}
              onChange={(event) => updateField('imageUrls', event.target.value)}
              placeholder="https://.../foto1.jpg, https://.../foto2.jpg"
            />
            <span className={styles.hint}>Separa varias URL por comas o por lineas.</span>
          </label>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>Descripcion</span>
            <textarea
              className={styles.textarea}
              rows={5}
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Describe el piso, las normas y el perfil de inquilino recomendado..."
            />
          </label>
        </div>

        {notice.kind !== 'idle' && (
          <p className={notice.kind === 'error' ? styles.errorNotice : styles.successNotice} role="status">
            {notice.message}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryButton} disabled={isLoading}>
            {isLoading ? 'Publicando...' : 'Publicar piso'}
          </button>
        </div>
      </form>
    </section>
  )
}
