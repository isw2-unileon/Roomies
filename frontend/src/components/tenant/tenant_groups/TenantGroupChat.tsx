import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  listGroupMessages,
  sendGroupMessage,
  type GroupMessage,
} from '@/services/messageService'
import styles from '@/styles/TenantGroupChat.module.css'

interface TenantGroupChatProps {
  groupId: string
  currentUserId: string
}

export default function TenantGroupChat({ groupId, currentUserId }: TenantGroupChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const items = await listGroupMessages(groupId)
        if (!ignore) setMessages(items)
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : t('tenantGroups.chat.loadError'))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    void load()
    return () => { ignore = true }
  }, [groupId, t])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setIsSending(true)
    setError('')
    try {
      const newMsg = await sendGroupMessage(groupId, trimmed)
      setText('')
      setMessages((prev) => [...prev, newMsg])
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tenantGroups.chat.sendError'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('tenantGroups.chat.title')}</h3>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.messageList} ref={listRef}>
        {isLoading ? (
          <p className={styles.status}>{t('tenantGroups.chat.loading')}</p>
        ) : messages.length === 0 ? (
          <p className={styles.status}>{t('tenantGroups.chat.empty')}</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`${styles.bubble} ${isMine ? styles.bubbleSent : styles.bubbleReceived}`}
              >
                {!isMine && <span className={styles.senderName}>{msg.senderName}</span>}
                <p className={styles.content}>{msg.content}</p>
                <span className={styles.time}>{msg.createdAt}</span>
              </div>
            )
          })
        )}
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('tenantGroups.chat.placeholder')}
          disabled={isSending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
        />
        <button
          className={styles.sendButton}
          onClick={() => void handleSend()}
          disabled={isSending || !text.trim()}
        >
          {isSending ? t('tenantGroups.chat.sending') : t('tenantGroups.chat.send')}
        </button>
      </div>
    </div>
  )
}
