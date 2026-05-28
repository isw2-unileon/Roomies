import { ArrowRightIcon, CalendarDaysIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroups.module.css'

const memberOptions = [
    { value: 'all', label: 'Todos' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5+', label: '5+' },
]

interface TenantGroupFiltersProps {
    selectedMembers: string
    onSelectedMembersChange: (value: string) => void
    status: string
    onStatusChange: (value: string) => void
    hasApartment: string
    onHasApartmentChange: (value: string) => void
    onClearFilters: () => void
}

export default function TenantGroupFilters({
    selectedMembers,
    onSelectedMembersChange,
    status,
    onStatusChange,
    hasApartment,
    onHasApartmentChange,
    onClearFilters,
}: TenantGroupFiltersProps) {
    return (
        <aside className={styles.sidebar} aria-label="Filtros de grupos">
            <section className={styles.sideCard}>
                <div className={styles.sideHeader}>
                    <h2 className={styles.sideTitle}>Filtros</h2>
                    <button type="button" className={styles.clearButton} onClick={onClearFilters}>
                        Limpiar
                    </button>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="status-filter">Estado</label>
                    <select
                        id="status-filter"
                        className={styles.filterSelect}
                        value={status}
                        onChange={(event) => onStatusChange(event.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="FORMING">En formación</option>
                        <option value="READY">Listo</option>
                        <option value="APPLIED">Solicitud enviada</option>
                        <option value="ACCEPTED">Aceptado</option>
                        <option value="REJECTED">Rechazado</option>
                        <option value="CLOSED">Cerrado</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="apartment-filter">Piso asignado</label>
                    <select
                        id="apartment-filter"
                        className={styles.filterSelect}
                        value={hasApartment}
                        onChange={(event) => onHasApartmentChange(event.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="true">Con piso asignado</option>
                        <option value="false">Sin piso asignado</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Número de miembros</span>
                    <div className={styles.memberSelector}>
                        {memberOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`${styles.memberOption} ${selectedMembers === option.value ? styles.memberOptionActive : ''}`}
                                onClick={() => onSelectedMembersChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>Consejos para crear grupo</h2>

                <div className={styles.tipsList}>
                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.greenSoft}`}>
                            <ShieldCheckIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>Revisa las invitaciones</p>
                            <p className={styles.tipText}>Los usuarios invitados aparecerán como pendientes hasta que acepten.</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.purpleSoft}`}>
                            <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>Puedes crear varios grupos</p>
                            <p className={styles.tipText}>Un usuario puede crear o participar en más de un grupo.</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.orangeSoft}`}>
                            <CalendarDaysIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>El piso es opcional</p>
                            <p className={styles.tipText}>Puedes formar primero el grupo y asignar una vivienda más adelante.</p>
                        </div>
                    </div>
                </div>

                <button type="button" className={styles.moreTips}>
                    Ver más consejos
                    <ArrowRightIcon className={styles.iconSmall} aria-hidden="true" />
                </button>
            </section>
        </aside>
    )
}
