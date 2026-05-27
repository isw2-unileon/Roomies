import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardIssue, OwnerIssueStatus } from '@/types/owner'

interface OwnerIssuesListProps {
  issues: OwnerDashboardIssue[]
  onStatusChange: (id: string, status: OwnerIssueStatus) => void
}

export default function OwnerIssuesList({ issues, onStatusChange }: OwnerIssuesListProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.ownerIssueList}>
      {issues.map((issue) => (
        <article key={issue.id} className={styles.ownerIssueCard}>
          <div>
            <p className={styles.ownerIssueTitle}>{issue.title}</p>
            <p className={styles.ownerIssueMeta}>
              {issue.property} · {issue.tenant}
            </p>
          </div>
          <select
            value={issue.status}
            onChange={(event) => onStatusChange(issue.id, event.target.value as OwnerIssueStatus)}
            className={styles.ownerIssueSelect}
          >
            <option value="pending">{t('ownerDashboard.issues.status.pending')}</option>
            <option value="in_progress">{t('ownerDashboard.issues.status.inProgress')}</option>
            <option value="resolved">{t('ownerDashboard.issues.status.resolved')}</option>
          </select>
        </article>
      ))}
    </div>
  )
}
