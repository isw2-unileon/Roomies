import {
    ArrowRightIcon,
    CheckCircleIcon,
    HomeIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroup } from '@/types/tenant'

interface TenantGroupSummaryProps {
    group: TenantGroup
}

export default function TenantGroupSummary({ group }: TenantGroupSummaryProps) {
    const missingMembers = Math.max(group.maxMembers - group.members, 0)
    const missingPlaces = Math.max(group.neededPlaces, 0)

    return (
        <aside className={styles.detailSidebar} aria-label="Resumen del grupo">
            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>
                    <UserGroupIcon className={styles.iconMedium} aria-hidden="true" />
                    Resumen del grupo
                </h2>

                <p className={styles.tipText}>
                    Formad un grupo completo para solicitar este piso juntos.
                </p>

                <div className={styles.summaryRows}>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>
                            <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                            Miembros
                        </span>
                        <span className={styles.summaryValue}>
                            {group.members} / {group.maxMembers}
                        </span>
                    </div>

                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>
                            <HomeIcon className={styles.iconSmall} aria-hidden="true" />
                            Plazas necesarias
                        </span>
                        <span className={styles.summaryValue}>{missingPlaces}</span>
                    </div>

                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>
                            <CheckCircleIcon className={styles.iconSmall} aria-hidden="true" />
                            Compatibilidad media
                        </span>
                        <span className={styles.summaryValue}>
                            {group.averageCompatibility}%
                        </span>
                    </div>

                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>
                            <CheckCircleIcon className={styles.iconSmall} aria-hidden="true" />
                            Estado
                        </span>
                        <span className={styles.statusBadge}>
                            {group.status === 'forming' ? 'En formación' : 'Completo'}
                        </span>
                    </div>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>Compatibilidad del grupo</h2>

                <div className={styles.compatibilityCardContent}>
                    <span className={styles.compatibilityCircle}>
                        {group.averageCompatibility}%
                    </span>

                    <div>
                        <p className={styles.compatibilityCardTitle}>
                            Muy compatible
                        </p>
                        <p className={styles.compatibilityCardText}>
                            Tenéis hábitos y preferencias muy alineadas.
                        </p>
                    </div>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>Próximos pasos</h2>

                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span className={styles.stepIcon}>
                            <CheckCircleSolid className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.stepTitle}>Crear grupo</p>
                            <p className={styles.stepText}>Completado</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.stepIconPending} />
                        <div>
                            <p className={styles.stepTitle}>Invitar miembros</p>
                            <p className={styles.stepText}>
                                Invita a {missingMembers} personas más
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.stepIconPending} />
                        <div>
                            <p className={styles.stepTitle}>Solicitar piso juntos</p>
                            <p className={styles.stepText}>
                                El propietario revisará vuestra solicitud
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>¿Necesitas ayuda?</h2>
                <p className={styles.tipText}>
                    Consulta nuestras guías para formar grupos y solicitar pisos.
                </p>

                <button type="button" className={styles.guideLink}>
                    Ver guías
                    <ArrowRightIcon className={styles.iconSmall} aria-hidden="true" />
                </button>
            </section>
        </aside>
    )
}