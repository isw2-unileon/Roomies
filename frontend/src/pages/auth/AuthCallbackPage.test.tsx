import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import AuthCallbackPage from './AuthCallbackPage'

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/auth/callback')
    vi.restoreAllMocks()
  })

  test('shows confirmation success when Supabase redirects without tokens', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    render(
      <AuthCallbackPage
        onResolved={() => {}}
        onNavigateToLogin={() => {}}
      />
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/cuenta confirmada correctamente/i)
    expect(screen.getByRole('button', { name: /ir al login/i })).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
