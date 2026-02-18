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
      return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200";
    case "OUT":
      return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300 cursor-default";
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
          onClick={(e) => {
            e.stopPropagation();
            onRestClick(rest);
          }}
          className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${getRestButtonStyle(rest.status)}`}
        >
          {getRestButtonLabel(rest)}
        </button>
      ))}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ShiftRow({
  shift,
  onRefresh,
  isSelected,
  onSelect,
  onDeselect,
}) {
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

  const handleRowClick = () => {
    onSelect();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowEditShift(true);
  };

  const handleTaskClick = (e) => {
    e.stopPropagation();
    setShowAssignTask(true);
  };

  const timeStr = `${format(new Date(shift.startTime), "h:mm a")} – ${format(new Date(shift.endTime), "h:mm a")}`;

  return (
    <>
      <tr
        className="transition-colors cursor-pointer"
        style={{ background: getRowBg(shift) }}
        onClick={handleRowClick}
      >
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
          {/* Mobile-only: time, rest buttons, and action icons stacked under name */}
          <div className="sm:hidden mt-1.5 space-y-1.5">
            <div className="text-xs text-[var(--color-text-muted)]">
              {timeStr}
            </div>
            <RestButtons rests={rests} onRestClick={handleRestClick} />
            {isSelected && (
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Edit shift"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={handleTaskClick}
                  className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                  title="Assign task"
                >
                  <TaskIcon />
                </button>
              </div>
            )}
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

        {/* Time — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
          {timeStr}
        </td>

        {/* Rest Periods — hidden on mobile */}
        <td className="hidden sm:table-cell px-4 py-3">
          <RestButtons rests={rests} onRestClick={handleRestClick} />
        </td>

        {/* Actions — icons appear when row is selected; hidden on mobile (shown inline above) */}
        <td className="hidden sm:table-cell px-4 py-3">
          {isSelected && (
            <div className="flex gap-2">
              <button
                onClick={handleEditClick}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Edit shift"
              >
                <PencilIcon />
              </button>
              <button
                onClick={handleTaskClick}
                className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                title="Assign task"
              >
                <TaskIcon />
              </button>
            </div>
          )}
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
          onClose={() => {
            setShowEditShift(false);
            onDeselect();
          }}
          shift={shift}
          onComplete={() => {
            setShowEditShift(false);
            onDeselect();
            onRefresh();
          }}
          onDeleteRequest={() => {
            setShowEditShift(false);
            setShowDeleteShift(true);
          }}
        />
      )}

      {showAssignTask && (
        <AssignTaskModal
          isOpen={showAssignTask}
          onClose={() => {
            setShowAssignTask(false);
            onDeselect();
          }}
          shift={shift}
          onComplete={() => {
            setShowAssignTask(false);
            onDeselect();
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
            onDeselect();
            onRefresh();
          }}
        />
      )}
    </>
  );
}
