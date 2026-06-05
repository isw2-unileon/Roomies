import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNotice } from '@/hooks/useNotice'
import { createApartment, updateOwnerApartment, uploadApartmentPhotos } from '@/services/ownerService'
import styles from '@/styles/OwnerPublishProperty.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'
import LocationPicker from './LocationPicker'
import type { Location } from './LocationPicker'

const MAX_PHOTOS = 8
const MAX_SIZE_MB = 5

interface PhotoItem {
  file?: File
  preview: string
  existingPath?: string
}

interface PublishValues {
  title: string
  address: string
  area: string
  totalSpots: string
  bathrooms: string
  baseRent: string
  description: string
  latitude?: number
  longitude?: number
  surfaceM2: string
  floor: string
  smokingAllowed: boolean
  petsAllowed: boolean
  studentsAllowed: boolean
  notes: string
}

const initialValues: PublishValues = {
  title: '',
  address: '',
  area: '',
  totalSpots: '3',
  bathrooms: '1',
  baseRent: '350',
  description: '',
  surfaceM2: '0',
  floor: '0',
  smokingAllowed: false,
  petsAllowed: false,
  studentsAllowed: false,
  notes: '',
}

interface OwnerPropertyPublishFormProps {
  propertyId?: string
  property?: OwnerDashboardProperty
}

function valuesFromProperty(property: OwnerDashboardProperty): PublishValues {
  return {
    title: property.title,
    address: property.address,
    area: property.area ?? '',
    totalSpots: String(property.totalSpots),
    bathrooms: String(property.bathrooms ?? 1),
    baseRent: String(property.rent ?? ''),
    description: property.description ?? '',
    latitude: property.latitude,
    longitude: property.longitude,
    surfaceM2: String(property.surfaceM2 ?? 0),
    floor: String(property.floor ?? 0),
    smokingAllowed: property.smokingAllowed === true,
    petsAllowed: property.petsAllowed === true,
    studentsAllowed: property.studentsAllowed === true,
    notes: property.notes ?? '',
  }
}

function photosFromProperty(property: OwnerDashboardProperty): PhotoItem[] {
  const urls = property.imageUrls?.length ? property.imageUrls : property.image ? [property.image] : []
  return urls.map((url, index) => ({ preview: url, existingPath: property.imagePaths?.[index] }))
}

