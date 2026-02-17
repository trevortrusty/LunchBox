import TaskCard from './TaskCard'

const COLUMNS = [
  { status: 'PENDING', label: 'Pending', color: 'border-t-gray-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-purple-500' },
  { status: 'COMPLETED', label: 'Completed', color: 'border-t-green-500' },
  { status: 'CANCELLED', label: 'Cancelled', color: 'border-t-red-400' },
]

export default function TaskBoard({ tasks, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(({ status, label, color }) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status} className={`bg-white rounded-xl border border-gray-200 border-t-4 ${color} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">
                {label}
                <span className="ml-2 text-xs font-normal text-gray-400">({columnTasks.length})</span>
              </h3>
            </div>
            <div className="p-3 space-y-2 min-h-24">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-gray-300 italic text-center py-4">Empty</p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onRefresh={onRefresh} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
