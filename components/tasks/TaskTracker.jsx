"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import TaskBoard from "./TaskBoard";
import CreateTaskModal from "./CreateTaskModal";
import Button from "@/components/ui/Button";

export default function TaskTracker() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date") || "";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch(`/api/tasks?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedDate &&
              format(
                new Date(selectedDate + "T12:00:00"),
                "EEEE, MMMM d, yyyy",
              )}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Task</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading tasks...</div>
      ) : (
        <TaskBoard tasks={tasks} onRefresh={fetchTasks} />
      )}

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTasks}
        selectedDate={selectedDate}
      />
    </div>
  );
}
