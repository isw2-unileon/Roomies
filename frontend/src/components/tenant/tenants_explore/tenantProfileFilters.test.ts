import { describe, expect, test } from 'vitest'

import {
  defaultTenantProfileFilters,
  filterTenantProfiles,
  matchesTenantProfileFilters,
} from './tenantProfileFilters'
import type { TenantRoommateProfile } from '@/types/tenant'

function makeProfile(overrides: Partial<TenantRoommateProfile> = {}): TenantRoommateProfile {
  return {
    userId: 'tenant-1',
    name: 'Laura',
    email: 'laura@example.com',
    avatarUrl: '',
    age: 21,
    sex: 'female',
    situation: 'student',
    degree: 'Engineering',
    profession: '',
    budgetMax: 500,
    preferredArea: 'Leon Centro',
    pets: true,
    smoking: false,
    socializationLevel: 'high',
    nightlifeLevel: 'low',
    compatibility: 82,
    ...overrides,
  }
}

describe('tenant profile filters', () => {
  test('matches preferred area with case-insensitive partial text', () => {
    expect(matchesTenantProfileFilters(makeProfile(), {
      ...defaultTenantProfileFilters,
      preferredArea: 'centro',
    })).toBe(true)
  })

  test('filters by maximum budget', () => {
    expect(matchesTenantProfileFilters(makeProfile({ budgetMax: 650 }), {
      ...defaultTenantProfileFilters,
      maxBudget: '600',
    })).toBe(false)
  })

  test('filters by situation and lifestyle levels', () => {
    expect(matchesTenantProfileFilters(makeProfile(), {
      ...defaultTenantProfileFilters,
      situation: 'student',
      socializationLevel: 'high',
      nightlifeLevel: 'low',
    })).toBe(true)
  })

  test('filters by pets and smoking booleans', () => {
    expect(matchesTenantProfileFilters(makeProfile(), {
      ...defaultTenantProfileFilters,
      pets: 'yes',
      smoking: 'no',
    })).toBe(true)
  })

  test('sorts by highest compatibility first', () => {
    const profiles = filterTenantProfiles([
      makeProfile({ userId: 'low', compatibility: 20 }),
      makeProfile({ userId: 'high', compatibility: 90 }),
    ], {
      ...defaultTenantProfileFilters,
      compatibilitySort: 'compatibility_desc',
    })

    expect(profiles.map((profile) => profile.userId)).toEqual(['high', 'low'])
  })

  test('sorts by lowest compatibility first', () => {
    const profiles = filterTenantProfiles([
      makeProfile({ userId: 'high', compatibility: 90 }),
      makeProfile({ userId: 'low', compatibility: 20 }),
    ], {
      ...defaultTenantProfileFilters,
      compatibilitySort: 'compatibility_asc',
    })

    expect(profiles.map((profile) => profile.userId)).toEqual(['low', 'high'])
  })

  test('missing fields do not throw with default filters', () => {
    expect(() => filterTenantProfiles([
      makeProfile({ budgetMax: 0, preferredArea: '', situation: '', socializationLevel: '', nightlifeLevel: '' }),
    ], defaultTenantProfileFilters)).not.toThrow()
  })
})
