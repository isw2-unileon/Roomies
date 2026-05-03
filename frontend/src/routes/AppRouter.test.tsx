import { render, screen } from '@testing-library/react'
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
  })

})
