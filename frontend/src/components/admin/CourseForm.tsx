"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type CourseInput } from "@/lib/api";
import { levelLabels } from "@/lib/format";
import type { Category, CourseLevel } from "@/lib/types";

const empty: CourseInput = {
  title: "",
  short_description: "",
  description: "",
  thumbnail_url: null,
  level: "beginner",
  price: 0,
  category_id: null,
  is_published: false,
  is_featured: false,
};

export function CourseForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<CourseInput>;
  submitLabel: string;
  onSubmit: (data: CourseInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CourseInput>({ ...empty, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => undefined);
  }, []);

  const set = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await onSubmit({ ...form, thumbnail_url: form.thumbnail_url || null });
      setMsg({ type: "success", text: "Saqlandi" });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof ApiError ? err.message : "Xatolik" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      <div>
        <label className="label" htmlFor="title">Kurs nomi</label>
        <input id="title" className="input" required minLength={3} value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="short">Qisqa tavsif</label>
        <input id="short" className="input" required minLength={10} maxLength={300} value={form.short_description}
          onChange={(e) => set("short_description", e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="desc">To&apos;liq tavsif</label>
        <textarea id="desc" rows={5} className="input" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="cat">Kategoriya</label>
          <select id="cat" className="input" value={form.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">— Tanlanmagan —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="level">Daraja</label>
          <select id="level" className="input" value={form.level} onChange={(e) => set("level", e.target.value)}>
            {(Object.keys(levelLabels) as CourseLevel[]).map((l) => <option key={l} value={l}>{levelLabels[l]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">Narx (so&apos;m, 0 = bepul)</label>
          <input id="price" type="number" min={0} className="input" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="thumb">Rasm havolasi (ixtiyoriy)</label>
        <input id="thumb" type="url" className="input" placeholder="https://..." value={form.thumbnail_url ?? ""}
          onChange={(e) => set("thumbnail_url", e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
          Nashr etilgan (talabalarga ko&apos;rinadi)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
          Mashhur kurslar qatorida
        </label>
      </div>
      <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : submitLabel}</button>
    </form>
  );
}
