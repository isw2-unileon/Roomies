import { describe, expect, test, beforeEach } from 'vitest'

import { clearAuthSession, getAccessToken, getAuthorizationHeader, saveAuthSession } from './authSession'

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('saves and clears auth tokens through a single session API', () => {
    saveAuthSession({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    expect(getAccessToken()).toBe('access-token')
    expect(getAuthorizationHeader()).toEqual({ Authorization: 'Bearer access-token' })
    expect(localStorage.getItem('roomies.refresh_token')).toBe('refresh-token')

    clearAuthSession()

    expect(getAccessToken()).toBe('')
    expect(getAuthorizationHeader()).toEqual({})
    expect(localStorage.getItem('roomies.refresh_token')).toBeNull()
  })
})