export default function OwnerPropertyPublishForm({ propertyId, property }: OwnerPropertyPublishFormProps) {
  const { t } = useTranslation()
  const isEditMode = Boolean(propertyId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<PublishValues>(() => (property ? valuesFromProperty(property) : initialValues))
  const [photos, setPhotos] = useState<PhotoItem[]>(() => (property ? photosFromProperty(property) : []))
  const [isLoading, setIsLoading] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  useEffect(() => {
    setValues(property ? valuesFromProperty(property) : initialValues)
    setPhotos(property ? photosFromProperty(property) : [])
  }, [property])

  function updateField<K extends keyof PublishValues>(key: K, value: PublishValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleLocationSelect(location: Location) {
    setValues((prev) => ({
      ...prev,
      address: location.address || prev.address,
      area: location.zone || prev.area,
      latitude: location.latitude,
      longitude: location.longitude,
    }))
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = selected.slice(0, remaining)

    const valid: PhotoItem[] = []
    for (const file of toAdd) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        showError(t('ownerDashboard.publish.photos.tooLarge'))
        continue
      }
      if (!file.type.startsWith('image/')) {
        showError(t('ownerDashboard.publish.photos.invalidType'))
        continue
      }
      valid.push({ file, preview: URL.createObjectURL(file) })
    }
    if (valid.length > 0) {
      setPhotos((prev) => [...prev, ...valid])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev]
      const removed = next.splice(index, 1)[0]
      if (removed?.file) {
        URL.revokeObjectURL(removed.preview)
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    const parsedTotalSpots = Number.parseInt(values.totalSpots, 10)
    const parsedBathrooms = Number.parseInt(values.bathrooms, 10)
    const parsedBaseRent = Number.parseInt(values.baseRent, 10)

    if (values.title.trim().length < 3) {
      showError(t('ownerDashboard.publish.errors.title'))
      return
    }
    if (values.address.trim().length < 5) {
      showError(t('ownerDashboard.publish.errors.address'))
      return
    }
    if (!Number.isFinite(parsedTotalSpots) || parsedTotalSpots <= 0) {
      showError(t('ownerDashboard.publish.errors.totalSpots'))
      return
    }
    if (!Number.isFinite(parsedBathrooms) || parsedBathrooms <= 0) {
      showError(t('ownerDashboard.publish.errors.bathrooms'))
      return
    }
    if (!Number.isFinite(parsedBaseRent) || parsedBaseRent <= 0) {
      showError(t('ownerDashboard.publish.errors.baseRent'))
      return
    }

    setIsLoading(true)

    try {
      const newFiles = photos.filter((p) => p.file).map((p) => p.file!)
      let uploadedPaths: string[] = photos.filter((p) => p.existingPath && !p.file).map((p) => p.existingPath!)

      if (newFiles.length > 0) {
        const results = await uploadApartmentPhotos(newFiles, propertyId, values.title.trim())
        uploadedPaths = [...uploadedPaths, ...results.map((r) => r.path)]
      }

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        address: values.address.trim(),
        area: values.area.trim(),
        totalSpots: parsedTotalSpots,
        bathrooms: parsedBathrooms,
        baseRent: parsedBaseRent,
        imagePaths: uploadedPaths,
        latitude: values.latitude,
        longitude: values.longitude,
        surfaceM2: Number.parseInt(values.surfaceM2, 10) || 0,
        floor: Number.parseInt(values.floor, 10) || 0,
        smokingAllowed: values.smokingAllowed,
        petsAllowed: values.petsAllowed,
        studentsAllowed: values.studentsAllowed,
        notes: values.notes.trim(),
      }
      const result = isEditMode && propertyId
        ? await updateOwnerApartment(propertyId, payload)
        : await createApartment(payload)
      showSuccess(result.message ?? t(isEditMode ? 'ownerDashboard.publish.editSuccess' : 'ownerDashboard.publish.success'))
      if (!isEditMode) {
        setValues(initialValues)
        setPhotos([])
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t(isEditMode ? 'ownerDashboard.publish.errors.editDefault' : 'ownerDashboard.publish.errors.default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t(isEditMode ? 'ownerDashboard.publish.editTitle' : 'ownerDashboard.publish.title')}</h1>
        <p className={styles.pageSubtitle}>{t(isEditMode ? 'ownerDashboard.publish.editSubtitle' : 'ownerDashboard.publish.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.title')}</span>
            <input
              className={styles.input}
              value={values.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.title')}
              required
            />
          </label>

          <div className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.mapLocation')}</span>
            <LocationPicker onLocationSelect={handleLocationSelect} />
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.address')}</span>
            <input
              className={styles.input}
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.address')}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.area')}</span>
            <input
              className={styles.input}
              value={values.area}
              onChange={(event) => updateField('area', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.area')}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.totalSpots')}</span>
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
            <span className={styles.label}>{t('ownerDashboard.publish.fields.bathrooms')}</span>
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
            <span className={styles.label}>{t('ownerDashboard.publish.fields.baseRent')}</span>
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
            <span className={styles.label}>{t('ownerDashboard.publish.fields.surfaceM2')}</span>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={values.surfaceM2}
              onChange={(event) => updateField('surfaceM2', event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.floor')}</span>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={values.floor}
              onChange={(event) => updateField('floor', event.target.value)}
            />
          </label>

          <div className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.rules')}</span>
            <div className={styles.grid}>
              <label className={styles.field}>
                <input
                  type="checkbox"
                  checked={values.smokingAllowed}
                  onChange={(event) => updateField('smokingAllowed', event.target.checked)}
                />
                <span className={styles.label}>{t('ownerDashboard.publish.fields.smokingAllowed')}</span>
              </label>
              <label className={styles.field}>
                <input
                  type="checkbox"
                  checked={values.petsAllowed}
                  onChange={(event) => updateField('petsAllowed', event.target.checked)}
                />
                <span className={styles.label}>{t('ownerDashboard.publish.fields.petsAllowed')}</span>
              </label>
              <label className={styles.field}>
                <input
                  type="checkbox"
                  checked={values.studentsAllowed}
                  onChange={(event) => updateField('studentsAllowed', event.target.checked)}
                />
                <span className={styles.label}>{t('ownerDashboard.publish.fields.studentsAllowed')}</span>
              </label>
            </div>
          </div>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.notes')}</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.notes')}
            />
          </label>

          <div className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.photos')}</span>
            <div className={styles.photoGrid}>
              {photos.map((photo, index) => (
                <div key={`${photo.existingPath ?? photo.preview}-${index}`} className={styles.photoPreview}>
                  <img src={photo.preview} alt="" className={styles.photoPreviewImage} />
                  <button type="button" className={styles.photoRemoveButton} onClick={() => removePhoto(index)}>
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className={styles.photoAddButton}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className={styles.photoFileInput}
                    onChange={handleFileChange}
                  />
                  <span className={styles.photoAddLabel}>+</span>
                </label>
              )}
            </div>
            <span className={styles.hint}>{t('ownerDashboard.publish.hints.photos', { max: MAX_PHOTOS })}</span>
          </div>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.description')}</span>
            <textarea
              className={styles.textarea}
              rows={5}
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.description')}
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
            {isLoading
              ? t(isEditMode ? 'ownerDashboard.publish.editSubmitting' : 'ownerDashboard.publish.submitting')
              : t(isEditMode ? 'ownerDashboard.publish.editSubmit' : 'ownerDashboard.publish.submit')}
          </button>
        </div>
      </form>
    </section>
  )
}
