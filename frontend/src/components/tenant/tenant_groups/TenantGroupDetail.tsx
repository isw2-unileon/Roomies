import { useState } from 'react'
import {
    ArrowLeftIcon,
    EllipsisHorizontalIcon,
    EyeIcon,
    MapPinIcon,
    PencilIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import TenantGroupMembers from '@/components/tenant/tenant_groups/TenantGroupMembers' 
import TenantGroupSummary from '@/components/tenant/tenant_groups/TenantGroupSummary'
import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroup } from '@/types/tenant'

type DetailTab = 'members' | 'compatibility' | 'conversations'

interface TenantGroupDetailProps {
    group: TenantGroup
    onBack: () => void
}

export default function TenantGroupDetail({ group, onBack }: TenantGroupDetailProps) {
    const [activeTab, setActiveTab] = useState<DetailTab>('members')
    const missingPlaces = Math.max(group.neededPlaces, 0)

    return (
        <div className={styles.detailContent}>
            <button type="button" className={styles.backButton} onClick={onBack}>
                <ArrowLeftIcon className={styles.iconSmall} aria-hidden="true" />
                Volver a mis grupos
            </button>

            <section className={styles.detailHeader}>
                <div className={styles.detailTitleWrap}>
                    <div className={styles.detailTitleRow}>
                        <h1 className={styles.detailTitle}>{group.title}</h1>
                        <PencilIcon className={styles.iconSmall} aria-hidden="true" />
                    </div>

                    <div className={styles.detailMeta}>
                        <span className={styles.metaItem}>
                            <MapPinIcon className={styles.iconSmall} aria-hidden="true" />
                            {group.propertyAddress}
                        </span>

                        <span className={styles.metaItem}>
                            <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                            {group.members} / {group.maxMembers} miembros
                        </span>

                        <span className={styles.neededBadge}>
                            {missingPlaces} plazas necesarias
                        </span>
                    </div>
                </div>

                <div className={styles.detailActions}>
                    <button type="button" className={styles.propertyButton}>
                        <EyeIcon className={styles.iconSmall} aria-hidden="true" />
                        Ver detalles del piso
                    </button>

                    <button type="button" className={styles.iconButton} aria-label="Más opciones">
                        <EllipsisHorizontalIcon className={styles.iconMedium} aria-hidden="true" />
                    </button>
                </div>
            </section>

            <nav className={styles.tabs} aria-label="Secciones del grupo">
                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    Miembros del grupo
                </button>

                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'compatibility' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('compatibility')}
                >
                    Compatibilidad
                </button>

                <button
                    type="button"
                    className={`${styles.tab} ${activeTab === 'conversations' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('conversations')}
                >
                    Conversaciones
                </button>
            </nav>

            <div className={styles.detailGrid}>
                <main className={styles.detailMain}>
                    {activeTab === 'members' ? (
                        <TenantGroupMembers group={group} />
                    ) : null}

                    {activeTab === 'compatibility' ? (
                        <div className={styles.empty}>
                            <div>
                                <p className={styles.emptyTitle}>Compatibilidad del grupo</p>
                                <p className={styles.emptySubtitle}>
                                    Este apartado mostrará hábitos, preferencias y puntos fuertes de convivencia entre los miembros.
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'conversations' ? (
                        <div className={styles.empty}>
                            <div>
                                <p className={styles.emptyTitle}>Conversaciones del grupo</p>
                                <p className={styles.emptySubtitle}>
                                    Aquí aparecerán los mensajes internos del grupo cuando se conecte con el módulo de chat.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </main>

                <TenantGroupSummary group={group} />
            </div>
        </div>
    )
}