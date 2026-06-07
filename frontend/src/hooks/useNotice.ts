import { useCallback, useState } from 'react'

export interface Notice {
  kind: 'idle' | 'error' | 'success'
  message: string
}

const IDLE_NOTICE: Notice = { kind: 'idle', message: '' }

/**
 * Hook used to manage the state of the banner (error / éxito / idle).
 */
export function useNotice() {
  const [notice, setNotice] = useState<Notice>(IDLE_NOTICE)

  const showError = useCallback((message: string) => {
    setNotice({ kind: 'error', message })
  }, [])

  const showSuccess = useCallback((message: string) => {
    setNotice({ kind: 'success', message })
  }, [])

  const clearNotice = useCallback(() => {
    setNotice(IDLE_NOTICE)
  }, [])

  return { notice, showError, showSuccess, clearNotice }
}
