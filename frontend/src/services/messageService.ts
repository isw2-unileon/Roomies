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
  const aptParam = apartmentId || 'direct'
  const response = await apiFetch(`/api/messages/conversations/${aptParam}/${otherUserId}`)
  const data = (await response.json()) as MessagesResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los mensajes.')
  }
  return (data.messages ?? []).map(messageFromDto)
}

export async function markConversationRead(apartmentId: string, otherUserId: string): Promise<number> {
  const aptParam = apartmentId || 'direct'
  const response = await apiFetch(`/api/messages/conversations/${aptParam}/${otherUserId}/read`, {
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

// --- Group Conversations ---

export interface GroupConversation {
  groupId: string
  groupName: string
  lastMessage: string
  lastMessageAt: string
  lastSenderName: string
}

interface GroupConversationResponseDto {
  group_id: string
  group_name: string
  last_message: string
  last_message_at: string
  last_sender_name: string
}

function groupConversationFromDto(dto: GroupConversationResponseDto): GroupConversation {
  return {
    groupId: dto.group_id,
    groupName: dto.group_name,
    lastMessage: dto.last_message,
    lastMessageAt: dto.last_message_at,
    lastSenderName: dto.last_sender_name,
  }
}

export async function listGroupConversations(): Promise<GroupConversation[]> {
  const response = await apiFetch('/api/messages/group-conversations')
  const data = (await response.json()) as { group_conversations?: GroupConversationResponseDto[]; error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar las conversaciones de grupo.')
  }
  return (data.group_conversations ?? []).map(groupConversationFromDto)
}

// --- Group Chat ---

export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

interface GroupMessageResponseDto {
  id: string
  group_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

function groupMessageFromDto(dto: GroupMessageResponseDto): GroupMessage {
  return {
    id: dto.id,
    groupId: dto.group_id,
    senderId: dto.sender_id,
    senderName: dto.sender_name,
    content: dto.content,
    createdAt: dto.created_at,
  }
}

export async function sendGroupMessage(groupId: string, content: string, role: 'tenant' | 'owner' = 'tenant'): Promise<GroupMessage> {
  const basePath = role === 'owner' ? `/api/owner/groups/${groupId}/messages` : `/api/tenant/groups/${groupId}/messages`
  const response = await apiFetch(basePath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const data = (await response.json()) as { message?: GroupMessageResponseDto; error?: string }
  if (!response.ok || !data.message) {
    throw new Error(data.error ?? 'No se pudo enviar el mensaje al grupo.')
  }
  return groupMessageFromDto(data.message)
}

export async function listGroupMessages(groupId: string, role: 'tenant' | 'owner' = 'tenant'): Promise<GroupMessage[]> {
  const basePath = role === 'owner' ? `/api/owner/groups/${groupId}/messages` : `/api/tenant/groups/${groupId}/messages`
  const response = await apiFetch(basePath)
  const data = (await response.json()) as { messages?: GroupMessageResponseDto[]; error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los mensajes del grupo.')
  }
  return (data.messages ?? []).map(groupMessageFromDto)
}
