import TaskTracker from "@/components/tasks/TaskTracker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks — LunchBox" };

export default function TasksPage() {
  return <TaskTracker />;
}
