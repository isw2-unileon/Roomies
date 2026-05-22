import { ArrowRightIcon, CalendarDaysIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'

import styles from '@/styles/TenantGroups.module.css'

const memberOptions = ['1', '2', '3', '4', '5+']

interface TenantGroupFiltersProps {
    selectedMembers: string
    onSelectedMembersChange: (value: string) => void
}

export default function TenantGroupFilters({
    selectedMembers,
    onSelectedMembersChange,
}: TenantGroupFiltersProps) {
    return (
        <aside className={styles.sidebar} aria-label="Filtros de grupos">
            <section className={styles.sideCard}>
                <div className={styles.sideHeader}>
                    <h2 className={styles.sideTitle}>Filtros</h2>
                    <button type="button" className={styles.clearButton}>Limpiar</button>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="location-filter">Ubicación</label>
                    <select id="location-filter" className={styles.filterSelect} defaultValue="all">
                        <option value="all">Todas</option>
                        <option value="centro">Centro</option>
                        <option value="universidad">Zona universitaria</option>
                        <option value="eras">Eras de Renueva</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="university-filter">Universidad</label>
                    <select id="university-filter" className={styles.filterSelect} defaultValue="all">
                        <option value="all">Todas</option>
                        <option value="ule">Universidad de León</option>
                        <option value="professionals">Profesionales</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="entry-filter">Fecha de entrada</label>
                    <select id="entry-filter" className={styles.filterSelect} defaultValue="all">
                        <option value="all">Todas</option>
                        <option value="now">Inmediata</option>
                        <option value="august">Agosto</option>
                        <option value="september">Septiembre</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Presupuesto mensual</span>
                    <div className={styles.rangeWrap}>
                        <input
                            className={styles.range}
                            type="range"
                            min="0"
                            max="800"
                            defaultValue="800"
                            aria-label="Presupuesto mensual"
                        />
                        <div className={styles.rangeLabels}>
                            <span>0€</span>
                            <span>800€+</span>
                        </div>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Número de miembros</span>
                    <div className={styles.memberSelector}>
                        {memberOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`${styles.memberOption} ${selectedMembers === option ? styles.memberOptionActive : ''}`}
                                onClick={() => onSelectedMembersChange(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>Consejos para encontrar grupo</h2>

                <div className={styles.tipsList}>
                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.greenSoft}`}>
                            <ShieldCheckIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>Completa tu perfil</p>
                            <p className={styles.tipText}>Un perfil completo genera más confianza.</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.purpleSoft}`}>
                            <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>Sé claro y honesto</p>
                            <p className={styles.tipText}>Describe bien lo que buscas y ofreces.</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.orangeSoft}`}>
                            <CalendarDaysIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>Habla con el grupo</p>
                            <p className={styles.tipText}>Asegúrate de que tenéis expectativas similares.</p>
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