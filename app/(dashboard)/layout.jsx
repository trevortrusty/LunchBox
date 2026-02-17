'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useReminderService } from '@/lib/business/reminder-service'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setSession(data)
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  useReminderService(session?.shopId)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900 text-lg">Lunchbox</span>
            <div className="flex gap-1">
              <Link
                href="/shifts"
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith('/shifts')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Shifts
              </Link>
              <Link
                href="/tasks"
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith('/tasks')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tasks
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="text-sm text-gray-500">{session.username}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
