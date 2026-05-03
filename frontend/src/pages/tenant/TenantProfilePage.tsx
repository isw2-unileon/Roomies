import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import TenantLayout from '@/components/tenant/TenantLayout'
import styles from '@/styles/TenantProfile.module.css'

export default function TenantProfilePage() {
  const { t } = useTranslation()

  return (
    <TenantLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.kicker}>{t('tenantProfile.kicker')}</span>
          <h1 className={styles.title}>{t('tenantProfile.title')}</h1>
          <p className={styles.subtitle}>{t('tenantProfile.subtitle')}</p>
        </section>

        <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="tenant-profile-personal-title">
          <div>
            <span className={styles.cardEyebrow}>{t('tenantProfile.personal.kicker')}</span>
            <h2 id="tenant-profile-personal-title" className={styles.cardTitle}>
              {t('tenantProfile.personal.title')}
            </h2>
          </div>
          <p className={styles.cardText}>{t('tenantProfile.personal.placeholder')}</p>
        </section>

        <section className={styles.card} aria-labelledby="tenant-profile-preferences-title">
          <div>
            <span className={styles.cardEyebrow}>{t('tenantProfile.preferences.kicker')}</span>
            <h2 id="tenant-profile-preferences-title" className={styles.cardTitle}>
              {t('tenantProfile.preferences.title')}
            </h2>
          </div>
          <p className={styles.cardText}>{t('tenantProfile.preferences.description')}</p>

          <div className={styles.preferenceRow}>
            <div>
              <h3 className={styles.preferenceTitle}>{t('tenantProfile.preferences.languageTitle')}</h3>
              <p className={styles.preferenceText}>{t('tenantProfile.preferences.languageDescription')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </section>

        <section className={styles.card} aria-labelledby="tenant-profile-search-title">
          <div>
            <span className={styles.cardEyebrow}>{t('tenantProfile.search.kicker')}</span>
            <h2 id="tenant-profile-search-title" className={styles.cardTitle}>
              {t('tenantProfile.search.title')}
            </h2>
          </div>
          <p className={styles.cardText}>{t('tenantProfile.search.placeholder')}</p>
        </section>
        </div>
      </div>
    </TenantLayout>
  )
}
