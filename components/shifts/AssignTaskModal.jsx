"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function AssignTaskModal({
  isOpen,
  onClose,
  shift,
  onComplete,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((all) => {
        setTasks(all.filter((t) => t.status === "PENDING"));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedTaskId) {
      toast.error("Select a task to assign");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedAssociateId: shift.associateId,
          status: "IN_PROGRESS",
        }),
      });
      if (!res.ok) {
        toast.error("Failed to assign task");
        return;
      }
      toast.success("Task assigned");
      onComplete();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Task — ${shift.associate?.name}`}
    >
      <div className="space-y-4">
        {fetching ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pending tasks available.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Task</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="task"
                    value={t.id}
                    checked={selectedTaskId === t.id}
                    onChange={() => setSelectedTaskId(t.id)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || fetching || tasks.length === 0}
          >
            {loading ? "Assigning..." : "Assign Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
