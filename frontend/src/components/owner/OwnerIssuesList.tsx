import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardIssue, OwnerIssueStatus } from '@/types/owner'

interface OwnerIssuesListProps {
  issues: OwnerDashboardIssue[]
  onStatusChange: (id: string, status: OwnerIssueStatus) => void
}

export default function OwnerIssuesList({ issues, onStatusChange }: OwnerIssuesListProps) {
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
            <option value="pending">pending</option>
            <option value="in_progress">in progress</option>
            <option value="resolved">resolved</option>
          </select>
        </article>
      ))}
    </div>
  )
}
