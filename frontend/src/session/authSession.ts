export interface AuthSessionTokens {
  accessToken?: string
  refreshToken?: string
}

const ACCESS_TOKEN_KEY = 'roomies.access_token'
const REFRESH_TOKEN_KEY = 'roomies.refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)?.trim() ?? ''
}

export function saveAuthSession(tokens: AuthSessionTokens) {
  const accessToken = tokens.accessToken?.trim() ?? ''
  const refreshToken = tokens.refreshToken?.trim() ?? ''

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAuthorizationHeader(): Record<string, string> {
	const accessToken = getAccessToken()
	return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}
