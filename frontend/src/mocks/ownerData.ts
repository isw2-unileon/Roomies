import type { OwnerProperty, PropertyLike } from '@/types/owner'
// Datos iniciales de prueba para desarrollar UI sin backend
export const mockProperties: OwnerProperty[] = [
    {
        id: 'p1',
        title: 'Piso luminoso en Centro',
        address: 'Calle Ancha 12',
        area: 'Centro',
        availableRooms: 2,
        rent: 450,
        status: 'open',
        createdAt: '2026-04-10',
    },
    {
        id: 'p2',
        title: 'Habitacion cerca de universidad',
        address: 'Av. Universidad 8',
        area: 'Vegazana',
        availableRooms: 1,
        rent: 380,
        status: 'closed',
        createdAt: '2026-04-05',
    },
]
export const mockLikes: PropertyLike[] = [
    {
        id: 'm1',
        propertyId: 'p1',
        propertyTitle: 'Piso luminoso en Centro',
        tenantName: 'Lucia Santos',
        tenantEmail: 'lucia@mail.com',
        status: 'pending',
        createdAt: '2026-04-12',
    },
    {
        id: 'm2',
        propertyId: 'p1',
        propertyTitle: 'Piso luminoso en Centro',
        tenantName: 'Marcos Vela',
        tenantEmail: 'marcos@mail.com',
        status: 'approved',
        createdAt: '2026-04-13',
    },
    {
        id: 'm3',
        propertyId: 'p2',
        propertyTitle: 'Habitacion cerca de universidad',
        tenantName: 'Nerea Alonso',
        tenantEmail: 'nerea@mail.com',
        status: 'rejected',
        createdAt: '2026-04-14',
    },
]