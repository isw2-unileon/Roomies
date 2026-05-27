import { useTranslation } from 'react-i18next'

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
  const galleryImages = getGalleryImages(property)
  const title = t(property.titleKey)

  return (
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
        </>
      ) : (
        <div className={styles.imageFallback}>{t('tenantDashboard.property.noImage')}</div>
      )}
    </section>
  )
}
