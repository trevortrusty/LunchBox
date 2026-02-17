import React from "react";
import ShiftRow from "./ShiftRow";

function groupByRole(shifts) {
  const groups = new Map();

  for (const shift of shifts) {
    const key = shift.currentRole || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(shift);
  }

  // Named roles alphabetically, "No role" last
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "" && b === "") return 0;
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });
}

export default function ShiftTable({ shifts, onRefresh }) {
  if (shifts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-400 text-sm">
          No shifts scheduled for this date.
        </p>
      </div>
    );
  }

  const groups = groupByRole(shifts);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-500">
              Associate
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">
              Role
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">
              Time
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">
              Rest Periods
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {groups.map(([role, groupShifts]) => (
            <React.Fragment key={`group-${role}`}>
              <tr className="bg-gray-100 border-b border-gray-200">
                <td
                  colSpan={5}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {role || "No Role"}
                </td>
              </tr>
              {groupShifts.map((shift) => (
                <ShiftRow key={shift.id} shift={shift} onRefresh={onRefresh} />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
