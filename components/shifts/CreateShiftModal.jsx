'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function CreateShiftModal({ isOpen, onClose, selectedDate, onCreated }) {
  const [associates, setAssociates] = useState([])
  const [associateMode, setAssociateMode] = useState('existing')
  const [associateId, setAssociateId] = useState('')
  const [newAssociateName, setNewAssociateName] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchAssociates = () =>
    fetch('/api/associates')
      .then((r) => r.json())
      .then(setAssociates)
      .catch(() => {})

  useEffect(() => {
    if (!isOpen) return
    fetchAssociates()
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let resolvedAssociateId = associateId

      if (associateMode === 'new') {
        if (!newAssociateName.trim()) {
          toast.error('Enter a name for the new associate')
          return
        }
        const res = await fetch('/api/associates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newAssociateName.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Failed to create associate')
          return
        }
        const created = await res.json()
        resolvedAssociateId = created.id
        await fetchAssociates()
      }

      if (!resolvedAssociateId) {
        toast.error('Select an associate')
        return
      }

      const startDateTime = `${selectedDate}T${startTime}:00`
      const endDateTime = `${selectedDate}T${endTime}:00`

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          associateId: resolvedAssociateId,
          startTime: startDateTime,
          endTime: endDateTime,
          role: role || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to create shift')
        return
      }
      const shift = await res.json()
      const restCount = shift.restPeriods?.length || 0
      toast.success(`Shift created with ${restCount} rest period${restCount !== 1 ? 's' : ''}`)
      onCreated()
      onClose()
      setAssociateId('')
      setNewAssociateName('')
      setAssociateMode('existing')
      setRole('')
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Shift">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Associate</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { setAssociateMode('existing'); setNewAssociateName('') }}
                className={`text-xs px-2 py-1 rounded ${associateMode === 'existing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => { setAssociateMode('new'); setAssociateId('') }}
                className={`text-xs px-2 py-1 rounded ${associateMode === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                New
              </button>
            </div>
          </div>
          {associateMode === 'existing' ? (
            <select
              value={associateId}
              onChange={(e) => setAssociateId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select associate...</option>
              {associates.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={newAssociateName}
              onChange={(e) => setNewAssociateName(e.target.value)}
              required
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role (optional)</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Cashier, Floor Lead"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shift'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
