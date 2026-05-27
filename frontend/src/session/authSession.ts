export interface AuthSessionTokens {
  accessToken?: string
  refreshToken?: string
}

const ACCESS_TOKEN_KEY = 'roomies.access_token'
const REFRESH_TOKEN_KEY = 'roomies.refresh_token'

export function getAccessToken() {
	return ''
}

export function saveAuthSession(tokens?: AuthSessionTokens) {
	void tokens
	clearLegacyTokenStorage()
}

export function clearAuthSession() {
	clearLegacyTokenStorage()
}

function clearLegacyTokenStorage() {
	localStorage.removeItem(ACCESS_TOKEN_KEY)
	localStorage.removeItem(REFRESH_TOKEN_KEY)
}
