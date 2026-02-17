"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ReturnFromBreakModal({
  isOpen,
  onClose,
  shift,
  restPeriod,
  onComplete,
}) {
  const [loading, setLoading] = useState(false);

  const handleReturn = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/shifts/${shift.id}/rest-periods/${restPeriod.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RETURN" }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to return from break");
        return;
      }
      toast.success(
        `${shift.associate?.name} returned from ${restPeriod.type.toLowerCase()}`,
      );
      onComplete();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const restLabel = restPeriod?.type === "LUNCH" ? "lunch" : "break";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Return from ${restLabel} — ${shift.associate?.name}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Confirm that <strong>{shift.associate?.name}</strong> has returned
          from their {restLabel}.
          {restPeriod?.relievedByAssociate && (
            <span>
              {" "}
              Relief associate{" "}
              <strong>{restPeriod.relievedByAssociate.name}</strong> will be
              returned to their original role.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReturn} disabled={loading}>
            {loading ? "Returning..." : "Confirm Return"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
