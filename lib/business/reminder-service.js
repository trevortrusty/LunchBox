'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Client-side hook that polls /api/reminders every 30 seconds
 * and shows toasts for due/due-soon rest periods.
 */
export function useReminderService(shopId) {
  const lastRemindedWindowRef = useRef(null)

  useEffect(() => {
    if (!shopId) return

    const check = async () => {
      try {
        const res = await fetch('/api/reminders')
        if (!res.ok) return
        const { dueSoon, dueNow } = await res.json()

        // Floor current time to 5-minute bucket for deduplication
        const now = Date.now()
        const fiveMinBucket = Math.floor(now / (5 * 60 * 1000))

        if (dueNow > 0) {
          toast.warning('There are rest periods due now', {
            id: 'rest-due-now',
          })
        } else if (dueSoon > 0 && lastRemindedWindowRef.current !== fiveMinBucket) {
          lastRemindedWindowRef.current = fiveMinBucket
          toast.info('There are rest periods due in 30 minutes', {
            id: 'rest-due-soon',
          })
        }
      } catch {
        // Silently ignore network errors
      }
    }

    check()
    const interval = setInterval(check, 30 * 1000)
    return () => clearInterval(interval)
  }, [shopId])
}
