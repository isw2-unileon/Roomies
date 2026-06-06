import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import TenantProfileView from '@/components/owner/TenantProfileView'
import styles from '@/styles/TenantExploreDetail.module.css'
import type { ApartmentResident } from '@/types/tenant'

interface TenantCurrentResidentsCardProps {
  residents: ApartmentResident[]
}

export default function TenantCurrentResidentsCard({ residents }: TenantCurrentResidentsCardProps) {
  const { t } = useTranslation()
  const [viewingProfile, setViewingProfile] = useState<ApartmentResident | null>(null)

  return (
    <aside className={styles.peopleCard}>
      {viewingProfile ? (
        <TenantProfileView
          person={{
            userId: viewingProfile.userId,
            name: viewingProfile.name,
            email: '',
            avatarUrl: viewingProfile.avatarUrl,
          }}
          onBack={() => setViewingProfile(null)}
        />
      ) : (
        <>
          <div className={styles.peopleCardHeader}>
            <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.residents.title')}</h2>
          </div>
          {residents.length === 0 ? (
            <p className={styles.emptyText}>{t('tenantDashboard.detail.residents.noResidents')}</p>
          ) : (
            <div className={styles.interestedList}>
              {residents.map((resident) => (
                <div key={resident.userId} className={styles.interestedItem}>
                  <div className={styles.residentRow}>
                    <img
                      src={resident.avatarUrl || placeholderAvatar}
                      alt={resident.name}
                      className={styles.residentAvatar}
                      onError={(e) => { (e.target as HTMLImageElement).src = placeholderAvatar }}
                    />
                    <div>
                      <p className={styles.interestedName}>{resident.name}</p>
                      {resident.joinedAt ? (
                        <p className={styles.interestedMeta}>
                          {t('tenantDashboard.detail.residents.since', { date: resident.joinedAt })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.residentProfileButton}
                    onClick={() => setViewingProfile(resident)}
                  >
                    {t('tenantDashboard.detail.residents.viewProfile')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
