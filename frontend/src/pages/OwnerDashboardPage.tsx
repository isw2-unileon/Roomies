import { useState } from 'react'
import OwnerTabs from '@/components/owner/OwnerTabs'
import LikesSection from '@/components/owner/likes/LikesSection'
import PropertiesSection from '@/components/owner/properties/PropertiesSection'
import { mockLikes, mockProperties } from '@/mocks/ownerData'
import type { MatchStatus, OwnerProperty, PropertyLike } from '@/types/owner'
type Tab = 'properties' | 'likes'
export default function OwnerDashboardPage() {
    // Estado para saber que pestaña mostrar (Inmuebles o Likes)
    const [activeTab, setActiveTab] = useState<Tab>('properties')
    // Estado local de inmuebles (inicializado con mock)
    // En el futuro esto vendra de API, pero la UI no cambiaria.
    const [properties, setProperties] = useState<OwnerProperty[]>(mockProperties)
    // Estado local de likes (inicializado con mock)
    const [likes, setLikes] = useState<PropertyLike[]>(mockLikes)
    function handleCreateProperty(input: Omit<OwnerProperty, 'id' | 'createdAt'>) {
        // Simulamos creacion local en frontend
        const newProperty: OwnerProperty = {
            ...input,
            id: crypto.randomUUID(), // id temporal generado en cliente
            createdAt: new Date().toISOString().slice(0, 10), // formato YYYY-MM-DD
        }
        // Insertamos al principio para verlo inmediatamente
        setProperties((prev) => [newProperty, ...prev])
    }
    function handleStatusChange(id: string, status: MatchStatus) {
        // Actualizamos solo el like concreto por id
        setLikes((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    }
    return (
        <main className="relative min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl space-y-4">
                {/* Tabs de navegacion (componente desacoplado) */}
                <OwnerTabs activeTab={activeTab} onChange={setActiveTab} />
                {/* Render condicional por pestaña activa */}
                {activeTab === 'properties' ? (
                    <PropertiesSection items={properties} onCreate={handleCreateProperty} />
                ) : (
                    <LikesSection items={likes} onStatusChange={handleStatusChange} />
                )}
            </div>
        </main>
    )
}