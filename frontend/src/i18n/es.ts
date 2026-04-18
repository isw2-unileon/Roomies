const es = {
  common: {
    appName: 'Roomies',
  },
  auth: {
    login: {
      title: 'Bienvenido de nuevo',
      subtitle: 'Inicia sesión con tu correo y contraseña para acceder a tu cuenta.',
      sidebarDescription:
        'Encuentra tu próximo hogar con personas que encajen con tu estilo de vida, presupuesto y forma de vivir.',
      sidebarTagline: 'Matching simple. Mejor convivencia.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Introduce tu contraseña',
      submit: 'Iniciar sesión',
      submitting: 'Iniciando sesión...',
      forgotPassword: 'He olvidado mi contraseña',
      forgotPasswordSending: 'Enviando correo...',
      goToRegister: 'Crear una cuenta',
      successDefault: 'Login correcto. Ya puedes continuar en la app.',
      errors: {
        default: 'No se pudo iniciar sesión ahora mismo. Inténtalo de nuevo.',
        forgotWithoutEmail: 'Introduce tu correo para recuperar la contraseña.',
        forgotDefault: 'No se pudo enviar el correo de recuperación.',
      },
      forgotSuccessDefault: 'Te hemos enviado un correo para restablecer la contraseña.',
    },
    register: {
      title: 'Crear cuenta',
      subtitle: 'Completa tus datos para empezar a usar Roomies.',
      sidebarDescription:
        'Crea tu perfil en Roomies y conecta con personas que encajen con tu estilo de vida y presupuesto.',
      sidebarTagline: 'Crea tu cuenta. Encuentra tu próxima habitación.',
      userType: 'Tipo de usuario',
      fullNameLabel: 'Nombre completo',
      fullNamePlaceholder: 'Tu nombre completo',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Repite tu contraseña',
      submit: 'Crear cuenta',
      submitting: 'Creando cuenta...',
      backToLogin: 'Volver al inicio de sesión',
      role: {
        tenant: {
          label: 'Tenant',
          description: 'Inquilino que busca vivienda',
        },
        owner: {
          label: 'Owner',
          description: 'Propietario de vivienda',
        },
      },
      successDefault: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
      successNeedsConfirmation:
        'Cuenta creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión y completar tu perfil.',
      errors: {
        fullNameMin: 'El nombre completo debe tener al menos 2 caracteres.',
        passwordMin: 'La contraseña debe tener al menos 6 caracteres.',
        passwordMismatch: 'Las contraseñas no coinciden.',
        default: 'No se pudo crear tu cuenta. Inténtalo de nuevo.',
      },
    },
  },
} as const
export default es