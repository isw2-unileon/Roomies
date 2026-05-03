import { FormEvent, useMemo, useState } from 'react'

import { apiFetch } from '@/api'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { paths } from '@/routes/paths'
import styles from '@/styles/auth.module.css'

type NoticeKind = 'idle' | 'error' | 'success'

interface ResetPasswordPageProps {
  onNavigateToLogin: () => void
}

function getRecoveryDataFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || ''
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || ''

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
  }
}

export default function ResetPasswordPage({ onNavigateToLogin }: ResetPasswordPageProps) {
  const recovery = getRecoveryDataFromUrl()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({
    kind: 'idle',
    message: '',
  })

  const buttonLabel = useMemo(() => {
    if (isSubmitting) {
      return 'Guardando nueva contrasena...'
    }

    return 'Guardar nueva contrasena'
  }, [isSubmitting])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice({ kind: 'idle', message: '' })

    if (!recovery.accessToken) {
      setNotice({
        kind: 'error',
        message: 'El enlace no es valido o ya expiro. Solicita uno nuevo desde inicio de sesion.',
      })
      return
    }

    if (password.length < 6) {
      setNotice({
        kind: 'error',
        message: 'La contrasena debe tener al menos 6 caracteres.',
      })
      return
    }

    if (password !== confirmPassword) {
      setNotice({
        kind: 'error',
        message: 'Las contrasenas no coinciden.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recovery.accessToken}`,
        },
        body: JSON.stringify({ password }),
      })

      const data = (await response.json()) as { message?: string; error?: string }

      if (!response.ok) {
        setNotice({
          kind: 'error',
          message: data.error || 'No se pudo actualizar la contrasena. Solicita un nuevo enlace.',
        })
        return
      }

      localStorage.removeItem('roomies.access_token')
      localStorage.removeItem('roomies.refresh_token')

      if (recovery.refreshToken) {
        window.history.replaceState({}, '', paths.resetPassword)
      }

      setNotice({
        kind: 'success',
        message: data.message || 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.',
      })
      setPassword('')
      setConfirmPassword('')
    } catch {
      setNotice({
        kind: 'error',
        message: 'No se pudo actualizar la contrasena. Solicita un nuevo enlace.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      sidebarDescription="Establece una nueva contrasena para volver a acceder a tu cuenta de Roomies."
      sidebarTagline="Recuperacion de acceso segura."
    >
      <AuthHeader
        title="Restablecer contrasena"
        subtitle="Introduce tu nueva contrasena dos veces para confirmar el cambio."
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <FormField
          id="new-password"
          label="Nueva contrasena"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Minimo 6 caracteres"
          required
          minLength={6}
        />

        <FormField
          id="confirm-new-password"
          label="Confirmar nueva contrasena"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Repite la nueva contrasena"
          required
          minLength={6}
        />

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
          {buttonLabel}
        </button>

        <button type="button" onClick={onNavigateToLogin} className={styles.btnGhost}>
          Volver al inicio de sesion
        </button>
      </form>
    </AuthLayout>
  )
}
