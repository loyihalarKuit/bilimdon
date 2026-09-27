"use client";

import { useCallback, useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Alert } from "@/components/ui/Alert";
import { CategoryIcon } from "@/components/ui/Icons";
import { api, ApiError } from "@/lib/api";

const ICONS = ["code", "palette", "briefcase", "chart", "globe", "sparkles"];

export default function CategoriesPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <CategoriesContent />
    </RequireAuth>
  );
}

function CategoriesContent() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.admin.categories>>>([]);
  const [form, setForm] = useState({ name: "", description: "", icon: "sparkles" });
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.admin.categories().then(setItems).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.admin.createCategory(form);
      setForm({ name: "", description: "", icon: "sparkles" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kategoriyalar</h1>
      <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        {error && <Alert className="sm:col-span-4">{error}</Alert>}
        <div>
          <label className="label">Nomi</label>
          <input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Tavsif</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Ikona</label>
          <select className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
            {ICONS.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <button className="btn-primary">Qo&apos;shish</button>
      </form>

      <ul className="card divide-y divide-slate-100">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-4 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <CategoryIcon icon={c.icon} />
            </span>
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-slate-500">{c.course_count} ta kurs • /{c.slug}</p>
            </div>
            <button
              className="btn-ghost text-red-600"
              onClick={async () => {
                if (!confirm(`"${c.name}" kategoriyasini o'chirasizmi? Kurslar kategoriyasiz qoladi.`)) return;
                await api.admin.deleteCategory(c.id);
                load();
              }}
            >
              O&apos;chirish
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
