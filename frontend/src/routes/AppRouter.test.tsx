import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import App from '@/App'

import { paths } from './paths'

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('AppRouter', () => {
  test('renders tenant explore from the tenant explore route', () => {
    renderAppAt(paths.tenantExplore)

    expect(screen.getByRole('heading', { name: /explora pisos/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/buscar viviendas/i)).toBeInTheDocument()
    const sidebar = screen.getByRole('complementary', { name: /panel de inquilino/i })
    expect(within(sidebar).getByRole('navigation', { name: /navegación de inquilino/i })).toBeInTheDocument()
    expect(within(sidebar).queryByRole('combobox', { name: /idioma de la interfaz/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publicar piso/i })).not.toBeInTheDocument()
  })

  test('renders placeholder tenant pages inside the tenant layout', () => {
    renderAppAt(paths.tenantMessages)

    expect(screen.getByRole('heading', { name: /mensajes/i })).toBeInTheDocument()
    expect(screen.getByText(/esta sección se completará más adelante/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mensajes/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('combobox', { name: /idioma de la interfaz/i })).not.toBeInTheDocument()
  })

  test('renders language preferences inside the tenant profile page', () => {
    renderAppAt(paths.tenantProfile)

    expect(screen.getByRole('heading', { name: /perfil/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^preferencias$/i })).toBeInTheDocument()
    expect(screen.getByText(/elige el idioma de la interfaz/i)).toBeInTheDocument()
    const languageSelect = screen.getByRole('combobox', { name: /idioma de la interfaz/i })
    expect(languageSelect).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Français' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Deutsch' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /perfil/i })).toHaveAttribute('aria-current', 'page')
  })

  test('tenant sidebar collapse toggle exposes its expanded state', async () => {
    const user = userEvent.setup()
    renderAppAt(paths.tenantExplore)

    const toggleButton = screen.getByRole('button', { name: /ocultar menú/i })

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggleButton)

    expect(screen.getByRole('button', { name: /mostrar menú/i })).toHaveAttribute('aria-expanded', 'false')
  })

  test('opens a share dialog from the tenant invite card', async () => {
    const user = userEvent.setup()
    renderAppAt(paths.tenantExplore)

    await user.click(screen.getByRole('button', { name: /invita a un amigo/i }))

    expect(screen.getByRole('dialog', { name: /invita a un amigo/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('https://wa.me/'))
    expect(screen.getByRole('link', { name: /correo/i })).toHaveAttribute('href', expect.stringContaining('mailto:'))


    await user.click(screen.getByRole('button', { name: /cerrar invitación/i }))

    expect(screen.queryByRole('dialog', { name: /invita a un amigo/i })).not.toBeInTheDocument()
  })
})
