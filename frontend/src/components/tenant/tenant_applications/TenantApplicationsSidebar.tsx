import {
    CheckCircleIcon,
    ClockIcon,
    InformationCircleIcon,
    LightBulbIcon,
    ListBulletIcon,
    ShieldCheckIcon,
    SparklesIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'

import styles from '@/styles/TenantApplications.module.css'
import type { ApplicationFilter } from '@/types/tenant'

interface TenantApplicationsSidebarProps {
    filters: { id: ApplicationFilter; label: string }[]
    getCount: (filter: ApplicationFilter) => number
}

function getSummaryIcon(filter: ApplicationFilter) {
    if (filter === 'approved') {
        return <CheckCircleIcon className={styles.iconSmall} aria-hidden="true" />
    }

    if (filter === 'rejected') {
        return <XCircleIcon className={styles.iconSmall} aria-hidden="true" />
    }

    if (filter === 'pending') {
        return <ClockIcon className={styles.iconSmall} aria-hidden="true" />
    }

    return <ListBulletIcon className={styles.iconSmall} aria-hidden="true" />
}

function getSummaryIconClass(filter: ApplicationFilter) {
    if (filter === 'pending') {
        return styles.orangeSoft
    }

    if (filter === 'approved') {
        return styles.greenSoft
    }

    if (filter === 'rejected') {
        return styles.redSoft
    }

    if (filter === 'cancelled') {
        return styles.graySoft
    }

    return styles.purpleSoft
}

export default function TenantApplicationsSidebar({ filters, getCount }: TenantApplicationsSidebarProps) {
    return (
        <aside className={styles.sidebar} aria-label="Resumen y consejos">
            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>
                    <ListBulletIcon className={styles.iconMedium} aria-hidden="true" />
                    Resumen
                </h2>

                <div className={styles.summaryList}>
                    {filters.map((filter) => (
                        <div key={filter.id} className={styles.summaryItem}>
                            <span className={`${styles.summaryIcon} ${getSummaryIconClass(filter.id)}`}>
                                {getSummaryIcon(filter.id)}
                            </span>

                            <strong className={styles.summaryNumber}>
                                {getCount(filter.id)}
                            </strong>

                            <span className={styles.summaryLabel}>
                                {filter.id === 'all' ? 'Total solicitudes' : filter.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>Consejos para destacar</h2>

                <div className={styles.tipsList}>
                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.purpleSoft}`}>
                            <SparklesIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>

                        <div>
                            <p className={styles.tipTitle}>Completa tu perfil al 100%</p>
                            <p className={styles.tipText}>
                                Los perfiles completos reciben más respuestas.
                            </p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.greenSoft}`}>
                            <ShieldCheckIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>

                        <div>
                            <p className={styles.tipTitle}>Sé rápido</p>
                            <p className={styles.tipText}>
                                Los primeros en solicitar tienen más posibilidades.
                            </p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.orangeSoft}`}>
                            <LightBulbIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>

                        <div>
                            <p className={styles.tipTitle}>Escribe un buen mensaje</p>
                            <p className={styles.tipText}>
                                Presentarte al propietario marca la diferencia.
                            </p>
                        </div>
                    </div>
                </div>

                <button type="button" className={styles.guideButton}>
                    Ver guía completa
                </button>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>¿Necesitas ayuda?</h2>

                <p className={styles.helpText}>
                    Estamos aquí para ayudarte en cualquier momento.
                </p>

                <button type="button" className={styles.supportButton}>
                    <InformationCircleIcon className={styles.iconSmall} aria-hidden="true" />
                    Contactar soporte
                </button>
            </section>
        </aside>
    )
}