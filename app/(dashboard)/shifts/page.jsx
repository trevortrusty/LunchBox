import { Suspense } from "react";
import ShiftTracker from "@/components/shifts/ShiftTracker";

export const metadata = { title: "Shifts — Lunchbox" };

export default function ShiftsPage() {
  return (
    <Suspense>
      <ShiftTracker />
    </Suspense>
  );
}
