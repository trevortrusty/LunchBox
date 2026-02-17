'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [shopMode, setShopMode] = useState('existing')
  const [shopId, setShopId] = useState('')
  const [shopName, setShopName] = useState('')
  const [deptMode, setDeptMode] = useState('existing')
  const [departmentId, setDepartmentId] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [shops, setShops] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/shops')
      .then((r) => r.json())
      .then(setShops)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (shopMode === 'existing' && shopId) {
      fetch('/api/departments')
        .then((r) => r.json())
        .then(setDepartments)
        .catch(() => {})
    } else {
      setDepartments([])
      setDepartmentId('')
    }
  }, [shopMode, shopId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = { username, pin }
      if (shopMode === 'new') body.shopName = shopName
      else body.shopId = shopId

      if (deptMode === 'new') body.departmentName = departmentName
      else if (departmentId) body.departmentId = departmentId

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Registration failed')
        return
      }
      router.push('/shifts')
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Choose a username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          inputMode="numeric"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Choose a PIN"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setShopMode('existing')}
            className={`text-xs px-2 py-1 rounded ${shopMode === 'existing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            Existing
          </button>
          <button type="button" onClick={() => setShopMode('new')}
            className={`text-xs px-2 py-1 rounded ${shopMode === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            New shop
          </button>
        </div>
        {shopMode === 'existing' ? (
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a shop...</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : (
          <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} required
            placeholder="New shop name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setDeptMode('existing')}
            className={`text-xs px-2 py-1 rounded ${deptMode === 'existing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            Existing
          </button>
          <button type="button" onClick={() => setDeptMode('new')}
            className={`text-xs px-2 py-1 rounded ${deptMode === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            New department
          </button>
        </div>
        {deptMode === 'existing' ? (
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">None</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        ) : (
          <input type="text" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="New department name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {loading ? 'Creating account...' : 'Create account'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
