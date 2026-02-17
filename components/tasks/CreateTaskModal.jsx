"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreated,
  selectedDate,
}) {
  const [name, setName] = useState("");
  const [scheduledTime, setScheduledTime] = useState(
    selectedDate ? `${selectedDate}T09:00` : "",
  );
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [assignedAssociateId, setAssignedAssociateId] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/associates")
      .then((r) => r.json())
      .then(setAssociates)
      .catch(() => {});
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Task name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scheduledTime: scheduledTime || undefined,
          recurrenceRule: recurrenceRule || undefined,
          assignedAssociateId: assignedAssociateId || undefined,
          saveAsTemplate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create task");
        return;
      }
      toast.success("Task created");
      onCreated();
      onClose();
      setName("");
      setScheduledTime("");
      setRecurrenceRule("");
      setAssignedAssociateId("");
      setSaveAsTemplate(false);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Restock shelves, Clean checkout"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Time (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recurrence (optional)
          </label>
          <input
            type="text"
            value={recurrenceRule}
            onChange={(e) => setRecurrenceRule(e.target.value)}
            placeholder="e.g. FREQ=DAILY, FREQ=WEEKLY"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Associate (optional)
          </label>
          <select
            value={assignedAssociateId}
            onChange={(e) => setAssignedAssociateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {associates.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">
            Save as template for future use
          </span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
