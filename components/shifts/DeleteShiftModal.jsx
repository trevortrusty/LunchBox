"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function DeleteShiftModal({
  isOpen,
  onClose,
  shift,
  onComplete,
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        toast.error("Failed to delete shift");
        return;
      }
      toast.success("Shift deleted");
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
      title={`Remove shift — ${shift.associate?.name}`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Do you want to remove this shift?
          </label>
        </div>
        <div></div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
