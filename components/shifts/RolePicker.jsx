"use client";

import { useState, useEffect } from "react";

// Renders a role selector dropdown.
// Create/delete/edit roles is handled in the Manage view.
//
// Props:
//   value    – current role name string (or '')
//   onChange – (roleName: string) => void
//   isOpen   – parent modal's isOpen (used to trigger fetch)

export default function RolePicker({ value, onChange, isOpen }) {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/roles")
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
  }, [isOpen]);

  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)]";

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      <option value="">No role</option>
      {roles.map((r) => (
        <option key={r.id} value={r.name}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
