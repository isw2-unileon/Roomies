import { LockClosedIcon } from '@heroicons/react/24/outline'

import TenantGroupAvailableSlot from '@/components/tenant/tenant_groups/TenantGroupAvailableSlot'
import TenantGroupMemberCard from '@/components/tenant/tenant_groups/TenantGroupMemberCard'  
import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroup, TenantGroupMember } from '@/types/tenant'

interface TenantGroupMembersProps {
    group: TenantGroup
}

function buildFallbackMembers(group: TenantGroup): TenantGroupMember[] {
    if (group.membersData.length > 0) {
        return group.membersData
    }

    return [
        {
            id: `${group.id}-member-1`,
            name: 'Laura Martínez',
            age: 21,
            studies: group.university,
            avatar: group.memberAvatars[0] ?? group.image,
            tags: ['Limpia', 'Tranquila', 'Sociable'],
            compatibility: group.averageCompatibility,
            role: 'Administrador',
            isCurrentUser: true,
        },
        {
            id: `${group.id}-member-2`,
            name: 'Javier Ruiz',
            age: 22,
            studies: 'Estudiante de Ingeniería',
            avatar: group.memberAvatars[1] ?? group.image,
            tags: ['Ordenado', 'Deporte', 'No fumador'],
            compatibility: group.averageCompatibility - 3,
        },
        {
            id: `${group.id}-member-3`,
            name: 'Marta López',
            age: 20,
            studies: 'Estudiante de ADE',
            avatar: group.memberAvatars[2] ?? group.image,
            tags: ['Organizada', 'Madrugadora', 'Limpia'],
            compatibility: group.averageCompatibility - 5,
        },
        {
            id: `${group.id}-member-4`,
            name: 'Pablo Santos',
            age: 23,
            studies: 'Profesional',
            avatar: group.memberAvatars[0] ?? group.image,
            tags: ['Responsable', 'Tranquilo', 'Limpio'],
            compatibility: group.averageCompatibility - 6,
        },
    ].slice(0, group.members)
}

export default function TenantGroupMembers({ group }: TenantGroupMembersProps) {
    const members = buildFallbackMembers(group)
    const missingMembers = Math.max(group.maxMembers - group.members, 0)
    const missingPlaces = Math.max(group.neededPlaces, 0)

    return (
        <>
            <p className={styles.sectionHint}>
                Gestiona tu grupo y completad juntos la solicitud del piso.
            </p>

            {members.map((member) => (
                <TenantGroupMemberCard key={member.id} member={member} />
            ))}

            {Array.from({ length: missingMembers }).map((_, index) => (
                <TenantGroupAvailableSlot key={`slot-${index + 1}`} />
            ))}

            <section className={styles.applyBox}>
                <div>
                    <h2 className={styles.applyTitle}>
                        {missingPlaces > 0
                            ? `Faltan ${missingPlaces} plazas para poder solicitar el piso juntos.`
                            : 'El grupo está listo para solicitar el piso juntos.'}
                    </h2>

                    <p className={styles.applyText}>
                        El propietario revisará vuestra solicitud cuando el grupo esté completo.
                    </p>
                </div>

                <button type="button" className={styles.applyButton}>
                    Solicitar piso juntos
                    <LockClosedIcon className={styles.iconSmall} aria-hidden="true" />
                </button>
            </section>
        </>
    )
}