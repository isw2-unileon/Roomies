const en = {
  common: {
    appName: 'Roomies',
    language: {
      selectorAriaLabel: 'Language selector',
    },
  },
  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in with your email and password to access your account.',
      sidebarDescription:
        'Find your next home with people who match your lifestyle, budget, and way of living.',
      sidebarTagline: 'Simple matching. Better co-living.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      submit: 'Sign in',
      submitting: 'Signing in...',
      forgotPassword: 'I forgot my password',
      forgotPasswordSending: 'Sending email...',
      goToRegister: 'Create an account',
      successDefault: 'Login successful. You can continue in the app now.',
      errors: {
        default: 'Could not sign in right now. Please try again.',
        forgotWithoutEmail: 'Enter your email to recover your password.',
        forgotDefault: 'Could not send recovery email.',
      },
      forgotSuccessDefault: 'We sent you an email to reset your password.',
    },
    register: {
      title: 'Create account',
      subtitle: 'Fill in your details to start using Roomies.',
      sidebarDescription:
        'Create your Roomies profile and connect with people that match your lifestyle and budget.',
      sidebarTagline: 'Create your account. Find your next room.',
      userType: 'User type',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'Your full name',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your password',
      submit: 'Create account',
      submitting: 'Creating account...',
      backToLogin: 'Back to login',
      role: {
        tenant: {
          label: 'Tenant',
          description: 'Tenant looking for housing',
        },
        owner: {
          label: 'Owner',
          description: 'Property owner',
        },
      },
      successDefault: 'Account created successfully. You can now sign in.',
      successNeedsConfirmation:
        'Account created. Check your email and confirm your account before signing in and completing your profile.',
      errors: {
        fullNameMin: 'Full name must be at least 2 characters.',
        passwordMin: 'Password must be at least 6 characters.',
        passwordMismatch: 'Passwords do not match.',
        default: 'Could not create your account. Please try again.',
      },
    },
  },
} as const
export default en
