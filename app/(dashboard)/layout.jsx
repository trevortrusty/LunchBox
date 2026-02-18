"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useReminderService } from "@/lib/business/reminder-service";

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="17"
      viewBox="0 0 28 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="sm:w-7 sm:h-[22px]"
    >
      {/* Top bun — thicker, rounded */}
      <rect x="2" y="0" width="24" height="5" rx="2.5" fill="currentColor" />
      {/* Patty — thinner, slightly wider */}
      <rect
        x="0"
        y="8.5"
        width="28"
        height="3.5"
        rx="1.75"
        fill="currentColor"
      />
      {/* Bottom bun — thicker, rounded */}
      <rect x="2" y="16" width="24" height="5" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Date lives in the URL so it persists across tab switches
  const date = searchParams.get("date") || "";

  // On first mount, inject today's date into the URL if not already present
  useEffect(() => {
    if (!searchParams.get("date")) {
      const today = todayLocal();
      router.replace(`${pathname}?date=${today}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = (newDate) => {
    router.replace(`${pathname}?date=${newDate}`);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setSession(data);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useReminderService(session?.shopId);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleManage = () => {
    setMenuOpen(false);
    router.push("/manage");
  };

  // Build href for nav tabs, preserving the current date param
  const tabHref = (path) => (date ? `${path}?date=${date}` : path);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-2 py-3 sm:px-4 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            <span className="font-bold text-gray-900 text-lg sm:text-xl">
              LunchBox
              {process.env.NEXT_PUBLIC_APP_ENV === "dev" && (
                <span className="ml-1 text-[10px] sm:text-xs font-normal text-amber-600 bg-amber-100 px-1 py-0.5 sm:px-1.5 rounded">
                  dev
                </span>
              )}
            </span>
            <div className="flex gap-0.5 sm:gap-1">
              <Link
                href={tabHref("/shifts")}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  pathname.startsWith("/shifts")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Shifts
              </Link>
              <Link
                href={tabHref("/tasks")}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  pathname.startsWith("/tasks")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Tasks
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-1.5 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-auto"
            />
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                aria-label="Menu"
              >
                <HamburgerIcon />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/manage"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Manage
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
