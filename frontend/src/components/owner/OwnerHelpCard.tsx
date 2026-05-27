import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'

export default function OwnerHelpCard() {
  const { t } = useTranslation()

  return (
    <section className={styles.ownerHelpCard}>
      <h3 className={styles.ownerHelpTitle}>{t('ownerDashboard.help.title')}</h3>
      <p className={styles.ownerHelpText}>{t('ownerDashboard.help.text')}</p>
      <button type="button" className={styles.ownerTextButton}>{t('ownerDashboard.help.action')}</button>
    </section>
  )
}
