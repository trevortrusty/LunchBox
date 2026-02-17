"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import ShiftTable from "./ShiftTable";
import CreateShiftModal from "./CreateShiftModal";
import Button from "@/components/ui/Button";

export default function ShiftTracker() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") || "";

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchShifts = useCallback(async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch(`/api/shifts?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    fetchShifts();
  }, [fetchShifts]);

  // Poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchShifts, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchShifts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedDate &&
              format(
                new Date(selectedDate + "T12:00:00"),
                "EEEE, MMMM d, yyyy",
              )}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ Add Shift</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading shifts...</div>
      ) : (
        <ShiftTable shifts={shifts} onRefresh={fetchShifts} />
      )}

      <CreateShiftModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate}
        onCreated={fetchShifts}
      />
    </div>
  );
}
