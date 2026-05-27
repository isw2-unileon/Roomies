import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerPropertyPublishForm from '@/components/owner/owner_publish_property/OwnerPropertyPublishForm'
import { paths } from '@/routes/paths'
import styles from '@/styles/OwnerPublishProperty.module.css'

export default function OwnerPublishPropertyPage() {
  const { t } = useTranslation()

  return (
    <OwnerLayout>
      <Link to={paths.ownerProperties} className={styles.backLink}>
        <ArrowLeftIcon className={styles.backIcon} aria-hidden="true" />
        {t('ownerDashboard.publish.backToProperties')}
      </Link>
      <OwnerPropertyPublishForm />
    </OwnerLayout>
  )
}
