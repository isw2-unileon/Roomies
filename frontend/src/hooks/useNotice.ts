import { useState } from 'react'

export type NoticeKind = 'idle' | 'error' | 'success'

export interface Notice {
  kind: NoticeKind
  message: string
}

const IDLE_NOTICE: Notice = { kind: 'idle', message: '' }

/**
 * Hook used to manage the state of the banner (error / éxito / idle).
 */
export function useNotice() {
  const [notice, setNotice] = useState<Notice>(IDLE_NOTICE)

  function showError(message: string) {
    setNotice({ kind: 'error', message })
  }

  function showSuccess(message: string) {
    setNotice({ kind: 'success', message })
  }

  function clearNotice() {
    setNotice(IDLE_NOTICE)
  }

  return { notice, showError, showSuccess, clearNotice }
}
