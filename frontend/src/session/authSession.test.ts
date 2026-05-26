import { describe, expect, test, beforeEach } from 'vitest'

import { clearAuthSession, getAccessToken, saveAuthSession } from './authSession'

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('does not persist auth tokens in localStorage', () => {
    saveAuthSession({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    expect(getAccessToken()).toBe('')
    expect(localStorage.getItem('roomies.access_token')).toBeNull()
    expect(localStorage.getItem('roomies.refresh_token')).toBeNull()

    clearAuthSession()

    expect(getAccessToken()).toBe('')
    expect(localStorage.getItem('roomies.refresh_token')).toBeNull()
  })
})
