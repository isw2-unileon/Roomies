export const paths = {
  login: '/',
  register: '/register',
  authCallback: '/auth/callback',
  resetPassword: '/reset-password',
  tenantOnboarding: '/onboarding/tenant',
  tenantDashboard: '/tenant/dashboard',
  ownerComingSoon: '/owner/coming-soon',
  ownerDashboard: '/owner/dashboard',
} as const

export const legacyPaths = {
  tenantDashboard: '/app',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]
