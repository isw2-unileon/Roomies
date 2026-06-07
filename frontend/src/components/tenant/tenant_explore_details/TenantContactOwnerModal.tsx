import { useEffect, useId, useRef, useState } from 'react'
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { sendMessage } from '@/services/messageService'
import styles from '@/styles/TenantInterestedTenants.module.css'

interface TenantContactModalProps {
  apartmentId: string
  recipientId: string
  recipientName?: string
  titleKey?: string
  onClose: () => void
}

export default function TenantContactModal({ apartmentId, recipientId, recipientName, titleKey, onClose }: TenantContactModalProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

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
        'textarea, button:not([disabled])'
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

  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed || !recipientId || !apartmentId) {
      setError(t('tenantDashboard.detail.messageSendError'))
      return
    }
    setIsSending(true)
    setError('')
    setNotice('')
    try {
      await sendMessage(recipientId, apartmentId, trimmed)
      setNotice(t('tenantDashboard.detail.messageSent'))
      setContent('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('tenantDashboard.detail.messageSendError'))
    } finally {
      setIsSending(false)
    }
  }

  const title = titleKey ? t(titleKey) : t('tenantDashboard.detail.contact')

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} ref={dialogRef}>
        <button ref={closeButtonRef} className={styles.modalClose} onClick={onClose} aria-label="close">
          <XMarkIcon className={styles.iconSmall} aria-hidden="true" />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderBody}>
            <div className={styles.modalTitleRow}>
              <div>
                <p className={styles.modalName}>{title}</p>
                <p className={styles.modalMeta}>{recipientName || ''}</p>
              </div>
            </div>
          </div>
        </div>

        {notice ? <p className={styles.modalStatus} style={{ color: '#087046' }}>{notice}</p> : null}
        {error ? <p className={styles.modalStatus} style={{ color: '#9b1c1c' }}>{error}</p> : null}

        <textarea
          id={descriptionId}
          className={styles.modalTextarea}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('tenantDashboard.detail.messagePlaceholder')}
          disabled={isSending}
        />

        <button
          className={styles.inviteButton}
          onClick={handleSend}
          disabled={isSending || !content.trim()}
        >
          <PaperAirplaneIcon className={styles.iconSmall} aria-hidden="true" />
          {isSending ? t('tenantDashboard.detail.sendingMessage') : t('tenantDashboard.detail.sendMessage')}
        </button>
      </div>
    </div>
  )
}
