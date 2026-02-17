"use client";

import { useState } from "react";
import { format } from "date-fns";
import SendToBreakModal from "./SendToBreakModal";
import ReturnFromBreakModal from "./ReturnFromBreakModal";
import ResetBreakStatusModal from "./ResetBreakStatusModal";
import ChangeRoleModal from "./ChangeRoleModal";
import AssignTaskModal from "./AssignTaskModal";

function getRestButtonStyle(status) {
  switch (status) {
    case "DUE":
      return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200";
    case "OUT":
      return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300 cursor-default";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200";
  }
}

function getRestButtonLabel(rest) {
  const time = format(new Date(rest.scheduledTime), "h:mm a");
  const typeLabel = rest.type === "LUNCH" ? "Lunch" : "Break";
  switch (rest.status) {
    case "DUE":
      return `${typeLabel} DUE`;
    case "OUT":
      return `${typeLabel} OUT`;
    case "COMPLETED":
      return `${typeLabel} Done`;
    default:
      return `${typeLabel} ${time}`;
  }
}

function getRowStyle(shift) {
  const rests = shift.restPeriods || [];
  const hasOut = rests.some((r) => r.status === "OUT");
  const hasDue = rests.some((r) => r.status === "DUE");
  const allDone =
    rests.length > 0 && rests.every((r) => r.status === "COMPLETED");

  if (hasOut) return "bg-blue-50";
  if (hasDue) return "bg-amber-50";
  if (allDone) return "bg-green-50";
  return "bg-white";
}

export default function ShiftRow({ shift, onRefresh }) {
  const [sendBreakRest, setSendBreakRest] = useState(null);
  const [returnBreakRest, setReturnBreakRest] = useState(null);
  const [resetBreakRest, setResetBreakRest] = useState(null);
  const [showChangeRole, setShowChangeRole] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);

  const rests = shift.restPeriods || [];

  const handleRestClick = (rest) => {
    if (rest.status === "COMPLETED") {
      setResetBreakRest(rest);
    } else if (rest.status === "OUT") {
      setReturnBreakRest(rest);
    } else {
      setSendBreakRest(rest);
    }
  };

  return (
    <>
      <tr className={`${getRowStyle(shift)} transition-colors`}>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">
            {shift.associate?.name}
          </div>
          {shift.department && (
            <div className="text-xs text-gray-400">{shift.department.name}</div>
          )}
        </td>
        <td className="px-4 py-3 text-gray-600">
          {shift.currentRole || (
            <span className="text-gray-300 italic">No role</span>
          )}
          {shift.temporarilyCoveringShiftId && (
            <div className="text-xs text-blue-500">Covering another</div>
          )}
          {shift.coveredByShift && (
            <div className="text-xs text-blue-500">
              Covered by {shift.coveredByShift?.associate?.name}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
          {format(new Date(shift.startTime), "h:mm a")} –{" "}
          {format(new Date(shift.endTime), "h:mm a")}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {rests.length === 0 ? (
              <span className="text-gray-300 text-xs italic">None</span>
            ) : (
              rests.map((rest) => (
                <button
                  key={rest.id}
                  onClick={() => handleRestClick(rest)}
                  className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${getRestButtonStyle(rest.status)}`}
                  // disabled={rest.status === "COMPLETED"}
                >
                  {getRestButtonLabel(rest)}
                </button>
              ))
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => setShowChangeRole(true)}
              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Role
            </button>
            <button
              onClick={() => setShowAssignTask(true)}
              className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
            >
              Task
            </button>
          </div>
        </td>
      </tr>

      {sendBreakRest && (
        <SendToBreakModal
          isOpen={!!sendBreakRest}
          onClose={() => setSendBreakRest(null)}
          shift={shift}
          restPeriod={sendBreakRest}
          onComplete={() => {
            setSendBreakRest(null);
            onRefresh();
          }}
        />
      )}

      {returnBreakRest && (
        <ReturnFromBreakModal
          isOpen={!!returnBreakRest}
          onClose={() => setReturnBreakRest(null)}
          shift={shift}
          restPeriod={returnBreakRest}
          onComplete={() => {
            setReturnBreakRest(null);
            onRefresh();
          }}
        />
      )}

      {resetBreakRest && (
        <ResetBreakStatusModal
          isOpen={!!resetBreakRest}
          onClose={() => setResetBreakRest(null)}
          shift={shift}
          restPeriod={resetBreakRest}
          onComplete={() => {
            setResetBreakRest(null);
            onRefresh();
          }}
        />
      )}

      {showChangeRole && (
        <ChangeRoleModal
          isOpen={showChangeRole}
          onClose={() => setShowChangeRole(false)}
          shift={shift}
          onComplete={() => {
            setShowChangeRole(false);
            onRefresh();
          }}
        />
      )}

      {showAssignTask && (
        <AssignTaskModal
          isOpen={showAssignTask}
          onClose={() => setShowAssignTask(false)}
          shift={shift}
          onComplete={() => {
            setShowAssignTask(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
