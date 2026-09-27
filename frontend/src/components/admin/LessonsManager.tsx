"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { api, ApiError, type LessonInput } from "@/lib/api";
import type { Lesson } from "@/lib/types";

const emptyLesson: LessonInput = { title: "", content: "", video_url: "", duration_minutes: 10, is_preview: false };

export function LessonsManager({
  courseId,
  lessons,
  onChange,
}: {
  courseId: number;
  lessons: Lesson[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<number | "new" | null>(null);

  return (
    <div className="space-y-3">
      {lessons.length > 0 && (
        <ol className="card divide-y divide-slate-100">
          {lessons.map((l, i) => (
            <li key={l.id} className="px-5 py-4">
              {editing === l.id ? (
                <LessonEditor
                  initial={{ ...l, video_url: l.video_url ?? "" }}
                  onCancel={() => setEditing(null)}
                  onSave={async (data) => {
                    await api.admin.updateLesson(l.id, data);
                    setEditing(null);
                    onChange();
                  }}
                />
              ) : (
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {l.duration_minutes} daq {l.is_preview && "• bepul"} {l.video_url ? "• video bor" : "• video yo'q"}
                    </p>
                  </div>
                  <button onClick={() => setEditing(l.id)} className="btn-ghost">Tahrirlash</button>
                  <button
                    onClick={async () => {
                      if (!confirm(`"${l.title}" darsini o'chirasizmi?`)) return;
                      await api.admin.deleteLesson(l.id);
                      onChange();
                    }}
                    className="btn-ghost text-red-600"
                  >
                    O&apos;chirish
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {editing === "new" ? (
        <div className="card p-5">
          <LessonEditor
            initial={emptyLesson}
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              await api.admin.createLesson(courseId, data);
              setEditing(null);
              onChange();
            }}
          />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="btn-secondary w-full border-dashed">
          + Dars qo&apos;shish
        </button>
      )}
    </div>
  );
}

function LessonEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: LessonInput & { position?: number | null };
  onSave: (data: LessonInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<LessonInput>({
    title: initial.title,
    content: initial.content,
    video_url: initial.video_url,
    duration_minutes: initial.duration_minutes,
    is_preview: initial.is_preview,
    position: initial.position,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, video_url: form.video_url || null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_100px]">
        <div>
          <label className="label">Dars nomi</label>
          <input className="input" required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Davomiyligi (daq)</label>
          <input type="number" min={0} className="input" value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Tartib</label>
          <input type="number" min={0} className="input" value={form.position ?? ""} placeholder="auto"
            onChange={(e) => setForm({ ...form, position: e.target.value === "" ? null : Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Video havolasi (YouTube, Vimeo yoki .mp4)</label>
        <input type="url" className="input" placeholder="https://www.youtube.com/watch?v=..." value={form.video_url ?? ""}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
      </div>
      <div>
        <label className="label">Dars matni / konspekt</label>
        <textarea rows={4} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-brand-600" checked={form.is_preview}
          onChange={(e) => setForm({ ...form, is_preview: e.target.checked })} />
        Bepul tanishuv darsi (ro&apos;yxatdan o&apos;tmaganlarga ham ochiq)
      </label>
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Bekor qilish</button>
      </div>
    </form>
  );
}
