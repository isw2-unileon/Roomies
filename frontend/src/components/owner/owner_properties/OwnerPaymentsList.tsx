import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardPayment } from '@/types/owner'

interface OwnerPaymentsListProps {
  payments: OwnerDashboardPayment[]
}

export default function OwnerPaymentsList({ payments }: OwnerPaymentsListProps) {
  return (
    <div className={styles.ownerCompactList}>
      {payments.map((payment) => (
        <article key={payment.id} className={styles.ownerCompactItem}>
          <p className={styles.ownerCompactTitle}>{payment.property}</p>
          <p className={styles.ownerCompactMeta}>{payment.paidAt}</p>
          <p className={styles.ownerCompactAmount}>{payment.amount} EUR</p>
        </article>
      ))}
    </div>
  )
}
