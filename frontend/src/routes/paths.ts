export const paths = {
  login: '/',
  register: '/register',
  authCallback: '/auth/callback',
  resetPassword: '/reset-password',
  tenantOnboarding: '/onboarding/tenant',
  tenantExplore: '/tenant/explore',
  tenantExploreDetail: '/tenant/explore/:propertyId',
  tenantApplications: '/tenant/applications',
  tenantGroups: '/tenant/groups',
  tenantCreateGroup: '/tenant/groups/new',
  tenantMessages: '/tenant/messages',
  tenantNotifications: '/tenant/notifications',
  tenantProfile: '/tenant/profile',
  ownerProperties: '/owner/properties',
  ownerPublishProperty: '/owner/properties/new',
  ownerApplications: '/owner/applications',
  ownerMessages: '/owner/messages',
  ownerNotifications: '/owner/notifications',
  ownerProfile: '/owner/profile',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]
