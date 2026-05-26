import { beforeEach, describe, expect, test, vi } from 'vitest'

import { login, logout } from './authService'

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('logs in with backend DTOs and returns camelCase auth data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'login successful',
        user_id: 'user-1',
        role: 'tenant',
        needs_onboarding: true,
      }),
    } as Response)

    await expect(login({ email: 'user@example.test', password: 'secret' })).resolves.toEqual({
      message: 'login successful',
      userId: 'user-1',
      role: 'tenant',
      needsOnboarding: true,
    })
  })

  test('logs out through the backend session endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'logout successful' }),
    } as Response)

    await expect(logout()).resolves.toBeUndefined()

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
  })
})
