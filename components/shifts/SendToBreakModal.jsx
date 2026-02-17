'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function SendToBreakModal({ isOpen, onClose, shift, restPeriod, onComplete }) {
  const [reliefAssociates, setReliefAssociates] = useState([])
  const [selectedRelief, setSelectedRelief] = useState('')
  const [noRelief, setNoRelief] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setFetching(true)
    // Fetch active shifts to find eligible relief associates
    fetch('/api/shifts?date=' + new Date().toISOString().slice(0, 10))
      .then((r) => r.json())
      .then((shifts) => {
        const eligible = shifts.filter((s) => {
          if (s.id === shift.id) return false
          if (s.status !== 'ACTIVE') return false
          // Not currently OUT on break
          const isOut = s.restPeriods?.some((r) => r.status === 'OUT')
          if (isOut) return false
          // Not already covering another shift
          if (s.temporarilyCoveringShiftId) return false
          return true
        })
        setReliefAssociates(eligible)
      })
      .catch(() => setReliefAssociates([]))
      .finally(() => setFetching(false))
  }, [isOpen, shift.id])

  const handleSubmit = async () => {
    if (!noRelief && !selectedRelief) {
      toast.error('Select a relief associate or choose No Relief')
      return
    }
    setLoading(true)
    try {
      const body = { action: 'SEND' }
      if (noRelief) body.noRelief = true
      else body.reliefAssociateId = reliefAssociates.find((s) => s.id === selectedRelief)?.associateId

      const res = await fetch(`/api/shifts/${shift.id}/rest-periods/${restPeriod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to send to break')
        return
      }
      toast.success(`${shift.associate?.name} sent to ${restPeriod.type.toLowerCase()}`)
      onComplete()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const restLabel = restPeriod?.type === 'LUNCH' ? 'Lunch' : 'Break'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send to ${restLabel} — ${shift.associate?.name}`}>
      <div className="space-y-4">
        {fetching ? (
          <p className="text-sm text-gray-500">Loading eligible associates...</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relief Associate</label>
              {reliefAssociates.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No eligible relief associates available.</p>
              ) : (
                <div className="space-y-2">
                  {reliefAssociates.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="relief"
                        value={s.id}
                        checked={selectedRelief === s.id && !noRelief}
                        onChange={() => { setSelectedRelief(s.id); setNoRelief(false) }}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {s.associate?.name}
                        {s.currentRole && <span className="text-gray-400 ml-1">({s.currentRole})</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer border-t pt-3">
              <input
                type="radio"
                name="relief"
                checked={noRelief}
                onChange={() => { setNoRelief(true); setSelectedRelief('') }}
                className="text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">No Relief</span>
            </label>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || fetching}>
            {loading ? 'Sending...' : `Send to ${restLabel}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
