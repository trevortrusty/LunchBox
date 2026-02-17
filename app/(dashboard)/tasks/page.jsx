import { Suspense } from "react";
import TaskTracker from "@/components/tasks/TaskTracker";

export const metadata = { title: "Tasks — Lunchbox" };

export default function TasksPage() {
  return (
    <Suspense>
      <TaskTracker />
    </Suspense>
  );
}
