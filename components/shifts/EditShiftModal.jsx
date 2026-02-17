'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

function toLocalDate(isoString) {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalTime(isoString) {
  const d = new Date(isoString)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export default function EditShiftModal({ isOpen, onClose, shift, onComplete }) {
  const [associates, setAssociates] = useState([])
  const [associateId, setAssociateId] = useState(shift.associateId)
  const [date, setDate] = useState(toLocalDate(shift.startTime))
  const [startTime, setStartTime] = useState(toLocalTime(shift.startTime))
  const [endTime, setEndTime] = useState(toLocalTime(shift.endTime))
  const [role, setRole] = useState(shift.currentRole || '')
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)

  const originalDate = toLocalDate(shift.startTime)
  const originalStart = toLocalTime(shift.startTime)
  const originalEnd = toLocalTime(shift.endTime)
  const timesChanged = date !== originalDate || startTime !== originalStart || endTime !== originalEnd

  useEffect(() => {
    if (!isOpen) return
    setFetching(true)
    fetch('/api/associates')
      .then((r) => r.json())
      .then(setAssociates)
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const startDateTime = `${date}T${startTime}:00`
      const endDateTime = `${date}T${endTime}:00`

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        toast.error('End time must be after start time')
        return
      }

      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          associateId,
          startTime: startDateTime,
          endTime: endDateTime,
          currentRole: role || null,
          originalRole: role || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to update shift')
        return
      }

      toast.success('Shift updated')
      onComplete()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Shift — ${shift.associate?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">Associate</label>
          {fetching ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
          ) : (
            <select
              value={associateId}
              onChange={(e) => setAssociateId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]"
            >
              {associates.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]"
            />
          </div>
        </div>

        {timesChanged && (
          <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] px-3 py-2 rounded-lg">
            Changing the date or time will regenerate rest periods for this shift.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">Role (optional)</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Cashier, Floor Lead"
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || fetching}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
