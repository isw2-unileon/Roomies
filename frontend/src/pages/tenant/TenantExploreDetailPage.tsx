import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'

import TenantLayout from '@/components/tenant/TenantLayout'
import { paths } from '@/routes/paths'
import {
  applyToTenantApartment,
  cancelTenantApplication,
  getTenantApartmentDetail,
  listInterestedTenants,
} from '@/services/tenantService'
import styles from '@/styles/TenantExploreDetail.module.css'
import type { InterestedTenant, TenantProperty, TenantPropertyDetail } from '@/types/tenant'

interface TenantExploreDetailLocationState {
  property?: TenantProperty
}

export default function TenantExploreDetailPage() {
  const { t } = useTranslation()
  const { propertyId = '' } = useParams()
  const location = useLocation()
  const locationState = location.state as TenantExploreDetailLocationState | null

  const [property, setProperty] = useState<TenantProperty | null>(locationState?.property ?? null)
  const [detail, setDetail] = useState<TenantPropertyDetail | null>(null)
  const [interestedTenants, setInterestedTenants] = useState<InterestedTenant[]>([])
  const [isLoading, setIsLoading] = useState(!locationState?.property)
  const [error, setError] = useState('')
  const [applyStatus, setApplyStatus] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    let ignoreResult = false

    async function loadProperty() {
      setIsLoading(true)
      setError('')

      try {
        const apartmentDetail = await getTenantApartmentDetail(propertyId)
        if (ignoreResult) {
          return
        }

        const [tenants] = await Promise.all([
          listInterestedTenants(propertyId),
        ])
        if (ignoreResult) {
          return
        }

        setDetail(apartmentDetail)
        setProperty(apartmentDetail.property)
        setInterestedTenants(tenants)
      } catch (loadError) {
        if (!ignoreResult) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el detalle del piso.')
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false)
        }
      }
    }

    void loadProperty()

    return () => {
      ignoreResult = true
    }
  }, [propertyId])

  async function handleApplyToApartment() {
    if (!propertyId) {
      return
    }
    setApplyStatus('')
    setIsApplying(true)
    try {
      await applyToTenantApartment(propertyId)
      const apartmentDetail = await getTenantApartmentDetail(propertyId)
      setDetail(apartmentDetail)
      setProperty(apartmentDetail.property)
      setApplyStatus('Solicitud enviada correctamente.')
    } catch (applyError) {
      setApplyStatus(applyError instanceof Error ? applyError.message : 'No se pudo solicitar la plaza.')
    } finally {
      setIsApplying(false)
    }
  }

  async function handleCancelApplication() {
    if (!propertyId || !detail?.currentApplicationId) {
      return
    }
    setApplyStatus('')
    setIsApplying(true)
    try {
      await cancelTenantApplication(detail.currentApplicationId)
      const apartmentDetail = await getTenantApartmentDetail(propertyId)
      setDetail(apartmentDetail)
      setProperty(apartmentDetail.property)
      setApplyStatus('Solicitud anulada correctamente.')
    } catch (cancelError) {
      setApplyStatus(cancelError instanceof Error ? cancelError.message : 'No se pudo anular la solicitud.')
    } finally {
      setIsApplying(false)
    }
  }

  const galleryImages = useMemo(() => {
    if (!property || property.images.length === 0) {
      return []
    }

    const firstImage = property.images[0]
    if (!firstImage) {
      return []
    }

    const repeatedImages = [...property.images]
    while (repeatedImages.length < 4) {
      repeatedImages.push(firstImage)
    }
    return repeatedImages.slice(0, 4)
  }, [property])

  if (isLoading) {
    return (
      <TenantLayout>
        <p role="status" className={styles.statusText}>Cargando detalle del piso...</p>
      </TenantLayout>
    )
  }

  if (!property) {
    return (
      <TenantLayout>
        <div className={styles.statusBox}>
          <p role="alert" className={styles.statusText}>{error || 'No se encontro el piso solicitado.'}</p>
          <Link to={paths.tenantExplore} className={styles.backLink}>Volver a explorar</Link>
        </div>
      </TenantLayout>
    )
  }

  const compatibility = property.compatibilityScore
  const compatibilityReasons = detail?.compatibilityReasons ?? []
  const rules = detail?.rules

  return (
    <TenantLayout>
      <div className={styles.content}>
        <div className={styles.breadcrumbs}>
          <Link to={paths.tenantExplore} className={styles.crumbLink}>Explorar</Link>
          <span className={styles.crumbSeparator}>/</span>
          <span className={styles.crumbCurrent}>{t(property.titleKey)}</span>
        </div>

        <div className={styles.topBar}>
          <Link to={paths.tenantExplore} className={styles.backButton}>
            <ArrowLeftIcon className={styles.iconSmall} aria-hidden="true" />
            Volver a resultados
          </Link>
        </div>

        <section className={styles.header}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{t(property.titleKey)}</h1>
              <span className={styles.statusBadge}>{t(`tenantDashboard.property.status.${property.status}`)}</span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                {t(property.addressKey)}
              </span>
              <button type="button" className={styles.mapLink}>Ver en mapa</button>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.shareButton}>
              <ArrowUpTrayIcon className={styles.iconTiny} aria-hidden="true" />
              Compartir
            </button>
            {detail?.canCancel ? (
              <button type="button" className={styles.applyButton} onClick={handleCancelApplication} disabled={isApplying}>
                {isApplying ? 'Anulando...' : 'Anular solicitud'}
              </button>
            ) : detail?.canApply ? (
              <button type="button" className={styles.applyButton} onClick={handleApplyToApartment} disabled={isApplying}>
                {isApplying ? 'Enviando...' : 'Solicitar plaza'}
              </button>
            ) : null}
          </div>
        </section>
        {applyStatus ? <p className={styles.statusText}>{applyStatus}</p> : null}

        <div className={styles.mainGrid}>
          <section className={styles.galleryCard}>
            {galleryImages.length > 0 ? (
              <>
                <img src={galleryImages[0]} alt={t(property.titleKey)} className={styles.mainImage} />
                <div className={styles.sideImages}>
                  {galleryImages.slice(1).map((image, index) => (
                    <img
                      key={`${property.id}-image-${index}`}
                      src={image}
                      alt={`${t(property.titleKey)} ${index + 2}`}
                      className={styles.sideImage}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.imageFallback}>Sin imagen</div>
            )}
          </section>

          <aside className={styles.compatibilityCard}>
            <h2 className={styles.cardTitle}>Tu compatibilidad con este piso</h2>
            <div className={styles.compatibilityRow}>
              <div className={styles.ringWrap}>
                <div
                  className={styles.ring}
                  style={{ '--compatibility': `${compatibility}` } as CSSProperties}
                >
                  <div className={styles.ringContent}>
                    <span className={styles.ringValue}>{compatibility}%</span>
                    <span className={styles.ringLabel}>Compatible</span>
                  </div>
                </div>
              </div>

              <div className={styles.reasonList}>
                <p className={styles.reasonTitle}>Por que eres compatible?</p>
                {compatibilityReasons.length > 0 ? compatibilityReasons.map((reason) => (
                  <p key={reason} className={styles.reasonItem}><CheckIcon className={styles.iconTiny} aria-hidden="true" />{reason}</p>
                )) : <p className={styles.reasonItem}><CheckIcon className={styles.iconTiny} aria-hidden="true" />Perfil parcialmente compatible</p>}
              </div>
            </div>

            <div className={styles.tipBox}>
              <p className={styles.tipTitle}>Consejo</p>
              <p className={styles.tipText}>Cuanto mas completo sea tu perfil, mas preciso sera el calculo de compatibilidad.</p>
            </div>
          </aside>

          <section className={styles.detailsCard}>
            <h2 className={styles.cardTitle}>Detalles del piso</h2>
            <div className={styles.detailsGrid}>
              <div>
                <p className={styles.label}>Precio por plaza</p>
                <p className={styles.value}>{property.rent}€ / mes</p>
              </div>
              <div>
                <p className={styles.label}>Habitaciones</p>
                <p className={styles.value}>{property.totalRooms}</p>
              </div>
              <div>
                <p className={styles.label}>Disponibles</p>
                <p className={styles.value}>{property.availableRooms} plazas</p>
              </div>
              <div>
                <p className={styles.label}>Zona</p>
                <p className={styles.value}>{t(property.areaKey)}</p>
              </div>
            </div>
            <p className={styles.description}>
              Piso en {t(property.areaKey)} con {property.totalRooms} habitaciones y {property.availableRooms} plazas disponibles.
            </p>
          </section>

          <section className={styles.servicesCard}>
            <h2 className={styles.cardTitle}>Servicios</h2>
            <div className={styles.servicesGrid}>
              <span className={styles.serviceBadge}>WiFi</span>
              <span className={styles.serviceBadge}>Calefaccion</span>
              {rules?.petsAllowed ? <span className={styles.serviceBadge}>Mascotas permitidas</span> : null}
              {rules?.smokingAllowed ? <span className={styles.serviceBadge}>Se permite fumar</span> : null}
              {rules?.preferredSchedule ? <span className={styles.serviceBadge}>Horario {rules.preferredSchedule}</span> : null}
              {rules?.cleanlinessExpectation ? <span className={styles.serviceBadge}>Limpieza {rules.cleanlinessExpectation}</span> : null}
            </div>
          </section>

          <aside className={styles.peopleCard}>
            <h2 className={styles.cardTitle}>Personas interesadas en este piso</h2>
            {interestedTenants.length > 0 ? (
              <div className={styles.interestedList}>
                {interestedTenants.map((tenant) => (
                  <div key={tenant.userId} className={styles.interestedItem}>
                    <div>
                      <p className={styles.interestedName}>{tenant.name}</p>
                      <p className={styles.interestedMeta}>{tenant.age} anos - {tenant.studies}</p>
                    </div>
                    <p className={styles.interestedScore}>{tenant.compatibility}% compatible</p>
                  </div>
                ))}
              </div>
            ) : <p className={styles.emptyPeopleText}>Todavia no hay perfiles interesados disponibles para este piso.</p>}
          </aside>
        </div>
      </div>
    </TenantLayout>
  )
}
