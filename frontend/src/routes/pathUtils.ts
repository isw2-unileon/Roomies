import { paths } from './paths'

interface LocationLike {
  hash: string
  pathname: string
  search: string
}

export function resolveLoginRedirect(location: LocationLike) {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(location.search)

  const flowType = (hashParams.get('type') || queryParams.get('type') || '').trim().toLowerCase()
  const hasAccessToken = (hashParams.get('access_token') || queryParams.get('access_token') || '').trim().length > 0
  const hasTokenHash = (hashParams.get('token_hash') || queryParams.get('token_hash') || '').trim().length > 0

  if (flowType === 'recovery' && hasAccessToken) {
    return paths.resetPassword
  }

  if ((flowType === 'signup' || hasTokenHash) && (hasAccessToken || hasTokenHash)) {
    return paths.authCallback
  }

  return null
}
