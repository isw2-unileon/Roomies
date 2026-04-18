import { useEffect, useState } from 'react'
import { apiFetch } from '@/api'
import OwnerTabs from '@/components/owner/OwnerTabs'
import LikesSection from '@/components/owner/likes/LikesSection'
import PropertiesSection from '@/components/owner/properties/PropertiesSection'
import type { MatchStatus, OwnerProperty, PropertyLike } from '@/types/owner'

type Tab = 'properties' | 'likes'

interface OwnerPropertyApiItem {
    id: string
    title: string
    address: string
    area: string
    available_rooms: number
    rent: number
    status: OwnerProperty['status']
    created_at: string
}

interface PropertyLikeApiItem {
    id: string
    property_id: string
    property_title: string
    tenant_name: string
    tenant_email: string
    status: MatchStatus
    created_at: string
}

function readErrorMessage(payload: unknown, fallback: string) {
    if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        return payload.error
    }
    return fallback
}

async function readJsonSafely<T>(response: Response): Promise<T | undefined> {
    try {
        return (await response.json()) as T
    } catch {
        return undefined
    }
}

function mapProperty(item: OwnerPropertyApiItem): OwnerProperty {
    return {
        id: item.id,
        title: item.title,
        address: item.address,
        area: item.area,
        availableRooms: item.available_rooms,
        rent: item.rent,
        status: item.status,
        createdAt: item.created_at,
    }
}

function mapLike(item: PropertyLikeApiItem): PropertyLike {
    return {
        id: item.id,
        propertyId: item.property_id,
        propertyTitle: item.property_title,
        tenantName: item.tenant_name,
        tenantEmail: item.tenant_email,
        status: item.status,
        createdAt: item.created_at,
    }
}

export default function OwnerDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>('properties')
    const [properties, setProperties] = useState<OwnerProperty[]>([])
    const [likes, setLikes] = useState<PropertyLike[]>([])
    const [notice, setNotice] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function loadOwnerDashboard() {
            const token = localStorage.getItem('roomies.access_token')
            if (!token) {
                if (!cancelled) {
                    setNotice('Tu sesion ha caducado. Inicia sesion de nuevo para ver tu dashboard.')
                    setIsLoading(false)
                }
                return
            }

            try {
                const [propertiesResponse, likesResponse] = await Promise.all([
                    apiFetch('/api/owner/properties', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    apiFetch('/api/owner/likes', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ])

                const propertiesData = (await readJsonSafely<{ items?: OwnerPropertyApiItem[]; error?: string }>(
                    propertiesResponse,
                )) ?? {}
                const likesData = (await readJsonSafely<{ items?: PropertyLikeApiItem[]; error?: string }>(likesResponse)) ?? {}

                if (!propertiesResponse.ok) {
                    throw new Error(readErrorMessage(propertiesData, 'No se pudieron cargar tus inmuebles.'))
                }
                if (!likesResponse.ok) {
                    throw new Error(readErrorMessage(likesData, 'No se pudieron cargar tus likes.'))
                }

                if (!cancelled) {
                    setProperties((propertiesData.items ?? []).map(mapProperty))
                    setLikes((likesData.items ?? []).map(mapLike))
                    setNotice('')
                }
            } catch (error) {
                if (!cancelled) {
                    setNotice(error instanceof Error ? error.message : 'No se pudo cargar el dashboard de owner.')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        loadOwnerDashboard()
        return () => {
            cancelled = true
        }
    }, [])

    function handleCreateProperty(input: Omit<OwnerProperty, 'id' | 'createdAt'>) {
        const token = localStorage.getItem('roomies.access_token')
        if (!token) {
            setNotice('Tu sesion ha caducado. Inicia sesion de nuevo para crear inmuebles.')
            return
        }

        void (async () => {
            try {
                const response = await apiFetch('/api/owner/properties', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: input.title,
                        address: input.address,
                        area: input.area,
                        available_rooms: input.availableRooms,
                        rent: input.rent,
                        status: input.status,
                    }),
                })

                const data = (await readJsonSafely<{ item?: OwnerPropertyApiItem; error?: string }>(response)) ?? {}
                if (!response.ok || !data.item) {
                    throw new Error(readErrorMessage(data, 'No se pudo crear el inmueble.'))
                }

                const createdItem = data.item
                setProperties((prev) => [mapProperty(createdItem), ...prev])
                setNotice('')
            } catch (error) {
                setNotice(error instanceof Error ? error.message : 'No se pudo crear el inmueble.')
            }
        })()
    }

    function handleStatusChange(id: string, status: MatchStatus) {
        const token = localStorage.getItem('roomies.access_token')
        if (!token) {
            setNotice('Tu sesion ha caducado. Inicia sesion de nuevo para actualizar likes.')
            return
        }

        void (async () => {
            try {
                const response = await apiFetch(`/api/owner/likes/${id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                })

                const data = (await readJsonSafely<{ error?: string }>(response)) ?? {}
                if (!response.ok) {
                    throw new Error(readErrorMessage(data, 'No se pudo actualizar el estado del like.'))
                }

                setLikes((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
                setNotice('')
            } catch (error) {
                setNotice(error instanceof Error ? error.message : 'No se pudo actualizar el estado del like.')
            }
        })()
    }

    return (
        <main className="relative min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl space-y-4">
                <OwnerTabs activeTab={activeTab} onChange={setActiveTab} />
                {notice && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{notice}</p>
                )}
                {isLoading && (
                    <p className="rounded-xl border border-[var(--rm-border)] bg-white px-4 py-3 text-sm text-[var(--rm-text-soft)]">
                        Cargando dashboard...
                    </p>
                )}
                {activeTab === 'properties' ? (
                    <PropertiesSection items={properties} onCreate={handleCreateProperty} />
                ) : (
                    <LikesSection items={likes} onStatusChange={handleStatusChange} />
                )}
            </div>
        </main>
    )
}
