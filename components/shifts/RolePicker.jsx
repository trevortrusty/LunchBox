'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Renders a role selector with:
//   - Dropdown of existing roles + "No role" + "New role…" option
//   - Inline form to create a new role (with save/cancel)
//   - Delete (×) button on each role in the dropdown
//
// Props:
//   value      – current role name string (or '')
//   onChange   – (roleName: string) => void
//   isOpen     – parent modal's isOpen (used to trigger fetch)

export default function RolePicker({ value, onChange, isOpen }) {
  const [roles, setRoles] = useState([])
  const [mode, setMode] = useState('select') // 'select' | 'new'
  const [newRoleName, setNewRoleName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchRoles = () =>
    fetch('/api/roles')
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {})

  useEffect(() => {
    if (!isOpen) return
    fetchRoles()
  }, [isOpen])

  const handleSelectChange = (e) => {
    const val = e.target.value
    if (val === '__new__') {
      setMode('new')
    } else {
      onChange(val)
    }
  }

  const handleCreate = async () => {
    const name = newRoleName.trim()
    if (!name) return
    setSaving(true)
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to create role')
        return
      }
      const created = await res.json()
      await fetchRoles()
      onChange(created.name)
      setNewRoleName('')
      setMode('select')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role, e) => {
    e.stopPropagation()
    setDeletingId(role.id)
    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete role')
        return
      }
      // If the deleted role was selected, clear the value
      if (value === role.name) onChange('')
      await fetchRoles()
    } catch {
      toast.error('Network error')
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]'

  if (mode === 'new') {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
          placeholder="New role name"
          autoFocus
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !newRoleName.trim()}
          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('select'); setNewRoleName('') }}
          className="px-3 py-2 text-sm rounded-lg border transition-colors shrink-0 border-[var(--color-input-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={handleSelectChange}
        className={inputClass}
      >
        <option value="">No role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.name}>
            {r.name}
          </option>
        ))}
        <option value="__new__">+ New role…</option>
      </select>

      {/* Delete buttons overlay — shown as a separate list below the select */}
      {roles.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {roles.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-2 py-0.5 rounded text-xs text-[var(--color-text-muted)]"
            >
              <span>{r.name}</span>
              <button
                type="button"
                onClick={(e) => handleDelete(r, e)}
                disabled={deletingId === r.id}
                className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors ml-2 leading-none"
                aria-label={`Delete ${r.name}`}
              >
                {deletingId === r.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
