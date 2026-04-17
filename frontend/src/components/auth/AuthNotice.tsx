import styles from '@/styles/AuthNotice.module.css'

type NoticeKind = 'idle' | 'error' | 'success'

interface AuthNoticeProps {
  kind: NoticeKind
  message: string
}

/**
 * Status banner for authentication forms.
 * Only renders when kind !== 'idle'.
 */
export default function AuthNotice({ kind, message }: AuthNoticeProps) {
  if (kind === 'idle') return null

  const kindStyle = kind === 'error' ? styles.error : styles.success

  return (
    <p role="status" className={`${styles.notice} ${kindStyle}`}>
      {message}
    </p>
  )
}
