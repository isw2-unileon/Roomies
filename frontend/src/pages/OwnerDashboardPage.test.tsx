import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import OwnerDashboardPage from './OwnerDashboardPage'

describe('OwnerDashboardPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
    })

    test('loads owner properties and likes from backend', async () => {
        localStorage.setItem('roomies.access_token', 'owner-token')

        const fetchSpy = vi
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        {
                            id: 'p1',
                            title: 'Piso Centro',
                            address: 'Calle Ancha 12',
                            area: 'Centro',
                            available_rooms: 2,
                            rent: 450,
                            status: 'open',
                            created_at: '2026-04-10',
                        },
                    ],
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        {
                            id: 'm1',
                            property_id: 'p1',
                            property_title: 'Piso Centro',
                            tenant_name: 'Lucia Santos',
                            tenant_email: 'lucia@mail.com',
                            status: 'pending',
                            created_at: '2026-04-12',
                        },
                    ],
                }),
            } as Response)

        render(<OwnerDashboardPage />)

        expect(await screen.findByText('Piso Centro')).toBeInTheDocument()
        await userEvent.setup().click(screen.getByRole('button', { name: /likes/i }))
        expect(await screen.findByText('Lucia Santos')).toBeInTheDocument()

        expect(fetchSpy).toHaveBeenNthCalledWith(
            1,
            '/api/owner/properties',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer owner-token' }),
            }),
        )
        expect(fetchSpy).toHaveBeenNthCalledWith(
            2,
            '/api/owner/likes',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer owner-token' }),
            }),
        )
    })

    test('creates a new property via backend', async () => {
        localStorage.setItem('roomies.access_token', 'owner-token')

        const fetchSpy = vi
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) } as Response)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    item: {
                        id: 'p2',
                        title: 'Nuevo inmueble',
                        address: 'Av. Universidad 8',
                        area: 'Vegazana',
                        available_rooms: 1,
                        rent: 380,
                        status: 'open',
                        created_at: '2026-04-18',
                    },
                }),
            } as Response)

        const user = userEvent.setup()
        render(<OwnerDashboardPage />)

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(2)
        })

        await user.type(screen.getByPlaceholderText(/titulo del inmueble/i), 'Nuevo inmueble')
        await user.type(screen.getByPlaceholderText(/^direccion$/i), 'Av. Universidad 8')
        await user.type(screen.getByPlaceholderText(/^zona$/i), 'Vegazana')
        await user.click(screen.getByRole('button', { name: /anadir inmueble/i }))

        expect(await screen.findByText('Nuevo inmueble')).toBeInTheDocument()
        expect(fetchSpy).toHaveBeenNthCalledWith(
            3,
            '/api/owner/properties',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"title":"Nuevo inmueble"'),
            }),
        )
    })

    test('updates like status via backend', async () => {
        localStorage.setItem('roomies.access_token', 'owner-token')

        const fetchSpy = vi
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        {
                            id: 'p1',
                            title: 'Piso Centro',
                            address: 'Calle Ancha 12',
                            area: 'Centro',
                            available_rooms: 2,
                            rent: 450,
                            status: 'open',
                            created_at: '2026-04-10',
                        },
                    ],
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        {
                            id: 'm1',
                            property_id: 'p1',
                            property_title: 'Piso Centro',
                            tenant_name: 'Lucia Santos',
                            tenant_email: 'lucia@mail.com',
                            status: 'pending',
                            created_at: '2026-04-12',
                        },
                    ],
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'like status updated', status: 'approved' }),
            } as Response)

        const user = userEvent.setup()
        render(<OwnerDashboardPage />)

        await user.click(await screen.findByRole('button', { name: /likes/i }))
        await user.click(await screen.findByRole('button', { name: /aceptar/i }))

        expect(fetchSpy).toHaveBeenNthCalledWith(
            3,
            '/api/owner/likes/m1/status',
            expect.objectContaining({
                method: 'PATCH',
                body: '{"status":"approved"}',
            }),
        )
    })
})
