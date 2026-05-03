import type { ComponentType, SVGProps } from 'react'
import {
  ArrowLeftOnRectangleIcon,
  BellIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import logo from '@/assets/logo.png'
import type { OwnerNavTab } from '@/types/owner'
import styles from '@/styles/OwnerDashboard.module.css'

interface OwnerSidebarProps {
  activeTab: OwnerNavTab
  onTabChange: (tab: OwnerNavTab) => void
  unreadNotifications: number
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const tabs: { id: OwnerNavTab; label: string; Icon: IconComponent }[] = [
  { id: 'explore', label: 'Explorar', Icon: HomeIcon },
  { id: 'properties', label: 'Mis pisos', Icon: BuildingOffice2Icon },
  { id: 'requests', label: 'Solicitudes', Icon: WrenchScrewdriverIcon },
  { id: 'messages', label: 'Mensajes', Icon: ChatBubbleLeftRightIcon },
  { id: 'notifications', label: 'Notificaciones', Icon: BellIcon },
  { id: 'profile', label: 'Perfil', Icon: UserIcon },
]

export default function OwnerSidebar({ activeTab, onTabChange, unreadNotifications }: OwnerSidebarProps) {
  return (
    <aside className={styles.ownerSidebar}>
      <div className={styles.ownerSidebarHeader}>
        <div className={styles.ownerBrand}>
          <span className={styles.ownerLogoFrame}>
            <img src={logo} alt="Roomies" className={styles.ownerLogo} />
          </span>
          <span className={styles.ownerBrandName}>RoomiePlace</span>
        </div>
      </div>

      <nav className={styles.ownerNav}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`${styles.ownerNavButton} ${activeTab === id ? styles.ownerNavButtonActive : ''}`}
          >
            <Icon className={styles.ownerIconSmall} aria-hidden="true" />
            <span className={styles.ownerNavLabel}>{label}</span>
            {id === 'notifications' && unreadNotifications > 0 && (
              <span className={styles.ownerNavBadge}>{unreadNotifications}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.ownerLogoutWrap}>
        <button type="button" className={styles.ownerLogoutButton}>
          <ArrowLeftOnRectangleIcon className={styles.ownerIconSmall} aria-hidden="true" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
