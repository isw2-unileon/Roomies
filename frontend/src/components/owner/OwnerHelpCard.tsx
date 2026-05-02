import styles from '@/styles/OwnerDashboard.module.css'

export default function OwnerHelpCard() {
  return (
    <section className={styles.ownerHelpCard}>
      <h3 className={styles.ownerHelpTitle}>Necesitas ayuda?</h3>
      <p className={styles.ownerHelpText}>Consulta nuestras guias para gestionar tus pisos y solicitudes.</p>
      <button type="button" className={styles.ownerTextButton}>Ver guias</button>
    </section>
  )
}
