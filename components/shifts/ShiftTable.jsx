import ShiftRow from './ShiftRow'

export default function ShiftTable({ shifts, onRefresh }) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-400 text-sm">No shifts scheduled for this date.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-500">Associate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Rest Periods</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {shifts.map((shift) => (
            <ShiftRow key={shift.id} shift={shift} onRefresh={onRefresh} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
