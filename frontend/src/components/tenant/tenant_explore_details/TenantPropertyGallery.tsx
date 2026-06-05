import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantProperty } from '@/types/tenant'

interface TenantPropertyGalleryProps {
  property: TenantProperty
}

function getGalleryImages(property: TenantProperty) {
  const firstImage = property.images[0]
  if (!firstImage) {
    return []
  }

  const galleryImages = [...property.images]
  while (galleryImages.length < 4) {
    galleryImages.push(firstImage)
  }

  return galleryImages.slice(0, 4)
}

export default function TenantPropertyGallery({ property }: TenantPropertyGalleryProps) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const galleryImages = getGalleryImages(property)
  const allImages = property.images
  const title = t(property.titleKey)

  return (
    <>
      <section className={styles.galleryCard}>
        {galleryImages.length > 0 ? (
          <>
            <img src={galleryImages[0]} alt={title} className={styles.mainImage} />
            <div className={styles.sideImages}>
              {galleryImages.slice(1).map((image, index) => (
                <img
                  key={`${property.id}-image-${index}`}
                  src={image}
                  alt={`${title} ${index + 2}`}
                  className={styles.sideImage}
                  loading="lazy"
                />
              ))}
            </div>
            {allImages.length > 1 && (
              <button
                type="button"
                className={styles.viewAllPhotosButton}
                onClick={() => setShowAll(true)}
              >
                {t('tenantDashboard.detail.gallery.viewAll', { count: allImages.length })}
              </button>
            )}
          </>
        ) : (
          <div className={styles.imageFallback}>{t('tenantDashboard.property.noImage')}</div>
        )}
      </section>

      {showAll && (
        <div className={styles.lightboxOverlay} onClick={() => setShowAll(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxHeader}>
              <h3 className={styles.lightboxTitle}>{title}</h3>
              <button type="button" className={styles.lightboxClose} onClick={() => setShowAll(false)}>
                <XMarkIcon className={styles.iconSmall} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.lightboxGrid}>
              {allImages.map((image, index) => (
                <img
                  key={`${property.id}-lightbox-${index}`}
                  src={image}
                  alt={`${title} ${index + 1}`}
                  className={styles.lightboxImage}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
