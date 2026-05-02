import { useEffect } from 'react'

import logo from '@/assets/logo.png'

export function useAppMetadata() {
  useEffect(() => {
    document.title = 'Roomies'

    const favicon = document.querySelector("link[rel='icon']") ?? document.createElement('link')
    favicon.setAttribute('rel', 'icon')
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', logo)

    if (!favicon.parentElement) {
      document.head.appendChild(favicon)
    }
  }, [])
}
