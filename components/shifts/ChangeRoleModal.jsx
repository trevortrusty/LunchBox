'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function ChangeRoleModal({ isOpen, onClose, shift, onComplete }) {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(shift.currentRole || '')
  const [customRole, setCustomRole] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/roles')
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {})
  }, [isOpen])

  const handleSubmit = async () => {
    const role = customRole.trim() || selectedRole
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRole: role || null }),
      })
      if (!res.ok) {
        toast.error('Failed to update role')
        return
      }
      toast.success('Role updated')
      onComplete()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Change Role — ${shift.associate?.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setCustomRole('') }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or type a custom role</label>
          <input
            type="text"
            value={customRole}
            onChange={(e) => { setCustomRole(e.target.value); setSelectedRole('') }}
            placeholder="e.g. Cashier, Floor Lead"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
