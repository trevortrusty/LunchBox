'use client'

import { useState, useEffect, useCallback } from 'react'
import TaskBoard from './TaskBoard'
import CreateTaskModal from './CreateTaskModal'
import Button from '@/components/ui/Button'

export default function TaskTracker() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Button onClick={() => setShowCreate(true)}>+ New Task</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading tasks...</div>
      ) : (
        <TaskBoard tasks={tasks} onRefresh={fetchTasks} />
      )}

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTasks}
      />
    </div>
  )
}
