import { apiFetch } from '@/api'

export interface MessageRecord {
  id: string
  senderId: string
  receiverId: string
  apartmentId: string
  content: string
  createdAt: string
  readAt: string
}

export interface Conversation {
  apartmentId: string
  apartmentTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string
  lastMessageAt: string
  lastSenderId: string
  unreadCount: number
}

interface CreateMessageRequestDto {
  receiver_id: string
  apartment_id: string
  content: string
}

interface MessageResponseDto {
  id: string
  sender_id: string
  receiver_id: string
  apartment_id: string
  content: string
  created_at: string
  read_at: string
}

interface CreateMessageResponseDto {
  message?: MessageResponseDto
  error?: string
}

interface ConversationsResponseDto {
  conversations?: ConversationResponseDto[]
  error?: string
}

interface MessagesResponseDto {
  messages?: MessageResponseDto[]
  error?: string
}

interface MarkReadResponseDto {
  updated?: number
  error?: string
}

interface ConversationResponseDto {
  apartment_id: string
  apartment_title: string
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  last_sender_id: string
  unread_count: number
}

function conversationFromDto(dto: ConversationResponseDto): Conversation {
  return {
    apartmentId: dto.apartment_id,
    apartmentTitle: dto.apartment_title,
    otherUserId: dto.other_user_id,
    otherUserName: dto.other_user_name,
    lastMessage: dto.last_message,
    lastMessageAt: dto.last_message_at,
    lastSenderId: dto.last_sender_id,
    unreadCount: dto.unread_count,
  }
}

function messageFromDto(dto: MessageResponseDto): MessageRecord {
  return {
    id: dto.id,
    senderId: dto.sender_id,
    receiverId: dto.receiver_id,
    apartmentId: dto.apartment_id,
    content: dto.content,
    createdAt: dto.created_at,
    readAt: dto.read_at,
  }
}

export async function sendMessage(receiverId: string, apartmentId: string, content: string): Promise<MessageRecord> {
  const response = await apiFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver_id: receiverId,
      apartment_id: apartmentId,
      content,
    } as CreateMessageRequestDto),
  })
  const data = (await response.json()) as CreateMessageResponseDto
  if (!response.ok || !data.message) {
    throw new Error(data.error ?? 'No se pudo enviar el mensaje.')
  }
  return messageFromDto(data.message)
}

export async function listConversations(): Promise<Conversation[]> {
  const response = await apiFetch('/api/messages/conversations')
  const data = (await response.json()) as ConversationsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las conversaciones.')
  }
  return (data.conversations ?? []).map(conversationFromDto)
}

export async function listConversationMessages(apartmentId: string, otherUserId: string): Promise<MessageRecord[]> {
  const response = await apiFetch(`/api/messages/conversations/${apartmentId}/${otherUserId}`)
  const data = (await response.json()) as MessagesResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los mensajes.')
  }
  return (data.messages ?? []).map(messageFromDto)
}

export async function markConversationRead(apartmentId: string, otherUserId: string): Promise<number> {
  const response = await apiFetch(`/api/messages/conversations/${apartmentId}/${otherUserId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = (await response.json()) as MarkReadResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron marcar los mensajes como leídos.')
  }
  return data.updated ?? 0
}
