import { useState, type ChangeEvent, type FormEvent } from 'react'
import styles from '@/styles/OwnerPublishProperty.module.css'

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

interface PublishValues {
  title: string
  address: string
  area: string
  totalSpots: string
  baseRent: string
  description: string
  availableFrom: string
}

const initialValues: PublishValues = {
  title: '',
  address: '',
  area: '',
  totalSpots: '3',
  baseRent: '350',
  description: '',
  availableFrom: '',
}

export default function OwnerPropertyPublishForm() {
  const [values, setValues] = useState<PublishValues>(initialValues)
  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState('')

  function updateField<K extends keyof PublishValues>(key: K, value: PublishValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function formatFileSize(bytes: number) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    const invalid = selected.find((file) => file.size > MAX_IMAGE_SIZE_BYTES)

    if (invalid) {
      setImageError(`La imagen "${invalid.name}" supera el limite de 2 MB.`)
      setImages([])
      event.target.value = ''
      return
    }

    setImageError('')
    setImages(selected)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (images.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      setImageError('Todas las imagenes deben pesar como maximo 2 MB.')
      return
    }

    console.log('publish property', values, images)
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
            <span className={styles.label}>Disponible desde</span>
            <input
              type="date"
              className={styles.input}
              value={values.availableFrom}
              onChange={(event) => updateField('availableFrom', event.target.value)}
            />
          </label>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>Fotos del piso</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className={styles.input}
              onChange={handleImageChange}
            />
            <span className={styles.hint}>Puedes subir una o varias imagenes. Maximo 2 MB por archivo.</span>
            {imageError && <span className={styles.error}>{imageError}</span>}
            {images.length > 0 && (
              <ul className={styles.fileList}>
                {images.map((image) => (
                  <li key={image.name} className={styles.fileItem}>
                    <span>{image.name}</span>
                    <span>{formatFileSize(image.size)}</span>
                  </li>
                ))}
              </ul>
            )}
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

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton}>Guardar borrador</button>
          <button type="submit" className={styles.primaryButton}>Publicar piso</button>
        </div>
      </form>
    </section>
  )
}
