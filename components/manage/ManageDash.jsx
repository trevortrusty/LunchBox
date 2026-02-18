"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputClass =
  "w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const btnPrimary =
  "px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors";
const btnSecondary =
  "px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors";
const btnDanger =
  "px-4 py-2 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── Account Settings ─────────────────────────────────────────────────────────
function AccountSection() {
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {};
      if (username.trim() !== originalUsername) body.username = username.trim();
      if (pin.trim()) {
        body.pin = pin.trim();
        body.currentPin = currentPin.trim();
      }

      if (Object.keys(body).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update account");
        return;
      }
      toast.success("Account updated");
      setPin("");
      setCurrentPin("");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Account">
      <div className="space-y-3 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Leave blank to keep current"
            className={inputClass}
          />
        </div>
        {pin.trim() && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current PIN to confirm"
              className={inputClass}
            />
          </div>
        )}
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Section>
  );
}

// ─── Generic list manager (used for Roles and Departments) ────────────────────
function ListSection({ title, apiPath }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null); // { id, name }
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetch_ = useCallback(
    () =>
      fetch(apiPath)
        .then((r) => r.json())
        .then(setItems)
        .catch(() => {}),
    [apiPath],
  );

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const handleSelect = (e) => {
    const item = items.find((i) => i.id === e.target.value);
    setSelected(item || null);
    setEditName(item?.name || "");
  };

  const handleSave = async () => {
    if (!selected || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiPath}/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success("Updated");
      await fetch_();
      setSelected(data);
      setEditName(data.name);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiPath}/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Deleted");
      setSelected(null);
      setEditName("");
      await fetch_();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create");
        return;
      }
      toast.success("Created");
      setNewName("");
      await fetch_();
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Section title={title}>
      <div className="space-y-4 max-w-sm">
        {/* Create new */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New {title.slice(0, -1)}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={`${title.slice(0, -1)} name`}
              className={inputClass}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className={btnPrimary}
            >
              {creating ? "…" : "Add"}
            </button>
          </div>
        </div>

        {/* Select existing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit existing
          </label>
          <select
            value={selected?.id || ""}
            onChange={handleSelect}
            className={inputClass}
          >
            <option value="">Select {title.slice(0, -1).toLowerCase()}…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className={btnPrimary}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={btnDanger}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

// ─── Associates ───────────────────────────────────────────────────────────────
function AssociatesSection() {
  const [associates, setAssociates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    const [a, d] = await Promise.all([
      fetch("/api/associates")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/departments")
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setAssociates(a);
    setDepartments(d);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSelect = (e) => {
    const item = associates.find((a) => a.id === e.target.value);
    setSelected(item || null);
    setEditName(item?.name || "");
    setEditDeptId(item?.departmentId || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/associates/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          departmentId: editDeptId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success("Associate updated");
      await fetchAll();
      setSelected(data);
      setEditName(data.name);
      setEditDeptId(data.departmentId || "");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/associates/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Associate deleted");
      setSelected(null);
      setEditName("");
      setEditDeptId("");
      await fetchAll();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/associates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          departmentId: newDeptId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create");
        return;
      }
      toast.success("Associate created");
      setNewName("");
      setNewDeptId("");
      await fetchAll();
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Section title="Associates">
      <div className="space-y-4 max-w-sm">
        {/* Create new */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Associate
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className={inputClass}
            >
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className={btnPrimary}
            >
              {creating ? "Creating…" : "Add Associate"}
            </button>
          </div>
        </div>

        {/* Select existing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit existing
          </label>
          <select
            value={selected?.id || ""}
            onChange={handleSelect}
            className={inputClass}
          >
            <option value="">Select associate…</option>
            {associates.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={editDeptId}
                onChange={(e) => setEditDeptId(e.target.value)}
                className={inputClass}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={btnPrimary}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={btnDanger}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ManageDash() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage</h1>
      <AccountSection />
      <AssociatesSection />
      <ListSection title="Departments" apiPath="/api/departments" />
      <ListSection title="Roles" apiPath="/api/roles" />
    </div>
  );
}
