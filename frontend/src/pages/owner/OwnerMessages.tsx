import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import OwnerLayout from '@/components/owner/OwnerLayout'
import {
  listConversations,
  listConversationMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
  type MessageRecord,
} from '@/services/messageService'
import styles from '@/styles/OwnerMessages.module.css'

interface ActiveThread {
  apartmentId: string
  otherUserId: string
  otherUserName: string
  apartmentTitle: string
}

export default function OwnerMessages() {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null)
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [threadError, setThreadError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let ignoreResult = false
    async function loadConversations() {
      setIsLoading(true)
      setError('')
      try {
        const items = await listConversations()
        if (!ignoreResult) {
          setConversations(items)
        }
      } catch (loadError) {
        if (!ignoreResult) {
          setError(loadError instanceof Error ? loadError.message : t('ownerDashboard.messages.loadError'))
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false)
        }
      }
    }
    void loadConversations()
    return () => { ignoreResult = true }
  }, [t])

  useEffect(() => {
    if (!activeThread) {
      setMessages([])
      return
    }
    const thread = activeThread
    let ignoreResult = false
    async function loadThread() {
      setIsLoadingThread(true)
      setThreadError('')
      try {
        const [msgs] = await Promise.all([
          listConversationMessages(thread.apartmentId, thread.otherUserId),
          markConversationRead(thread.apartmentId, thread.otherUserId),
        ])
        if (!ignoreResult) {
          setMessages(msgs)
          setConversations((prev) =>
            prev.map((c) =>
              c.apartmentId === thread.apartmentId && c.otherUserId === thread.otherUserId
                ? { ...c, unreadCount: 0 }
                : c
            )
          )
        }
      } catch (loadError) {
        if (!ignoreResult) {
          setThreadError(loadError instanceof Error ? loadError.message : t('ownerDashboard.messages.loadError'))
        }
      } finally {
        if (!ignoreResult) {
          setIsLoadingThread(false)
        }
      }
    }
    void loadThread()
    return () => { ignoreResult = true }
  }, [activeThread, t])

  async function handleSendReply() {
    const trimmed = replyText.trim()
    if (!trimmed || !activeThread) return
    setIsSending(true)
    setThreadError('')
    try {
      await sendMessage(activeThread.otherUserId, activeThread.apartmentId, trimmed)
      setReplyText('')
      const updatedMessages = await listConversationMessages(activeThread.apartmentId, activeThread.otherUserId)
      setMessages(updatedMessages)
    } catch (sendError) {
      setThreadError(sendError instanceof Error ? sendError.message : t('tenantDashboard.detail.messageSendError'))
    } finally {
      setIsSending(false)
    }
  }

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
  }, [conversations])

  return (
    <OwnerLayout>
      <div className={styles.content}>
        <section className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('ownerDashboard.messages.title')}</h1>
            <p className={styles.subtitle}>{t('ownerDashboard.messages.subtitle')}</p>
          </div>
        </section>

        <div className={styles.layout}>
          <section className={styles.conversationList} aria-label={t('ownerDashboard.messages.title')}>
            {error ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>{t('ownerDashboard.messages.loadError')}</p>
                <p className={styles.emptySubtitle}>{error}</p>
              </div>
            ) : isLoading ? (
              <div className={styles.emptyState}>
                <p className={styles.statusText}>{t('ownerDashboard.messages.loading')}</p>
              </div>
            ) : sortedConversations.length > 0 ? (
              sortedConversations.map((conversation) => {
                const isActive =
                  activeThread?.apartmentId === conversation.apartmentId &&
                  activeThread?.otherUserId === conversation.otherUserId
                return (
                  <button
                    key={`${conversation.apartmentId}-${conversation.otherUserId}`}
                    className={`${styles.conversationCard} ${isActive ? styles.conversationCardActive : ''}`}
                    onClick={() =>
                      setActiveThread({
                        apartmentId: conversation.apartmentId,
                        otherUserId: conversation.otherUserId,
                        otherUserName: conversation.otherUserName,
                        apartmentTitle: conversation.apartmentTitle,
                      })
                    }
                  >
                    <div className={styles.conversationHeader}>
                      <p className={styles.conversationName}>{conversation.otherUserName || conversation.otherUserId}</p>
                      {conversation.unreadCount > 0 ? (
                        <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                    <p className={styles.conversationApartment}>{conversation.apartmentTitle}</p>
                    <div className={styles.conversationMeta}>
                      <p className={styles.conversationLastMessage}>{conversation.lastMessage}</p>
                      <p className={styles.conversationDate}>{conversation.lastMessageAt}</p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>{t('ownerDashboard.messages.empty.title')}</p>
                <p className={styles.emptySubtitle}>{t('ownerDashboard.messages.empty.subtitle')}</p>
              </div>
            )}
          </section>

          {activeThread ? (
            <section className={styles.threadPanel} aria-label={t('ownerDashboard.messages.conversation.lastMessage')}>
              <div className={styles.threadHeader}>
                <button
                  className={styles.threadBackButton}
                  onClick={() => setActiveThread(null)}
                >
                  {t('ownerDashboard.messages.thread.back')}
                </button>
                <div>
                  <p className={styles.threadTitle}>{activeThread.otherUserName}</p>
                  <p className={styles.threadSubtitle}>{activeThread.apartmentTitle}</p>
                </div>
              </div>

              {threadError ? <p className={styles.statusText}>{threadError}</p> : null}

              <div className={styles.messageList}>
                {isLoadingThread ? (
                  <p className={styles.statusText}>{t('ownerDashboard.messages.loading')}</p>
                ) : messages.length === 0 ? (
                  <p className={styles.statusText}>{t('ownerDashboard.messages.empty.subtitle')}</p>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.senderId !== activeThread.otherUserId
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.messageBubble} ${isSent ? styles.messageBubbleSent : styles.messageBubbleReceived}`}
                      >
                        <p style={{ margin: 0 }}>{msg.content}</p>
                        <p className={styles.messageTime}>{msg.createdAt}</p>
                      </div>
                    )
                  })
                )}
              </div>

              <div className={styles.threadInputRow}>
                <textarea
                  className={styles.threadInput}
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('ownerDashboard.messages.thread.placeholder')}
                  disabled={isSending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSendReply()
                    }
                  }}
                />
                <button
                  className={styles.threadSendButton}
                  onClick={() => void handleSendReply()}
                  disabled={isSending || !replyText.trim()}
                >
                  {isSending ? t('ownerDashboard.messages.thread.sending') : t('ownerDashboard.messages.thread.send')}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </OwnerLayout>
  )
}
