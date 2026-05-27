import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNotice } from '@/hooks/useNotice'
import { createApartment } from '@/services/ownerService'
import styles from '@/styles/OwnerPublishProperty.module.css'
import LocationPicker from './LocationPicker'
import type { Location } from './LocationPicker'

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
  latitude?: number
  longitude?: number
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

export default function OwnerPropertyPublishForm() {
  const { t } = useTranslation()
  const [values, setValues] = useState<PublishValues>(initialValues)
  const [isLoading, setIsLoading] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

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
      const result = await createApartment({
        title: values.title.trim(),
        description: values.description.trim(),
        address: values.address.trim(),
        area: values.area.trim(),
        totalSpots: parsedTotalSpots,
        bathrooms: parsedBathrooms,
        baseRent: parsedBaseRent,
        availableFrom: values.availableFrom || '',
        imageUrls: parsedImageURLs,
        latitude: values.latitude,
        longitude: values.longitude,
      })
      showSuccess(result.message ?? t('ownerDashboard.publish.success'))
      setValues(initialValues)
    } catch (error) {
      showError(error instanceof Error ? error.message : t('ownerDashboard.publish.errors.default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('ownerDashboard.publish.title')}</h1>
        <p className={styles.pageSubtitle}>{t('ownerDashboard.publish.subtitle')}</p>
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
            <span className={styles.label}>{t('ownerDashboard.publish.fields.availableFrom')}</span>
            <input
              type="date"
              className={styles.input}
              value={values.availableFrom}
              onChange={(event) => updateField('availableFrom', event.target.value)}
            />
          </label>

          <label className={`${styles.field} ${styles.full}`}>
            <span className={styles.label}>{t('ownerDashboard.publish.fields.imageUrls')}</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={values.imageUrls}
              onChange={(event) => updateField('imageUrls', event.target.value)}
              placeholder={t('ownerDashboard.publish.placeholders.imageUrls')}
            />
            <span className={styles.hint}>{t('ownerDashboard.publish.hints.imageUrls')}</span>
          </label>

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
            {isLoading ? t('ownerDashboard.publish.submitting') : t('ownerDashboard.publish.submit')}
          </button>
        </div>
      </form>
    </section>
  )
}
