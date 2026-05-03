import { BellIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { OwnerProfile } from '@/types/owner'
import styles from '@/styles/OwnerDashboard.module.css'

interface OwnerTopBarProps {
  profile: OwnerProfile
  unreadMessages: number
  unreadNotifications: number
}

export default function OwnerTopBar({ profile, unreadMessages, unreadNotifications }: OwnerTopBarProps) {
  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <header className={styles.ownerTopBar}>
      <div className={styles.ownerSearchWrap}>
        <div className={styles.ownerSearchIcon}>
          <MagnifyingGlassIcon className={styles.ownerIconSmall} aria-hidden="true" />
        </div>
        <input
          className={styles.ownerSearchInput}
          placeholder="Buscar usuarios, pisos, solicitudes..."
          aria-label="Buscar"
        />
      </div>

      <div className={styles.ownerTopBarActions}>
        <button type="button" className={styles.ownerIconButton} aria-label="Mensajes">
          <ChatBubbleLeftRightIcon className={styles.ownerIconSmall} aria-hidden="true" />
          {unreadMessages > 0 && <span className={styles.ownerCounter}>{unreadMessages}</span>}
        </button>

        <button type="button" className={styles.ownerIconButton} aria-label="Notificaciones">
          <BellIcon className={styles.ownerIconSmall} aria-hidden="true" />
          {unreadNotifications > 0 && <span className={styles.ownerCounter}>{unreadNotifications}</span>}
        </button>

        <button type="button" className={styles.ownerProfileButton} aria-label="Perfil propietario">
          <div className={styles.ownerAvatar}>{initials}</div>
          <span className={styles.ownerProfileText}>
            <span className={styles.ownerProfileName}>{profile.name}</span>
            <span className={styles.ownerProfileRole}>{profile.role}</span>
          </span>
          <ChevronDownIcon className={styles.ownerIconSmall} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
