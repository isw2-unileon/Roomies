import type { TenantRoommateProfile } from '@/types/tenant'

export type CompatibilitySort = 'default' | 'compatibility_desc' | 'compatibility_asc'
export type TenantBooleanFilter = 'all' | 'yes' | 'no'
export type TenantLevelFilter = 'all' | 'low' | 'medium' | 'high'
export type TenantSituationFilter = 'all' | 'student' | 'worker' | 'unemployed'

export interface TenantProfileFilters {
  compatibilitySort: CompatibilitySort
  maxBudget: string
  preferredArea: string
  situation: TenantSituationFilter
  socializationLevel: TenantLevelFilter
  nightlifeLevel: TenantLevelFilter
  pets: TenantBooleanFilter
  smoking: TenantBooleanFilter
}

export const defaultTenantProfileFilters: TenantProfileFilters = {
  compatibilitySort: 'default',
  maxBudget: '',
  preferredArea: '',
  situation: 'all',
  socializationLevel: 'all',
  nightlifeLevel: 'all',
  pets: 'all',
  smoking: 'all',
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase()
}

function matchesBooleanFilter(value: boolean, filter: TenantBooleanFilter) {
  if (filter === 'all') return true
  return filter === 'yes' ? value : !value
}

function matchesTextFilter(value: string | null | undefined, filter: string) {
  const normalizedFilter = normalizeText(filter)
  if (!normalizedFilter) return true
  return normalizeText(value).includes(normalizedFilter)
}

function matchesBudgetFilter(profileBudget: number, maxBudgetFilter: string) {
  const maxBudget = Number(maxBudgetFilter)
  if (!maxBudgetFilter.trim() || Number.isNaN(maxBudget) || maxBudget <= 0) {
    return true
  }
  return profileBudget > 0 && profileBudget <= maxBudget
}

export function matchesTenantProfileFilters(profile: TenantRoommateProfile, filters: TenantProfileFilters) {
  if (!matchesBudgetFilter(profile.budgetMax, filters.maxBudget)) return false
  if (!matchesTextFilter(profile.preferredArea, filters.preferredArea)) return false
  if (filters.situation !== 'all' && profile.situation !== filters.situation) return false
  if (filters.socializationLevel !== 'all' && profile.socializationLevel !== filters.socializationLevel) return false
  if (filters.nightlifeLevel !== 'all' && profile.nightlifeLevel !== filters.nightlifeLevel) return false
  if (!matchesBooleanFilter(profile.pets, filters.pets)) return false
  if (!matchesBooleanFilter(profile.smoking, filters.smoking)) return false
  return true
}

export function sortTenantProfilesByCompatibility(
  profiles: TenantRoommateProfile[],
  sort: CompatibilitySort,
) {
  if (sort === 'default') {
    return profiles
  }

  return [...profiles].sort((first, second) => {
    const firstScore = first.compatibility ?? 0
    const secondScore = second.compatibility ?? 0
    return sort === 'compatibility_desc'
      ? secondScore - firstScore
      : firstScore - secondScore
  })
}

export function filterTenantProfiles(
  profiles: TenantRoommateProfile[],
  filters: TenantProfileFilters,
) {
  return sortTenantProfilesByCompatibility(
    profiles.filter((profile) => matchesTenantProfileFilters(profile, filters)),
    filters.compatibilitySort,
  )
}
