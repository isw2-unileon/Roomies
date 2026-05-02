import type {
  OwnerActivityItem,
  OwnerDashboardIssue,
  OwnerDashboardPayment,
  OwnerDashboardProperty,
  OwnerDashboardRequest,
  OwnerProfile,
  OwnerProperty,
  PropertyLike,
} from '@/types/owner'
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

export const mockOwnerProfile: OwnerProfile = {
    name: 'Carlos Martinez',
    role: 'Propietario',
}

export const mockOwnerProperties: OwnerDashboardProperty[] = [
    {
        id: 'op1',
        title: 'Piso en el centro',
        address: 'Calle Ancha, 12, Leon',
        totalSpots: 4,
        occupiedSpots: 2,
        tenant: 'Javier Ruiz',
        paymentStatus: 'received',
        nextDueDate: '05/06/2026',
        requests: 2,
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: 'op2',
        title: 'Piso junto a la universidad',
        address: 'Av. Facultad, 21, Leon',
        totalSpots: 3,
        occupiedSpots: 1,
        tenant: 'Laura Martinez',
        paymentStatus: 'pending',
        nextDueDate: '07/06/2026',
        requests: 1,
        image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    },
    {
        id: 'op3',
        title: 'Habitacion en piso compartido',
        address: 'Zona Eras, 8, Leon',
        totalSpots: 2,
        occupiedSpots: 2,
        tenant: 'Pablo Serrano',
        paymentStatus: 'received',
        nextDueDate: '03/06/2026',
        requests: 0,
        image: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80',
    },
]

export const mockOwnerRequests: OwnerDashboardRequest[] = [
    {
        id: 'or1',
        tenant: 'Javier Ruiz, 22',
        profile: 'Estudiante de Ingenieria',
        property: 'Piso en el centro',
        address: 'Calle Ancha, 12',
        compatibility: 87,
        requestedAt: '12/05/2024',
    },
    {
        id: 'or2',
        tenant: 'Laura Martinez, 21',
        profile: 'Estudiante de Veterinaria',
        property: 'Piso junto a la universidad',
        address: 'Av. Facultad, 21',
        compatibility: 90,
        requestedAt: '11/05/2024',
    },
    {
        id: 'or3',
        tenant: 'Pablo Serrano, 23',
        profile: 'Estudiante de Derecho',
        property: 'Piso en el centro',
        address: 'Calle Ancha, 12',
        compatibility: 78,
        requestedAt: '10/05/2024',
    },
]

export const mockOwnerPayments: OwnerDashboardPayment[] = [
    { id: 'pay1', property: 'Piso en el centro', amount: 900, paidAt: '01/05/2026' },
    { id: 'pay2', property: 'Piso junto a la universidad', amount: 380, paidAt: '29/04/2026' },
    { id: 'pay3', property: 'Habitacion en piso compartido', amount: 410, paidAt: '28/04/2026' },
]

export const mockOwnerIssues: OwnerDashboardIssue[] = [
    {
        id: 'i1',
        title: 'Fuga en cocina',
        property: 'Piso en el centro',
        tenant: 'Javier Ruiz',
        status: 'pending',
    },
    {
        id: 'i2',
        title: 'Calefaccion no funciona',
        property: 'Piso junto a la universidad',
        tenant: 'Laura Martinez',
        status: 'in_progress',
    },
    {
        id: 'i3',
        title: 'Persiana bloqueada',
        property: 'Habitacion en piso compartido',
        tenant: 'Pablo Serrano',
        status: 'resolved',
    },
]

export const mockOwnerActivity: OwnerActivityItem[] = [
    { id: 'a1', title: 'Nueva solicitud en Piso en el centro', meta: 'Hace 1 hora' },
    { id: 'a2', title: 'Laura Martinez acepto la plaza', meta: 'Hace 3 horas' },
    { id: 'a3', title: 'Pago recibido en Piso junto a la universidad', meta: 'Hace 1 dia' },
]
