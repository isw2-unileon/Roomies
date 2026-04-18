import logo from '@/assets/logo.png'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import styles from '@/styles/AuthLayout.module.css'

interface AuthLayoutProps {
 /** Descriptive text in the left sidebar */
  sidebarDescription: string
  /** Tagline at the bottom of the sidebar */
  sidebarTagline: string
  children: React.ReactNode
}

/**
 * Shared layout for authentication pages.
 * Renders the side panel with logo and text, and the right content area.
 */
export default function AuthLayout({ sidebarDescription, sidebarTagline, children }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.grid}>
          <div className={styles.languageSwitcherWrap}>
            <LanguageSwitcher />
          </div>

          <aside className={styles.sidebar}>
            <div>
              <img src={logo} alt="Roomies logo" className={styles.sidebarLogo} />
              <p className={styles.sidebarDescription}>{sidebarDescription}</p>
            </div>
            <p className={styles.sidebarTagline}>{sidebarTagline}</p>
          </aside>

          <div className={styles.content}>
            <div className={styles.contentInner}>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
