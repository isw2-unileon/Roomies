import { describe, expect, test } from 'vitest'

import { paths } from './paths'
import { resolvePostAuthPath } from './postAuthRedirect'

describe('resolvePostAuthPath', () => {
  test('sends tenants with pending onboarding to tenant onboarding', () => {
    expect(resolvePostAuthPath({ role: 'tenant', needsOnboarding: true })).toBe(paths.tenantOnboarding)
  })

  test('sends owners to the owner dashboard', () => {
    expect(resolvePostAuthPath({ role: 'owner' })).toBe(paths.ownerDashboard)
  })

  test('uses the tenant dashboard as the default authenticated destination', () => {
    expect(resolvePostAuthPath({ role: 'tenant', needsOnboarding: false })).toBe(paths.tenantExplore)
    expect(resolvePostAuthPath({})).toBe(paths.tenantExplore)
  })
})
