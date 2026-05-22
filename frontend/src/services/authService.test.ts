import { beforeEach, describe, expect, test, vi } from 'vitest'

import { login } from './authService'

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('logs in with backend DTOs and returns camelCase auth data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'login successful',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user_id: 'user-1',
        role: 'tenant',
        needs_onboarding: true,
      }),
    } as Response)

    await expect(login({ email: 'user@example.test', password: 'secret' })).resolves.toEqual({
      message: 'login successful',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: 'user-1',
      role: 'tenant',
      needsOnboarding: true,
    })
  })
})
