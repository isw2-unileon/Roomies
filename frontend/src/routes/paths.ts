export const paths = {
  login: '/',
  register: '/register',
  authCallback: '/auth/callback',
  resetPassword: '/reset-password',
  tenantOnboarding: '/onboarding/tenant',
  tenantExplore: '/tenant/explore',
  tenantApplications: '/tenant/applications',
  tenantGroups: '/tenant/groups',
  tenantMessages: '/tenant/messages',
  tenantNotifications: '/tenant/notifications',
  tenantProfile: '/tenant/profile',
  ownerComingSoon: '/owner/coming-soon',
  ownerDashboard: '/owner/dashboard',
  ownerPublishProperty: '/owner/properties/new',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]
