import { useEffect, useId, useRef } from 'react'
import { EnvelopeIcon, GiftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { paths } from '@/routes/paths'
import styles from '@/styles/TenantSidebar.module.css'

interface TenantInviteDialogProps {
  onClose: () => void
}

export default function TenantInviteDialog({ onClose }: TenantInviteDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const inviteUrl = `https://roomies-1-fegt.onrender.com/`
  const inviteMessage = t('tenantDashboard.invite.shareMessage', { url: inviteUrl })
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`
  const mailUrl = `mailto:?subject=${encodeURIComponent(t('tenantDashboard.invite.emailSubject'))}&body=${encodeURIComponent(inviteMessage)}`

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusableElements?.length) return

      const firstElement = focusableElements.item(0)
      const lastElement = focusableElements.item(focusableElements.length - 1)
      if (!firstElement || !lastElement) return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.dialogOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.dialogCloseButton}
          aria-label={t('tenantDashboard.invite.close')}
          onClick={onClose}
        >
          <XMarkIcon className={styles.iconSmall} aria-hidden="true" />
        </button>
        <div className={styles.dialogIcon}>
          <GiftIcon className={styles.iconMedium} aria-hidden="true" />
        </div>
        <div className={styles.dialogText}>
          <p className={styles.dialogKicker}>{t('tenantDashboard.invite.kicker')}</p>
          <h2 id={titleId} className={styles.dialogTitle}>{t('tenantDashboard.sidebar.referTitle')}</h2>
          <p id={descriptionId} className={styles.dialogDescription}>
            {t('tenantDashboard.invite.description')}
          </p>
        </div>
        <div className={styles.inviteLinkBox}>
          <span>{inviteUrl}</span>
        </div>
        <div className={styles.dialogActions}>
          <a className={styles.whatsappAction} href={whatsappUrl} target="_blank" rel="noreferrer">
            {t('tenantDashboard.invite.whatsapp')}
          </a>
          <a className={styles.emailAction} href={mailUrl}>
            <EnvelopeIcon className={styles.iconSmall} aria-hidden="true" />
            {t('tenantDashboard.invite.email')}
          </a>
        </div>
      </div>
    </div>
  )
}
