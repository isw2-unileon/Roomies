import { paths, type AppPath } from './paths'

export interface AuthSuccessPayload {
  role?: 'tenant' | 'owner'
  needsOnboarding?: boolean
}

export function resolvePostAuthPath(payload: AuthSuccessPayload): AppPath {
  if (payload.role === 'tenant' && payload.needsOnboarding) {
    return paths.tenantOnboarding
  }

  if (payload.role === 'owner') {
    return paths.ownerProperties
  }

  if (payload.role === 'tenant') {
    return paths.tenantExplore
  }

  return paths.login;

}
