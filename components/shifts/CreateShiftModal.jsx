"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CreateShiftModal({
  isOpen,
  onClose,
  selectedDate,
  onCreated,
}) {
  const [associates, setAssociates] = useState([]);
  const [associateMode, setAssociateMode] = useState("existing");
  const [associateId, setAssociateId] = useState("");
  const [newAssociateName, setNewAssociateName] = useState("");
  const [date, setDate] = useState(selectedDate || todayLocal());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAssociates = () =>
    fetch("/api/associates")
      .then((r) => r.json())
      .then(setAssociates)
      .catch(() => {});

  useEffect(() => {
    if (!isOpen) return;
    fetchAssociates();
    // Sync date to the selectedDate prop whenever the modal opens
    setDate(selectedDate || todayLocal());
  }, [isOpen, selectedDate]);

  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]";
  const activePill =
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  const inactivePill =
    "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let resolvedAssociateId = associateId;

      if (associateMode === "new") {
        if (!newAssociateName.trim()) {
          toast.error("Enter a name for the new associate");
          return;
        }
        const res = await fetch("/api/associates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newAssociateName.trim() }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to create associate");
          return;
        }
        const created = await res.json();
        resolvedAssociateId = created.id;
        await fetchAssociates();
      }

      if (!resolvedAssociateId) {
        toast.error("Select an associate");
        return;
      }

      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;

      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associateId: resolvedAssociateId,
          startTime: startDateTime,
          endTime: endDateTime,
          role: role || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create shift");
        return;
      }
      const shift = await res.json();
      const restCount = shift.restPeriods?.length || 0;
      toast.success(
        `Shift created with ${restCount} rest period${restCount !== 1 ? "s" : ""}`,
      );
      onCreated();
      onClose();
      setAssociateId("");
      setNewAssociateName("");
      setAssociateMode("existing");
      setRole("");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Shift">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--color-text-base)]">
              Associate
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setAssociateMode("existing");
                  setNewAssociateName("");
                }}
                className={`text-xs px-2 py-1 rounded ${associateMode === "existing" ? activePill : inactivePill}`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssociateMode("new");
                  setAssociateId("");
                }}
                className={`text-xs px-2 py-1 rounded ${associateMode === "new" ? activePill : inactivePill}`}
              >
                New
              </button>
            </div>
          </div>
          {associateMode === "existing" ? (
            <select
              value={associateId}
              onChange={(e) => setAssociateId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select associate...</option>
              {associates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={newAssociateName}
              onChange={(e) => setNewAssociateName(e.target.value)}
              required
              placeholder="Full name"
              className={inputClass}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--color-text-base)]">
            Role (optional)
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Cashier, Floor Lead"
            className={inputClass}
          />
        </div>

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
            {loading ? "Creating..." : "Create Shift"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
