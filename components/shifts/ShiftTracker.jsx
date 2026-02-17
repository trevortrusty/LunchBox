'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import ShiftTable from './ShiftTable'
import CreateShiftModal from './CreateShiftModal'
import Button from '@/components/ui/Button'

export default function ShiftTracker() {
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)

  // Initialize to client's local date after hydration (SSR runs in UTC, not the user's timezone).
  // Uses native Date methods instead of date-fns to guarantee local-timezone resolution.
  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setSelectedDate(`${y}-${m}-${d}`)
  }, [])
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchShifts = useCallback(async () => {
    if (!selectedDate) return
    try {
      const res = await fetch(`/api/shifts?date=${selectedDate}`)
      if (res.ok) {
        const data = await res.json()
        setShifts(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    setLoading(true)
    fetchShifts()
  }, [fetchShifts])

  // Poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchShifts, 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchShifts])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedDate && format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={() => setShowCreateModal(true)}>+ Add Shift</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading shifts...</div>
      ) : (
        <ShiftTable shifts={shifts} onRefresh={fetchShifts} />
      )}

      <CreateShiftModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate}
        onCreated={fetchShifts}
      />
    </div>
  )
}
