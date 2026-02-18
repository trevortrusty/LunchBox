"use client";

import { useState } from "react";
import { format } from "date-fns";
import SendToBreakModal from "./SendToBreakModal";
import ReturnFromBreakModal from "./ReturnFromBreakModal";
import ResetBreakStatusModal from "./ResetBreakStatusModal";
import EditShiftModal from "./EditShiftModal";
import AssignTaskModal from "./AssignTaskModal";
import DeleteShiftModal from "./DeleteShiftModal";

function getRestButtonStyle(status) {
  switch (status) {
    case "DUE":
      return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900";
    case "OUT":
      return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300 cursor-default dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    default:
      return "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] border-[var(--color-input-border)] hover:bg-[var(--color-border)]";
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

function getRowBg(shift) {
  const rests = shift.restPeriods || [];
  const hasOut = rests.some((r) => r.status === "OUT");
  const hasDue = rests.some((r) => r.status === "DUE");
  const allDone =
    rests.length > 0 && rests.every((r) => r.status === "COMPLETED");

  if (hasOut) return "var(--color-row-out)";
  if (hasDue) return "var(--color-row-due)";
  if (allDone) return "var(--color-row-done)";
  return "var(--color-row-default)";
}

function RestButtons({ rests, onRestClick }) {
  if (rests.length === 0) {
    return (
      <span className="text-[var(--color-text-subtle)] text-xs italic">
        None
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {rests.map((rest) => (
        <button
          key={rest.id}
          onClick={() => onRestClick(rest)}
          className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${getRestButtonStyle(rest.status)}`}
        >
          {getRestButtonLabel(rest)}
        </button>
      ))}
    </div>
  );
}

export default function ShiftRow({ shift, onRefresh }) {
  const [sendBreakRest, setSendBreakRest] = useState(null);
  const [returnBreakRest, setReturnBreakRest] = useState(null);
  const [resetBreakRest, setResetBreakRest] = useState(null);
  const [showEditShift, setShowEditShift] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showDeleteShift, setShowDeleteShift] = useState(false);
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

  const timeStr = `${format(new Date(shift.startTime), "h:mm a")} – ${format(new Date(shift.endTime), "h:mm a")}`;

  return (
    <>
      <tr className="transition-colors" style={{ background: getRowBg(shift) }}>
        {/* Associate — always visible. On mobile also shows time + rest buttons */}
        <td className="px-4 py-3">
          <div className="font-medium text-[var(--color-text-base)]">
            {shift.associate?.name}
          </div>
          {shift.department && (
            <div className="text-xs text-[var(--color-text-subtle)]">
              {shift.department.name}
            </div>
          )}
          {/* Mobile-only: time + rest buttons stacked under name */}
          <div className="sm:hidden mt-1.5 space-y-1.5">
            <div className="text-xs text-[var(--color-text-muted)]">
              {timeStr}
            </div>
            <RestButtons rests={rests} onRestClick={handleRestClick} />
          </div>
        </td>

        {/* Role — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3 text-[var(--color-text-muted)]">
          {shift.currentRole || (
            <span className="text-[var(--color-text-subtle)] italic">
              No role
            </span>
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

        {/* Time — hidden on mobile (shown inline above) */}
        <td className="hidden sm:table-cell px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
          {timeStr}
        </td>

        {/* Rest Periods — hidden on mobile (shown inline above) */}
        <td className="hidden sm:table-cell px-4 py-3">
          <RestButtons rests={rests} onRestClick={handleRestClick} />
        </td>

        {/* Actions — always visible */}
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => setShowEditShift(true)}
              className="text-xs px-2 py-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowAssignTask(true)}
              className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
            >
              Task
            </button>
            <button
              onClick={() => setShowDeleteShift(true)}
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Delete
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

      {showEditShift && (
        <EditShiftModal
          isOpen={showEditShift}
          onClose={() => setShowEditShift(false)}
          shift={shift}
          onComplete={() => {
            setShowEditShift(false);
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

      {showDeleteShift && (
        <DeleteShiftModal
          isOpen={showDeleteShift}
          onClose={() => setShowDeleteShift(false)}
          shift={shift}
          onComplete={() => {
            setShowDeleteShift(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
