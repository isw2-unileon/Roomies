import { apiFetch } from '@/api'

export type UserRole = 'tenant' | 'owner'

export interface AuthResult {
  message?: string
  userId?: string
  role?: UserRole
  needsOnboarding?: boolean
}

export interface ProfileStatus {
  role?: UserRole
  needsOnboarding?: boolean
}

interface AuthResponseDto {
  message?: string
  user_id?: string
  role?: UserRole
  needs_onboarding?: boolean
  error?: string
}

interface MessageResponseDto {
  message?: string
  error?: string
}

interface ProfileStatusResponseDto {
  role?: UserRole
  needs_onboarding?: boolean
  error?: string
}

function authResultFromDto(dto: AuthResponseDto): AuthResult {
  return {
    message: dto.message,
    userId: dto.user_id,
    role: dto.role,
    needsOnboarding: dto.needs_onboarding,
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export async function login(input: { email: string; password: string }) {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseJson<AuthResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'login failed')
  }
  return authResultFromDto(data)
}

export async function register(input: { email: string; password: string; fullName: string; role: UserRole }) {
  const response = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      role: input.role,
    }),
  })
  const data = await parseJson<AuthResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'registration failed')
  }
  return authResultFromDto(data)
}

export async function forgotPassword(email: string) {
  const response = await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await parseJson<MessageResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'password recovery failed')
  }
  return data.message
}

export async function confirmEmail(input: { tokenHash: string; token: string; type: string; email: string }) {
  const response = await apiFetch('/api/auth/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token_hash: input.tokenHash,
      token: input.token,
      type: input.type,
      email: input.email,
    }),
  })
  const data = await parseJson<AuthResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'confirmation failed')
  }
  return authResultFromDto(data)
}

export async function resetPassword(accessToken: string, password: string) {
  const response = await apiFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  })
  const data = await parseJson<MessageResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'password reset failed')
  }
  return data.message
}

export async function logout() {
  const response = await apiFetch('/api/auth/logout', {
    method: 'POST',
  })
  const data = await parseJson<MessageResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'logout failed')
  }
}

export async function getProfileStatus(): Promise<ProfileStatus> {
  const response = await apiFetch('/api/profile/status')
  const data = await parseJson<ProfileStatusResponseDto>(response)
  if (!response.ok) {
    throw new Error(data.error ?? 'profile status failed')
  }
  return { role: data.role, needsOnboarding: data.needs_onboarding }
}
