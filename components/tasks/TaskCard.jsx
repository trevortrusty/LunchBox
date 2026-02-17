"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_TRANSITIONS = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED", "PENDING"],
  COMPLETED: ["PENDING"],
  CANCELLED: ["PENDING"],
};

const STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function TaskCard({ task, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Failed to update task");
        return;
      }
      onRefresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const nextStatuses = STATUS_TRANSITIONS[task.status] || [];

  return (
    <div
      className={`p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50 cursor-pointer ${loading ? 'opacity-50' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${STATUS_BADGE[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.scheduledTime && (
        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(task.scheduledTime), "MMM d, h:mm a")}
        </p>
      )}

      {task.assignedAssociate && (
        <p className="text-xs text-gray-500 mt-1">
          Assigned: {task.assignedAssociate.name}
        </p>
      )}

      {expanded && nextStatuses.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading}
              className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
