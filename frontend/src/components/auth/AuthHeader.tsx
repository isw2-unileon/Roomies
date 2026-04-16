import logo from '@/assets/logo.png'
import styles from '@/styles/AuthHeader.module.css'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

/**
 * Authentication form header.
 * Displays the logo (mobile only), title, and subtitle.
 */
export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className={styles.header}>
      <img src={logo} alt="Roomies" className={styles.logo} />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
