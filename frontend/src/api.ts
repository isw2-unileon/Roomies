const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

function resolveRequestUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== 'string') {
    return input
  }

  if (!input.startsWith('/') || /^https?:\/\//i.test(input) || API_BASE_URL === '') {
    return input
  }

  return `${API_BASE_URL}${input}`
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(resolveRequestUrl(input), init)
}
