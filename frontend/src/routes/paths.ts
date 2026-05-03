export const paths = {
  login: '/',
  register: '/register',
  authCallback: '/auth/callback',
  resetPassword: '/reset-password',
  tenantOnboarding: '/onboarding/tenant',
  tenantExplore: '/tenant/explore',
  ownerComingSoon: '/owner/coming-soon',
  ownerDashboard: '/owner/dashboard',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]
