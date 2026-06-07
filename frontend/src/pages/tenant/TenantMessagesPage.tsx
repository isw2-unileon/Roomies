import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import TenantLayout from '@/components/tenant/TenantLayout'
import {
  listConversations,
  listConversationMessages,
  listGroupConversations,
  listGroupMessages,
  markConversationRead,
  sendMessage,
  sendGroupMessage,
  type Conversation,
  type GroupConversation,
  type GroupMessage,
  type MessageRecord,
} from '@/services/messageService'
import { getTenantPersonalProfile } from '@/services/tenantService'
import styles from '@/styles/TenantMessages.module.css'

interface ActiveDMThread {
  kind: 'dm'
  apartmentId: string
  otherUserId: string
  otherUserName: string
  apartmentTitle: string
}

interface ActiveGroupThread {
  kind: 'group'
  groupId: string
  groupName: string
}

type ActiveThread = ActiveDMThread | ActiveGroupThread

export default function TenantMessagesPage() {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null)
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([])
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [threadError, setThreadError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const [dmItems, groupItems, profile] = await Promise.all([
          listConversations(),
          listGroupConversations().catch(() => [] as GroupConversation[]),
          getTenantPersonalProfile().catch(() => null),
        ])
        if (!ignore) {
          setConversations(dmItems)
          setGroupConversations(groupItems)
          if (profile) setCurrentUserId(profile.userId)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('tenantDashboard.messages.loadError'))
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    void load()
    return () => { ignore = true }
  }, [t])

  useEffect(() => {
    if (!activeThread) {
      setMessages([])
      setGroupMessages([])
      return
    }
    const thread = activeThread
    let ignore = false
    async function loadThread() {
      setIsLoadingThread(true)
      setThreadError('')
      try {
        if (thread.kind === 'dm') {
          const [msgs] = await Promise.all([
            listConversationMessages(thread.apartmentId, thread.otherUserId),
            markConversationRead(thread.apartmentId, thread.otherUserId),
          ])
          if (!ignore) {
            setMessages(msgs)
            setGroupMessages([])
            setConversations((prev) =>
              prev.map((c) =>
                c.apartmentId === thread.apartmentId && c.otherUserId === thread.otherUserId
                  ? { ...c, unreadCount: 0 }
                  : c
              )
            )
          }
        } else {
          const msgs = await listGroupMessages(thread.groupId)
          if (!ignore) {
            setGroupMessages(msgs)
            setMessages([])
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setThreadError(loadError instanceof Error ? loadError.message : t('tenantDashboard.messages.loadError'))
        }
      } finally {
        if (!ignore) setIsLoadingThread(false)
      }
    }
    void loadThread()
    return () => { ignore = true }
  }, [activeThread, t])

  async function handleSendReply() {
    const trimmed = replyText.trim()
    if (!trimmed || !activeThread) return
    setIsSending(true)
    setThreadError('')
    try {
      if (activeThread.kind === 'dm') {
        await sendMessage(activeThread.otherUserId, activeThread.apartmentId, trimmed)
        setReplyText('')
        const updated = await listConversationMessages(activeThread.apartmentId, activeThread.otherUserId)
        setMessages(updated)
      } else {
        const newMsg = await sendGroupMessage(activeThread.groupId, trimmed)
        setReplyText('')
        setGroupMessages((prev) => [...prev, newMsg])
      }
    } catch (sendError) {
      setThreadError(sendError instanceof Error ? sendError.message : t('tenantDashboard.detail.messageSendError'))
    } finally {
      setIsSending(false)
    }
  }

  const sortedItems = useMemo(() => {
    const dmItems = conversations.map((c) => ({
      key: `dm-${c.apartmentId}-${c.otherUserId}`,
      kind: 'dm' as const,
      name: c.otherUserName || c.otherUserId,
      subtitle: c.apartmentTitle,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.unreadCount,
      data: c,
    }))
    const groupItems = groupConversations.map((g) => ({
      key: `group-${g.groupId}`,
      kind: 'group' as const,
      name: g.groupName,
      subtitle: g.lastSenderName ? `${g.lastSenderName}` : t('tenantGroups.chat.title'),
      lastMessage: g.lastMessage,
      lastMessageAt: g.lastMessageAt,
      unreadCount: 0,
      data: g,
    }))
    return [...dmItems, ...groupItems].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
  }, [conversations, groupConversations, t])

  function isActive(item: (typeof sortedItems)[number]) {
    if (!activeThread) return false
    if (item.kind === 'dm' && activeThread.kind === 'dm') {
      const c = item.data as Conversation
      return c.apartmentId === activeThread.apartmentId && c.otherUserId === activeThread.otherUserId
    }
    if (item.kind === 'group' && activeThread.kind === 'group') {
      return (item.data as GroupConversation).groupId === activeThread.groupId
    }
    return false
  }

  function handleSelectItem(item: (typeof sortedItems)[number]) {
    if (item.kind === 'dm') {
      const c = item.data as Conversation
      setActiveThread({
        kind: 'dm',
        apartmentId: c.apartmentId,
        otherUserId: c.otherUserId,
        otherUserName: c.otherUserName,
        apartmentTitle: c.apartmentTitle,
      })
    } else {
      const g = item.data as GroupConversation
      setActiveThread({ kind: 'group', groupId: g.groupId, groupName: g.groupName })
    }
  }

  const threadTitle = activeThread?.kind === 'dm' ? activeThread.otherUserName : activeThread?.groupName ?? ''
  const threadSubtitle = activeThread?.kind === 'dm' ? activeThread.apartmentTitle : t('tenantGroups.chat.title')

  return (
    <TenantLayout>
      <div className={styles.content}>
        <section className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('tenantDashboard.messages.title')}</h1>
            <p className={styles.subtitle}>{t('tenantDashboard.messages.subtitle')}</p>
          </div>
        </section>

        <div className={styles.layout}>
          <section className={styles.conversationList} aria-label={t('tenantDashboard.messages.title')}>
            {error ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>{t('tenantDashboard.messages.loadError')}</p>
                <p className={styles.emptySubtitle}>{error}</p>
              </div>
            ) : isLoading ? (
              <div className={styles.emptyState}>
                <p className={styles.statusText}>{t('tenantDashboard.messages.loading')}</p>
              </div>
            ) : sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <button
                  key={item.key}
                  className={`${styles.conversationCard} ${isActive(item) ? styles.conversationCardActive : ''}`}
                  onClick={() => handleSelectItem(item)}
                >
                  <div className={styles.conversationHeader}>
                    <p className={styles.conversationName}>
                      {item.kind === 'group' ? `${item.name}` : item.name}
                    </p>
                    {item.unreadCount > 0 ? (
                      <span className={styles.unreadBadge}>{item.unreadCount}</span>
                    ) : null}
                  </div>
                  <p className={styles.conversationApartment}>{item.subtitle}</p>
                  <div className={styles.conversationMeta}>
                    <p className={styles.conversationLastMessage}>{item.lastMessage}</p>
                    <p className={styles.conversationDate}>{item.lastMessageAt}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>{t('tenantDashboard.messages.empty.title')}</p>
                <p className={styles.emptySubtitle}>{t('tenantDashboard.messages.empty.subtitle')}</p>
              </div>
            )}
          </section>

          {activeThread ? (
            <section className={styles.threadPanel} aria-label={t('tenantDashboard.messages.conversation.lastMessage')}>
              <div className={styles.threadHeader}>
                <button
                  className={styles.threadBackButton}
                  onClick={() => setActiveThread(null)}
                >
                  {t('tenantDashboard.messages.thread.back')}
                </button>
                <div>
                  <p className={styles.threadTitle}>{threadTitle}</p>
                  <p className={styles.threadSubtitle}>{threadSubtitle}</p>
                </div>
              </div>

              {threadError ? <p className={styles.statusText}>{threadError}</p> : null}

              <div className={styles.messageList}>
                {isLoadingThread ? (
                  <p className={styles.statusText}>{t('tenantDashboard.messages.loading')}</p>
                ) : activeThread.kind === 'dm' ? (
                  messages.length === 0 ? (
                    <p className={styles.statusText}>{t('tenantDashboard.messages.empty.subtitle')}</p>
                  ) : (
                    messages.map((msg) => {
                      const isSent = msg.senderId !== (activeThread as ActiveDMThread).otherUserId
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
                  )
                ) : (
                  groupMessages.length === 0 ? (
                    <p className={styles.statusText}>{t('tenantGroups.chat.empty')}</p>
                  ) : (
                    groupMessages.map((msg) => {
                      const isMine = msg.senderId === currentUserId
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.messageBubble} ${isMine ? styles.messageBubbleSent : styles.messageBubbleReceived}`}
                        >
                          {!isMine && <p className={styles.messageSender}>{msg.senderName}</p>}
                          <p style={{ margin: 0 }}>{msg.content}</p>
                          <p className={styles.messageTime}>{msg.createdAt}</p>
                        </div>
                      )
                    })
                  )
                )}
              </div>

              <div className={styles.threadInputRow}>
                <textarea
                  className={styles.threadInput}
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('tenantDashboard.messages.thread.placeholder')}
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
                  {isSending ? t('tenantDashboard.messages.thread.sending') : t('tenantDashboard.messages.thread.send')}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </TenantLayout>
  )
}
