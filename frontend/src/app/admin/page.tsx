"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { levelLabels } from "@/lib/format";
import type { AdminStats, CourseListItem } from "@/lib/types";

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.admin
        .courses({ search })
        .then((p) => setCourses(p.items))
        .catch((e) => setError(e instanceof ApiError ? e.message : "Xatolik"));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Foydalanuvchilar", stats.users],
            ["Kurslar", stats.courses],
            ["Nashr etilgan", stats.published_courses],
            ["Yozilishlar", stats.enrollments],
            ["Sertifikatlar", stats.certificates],
          ].map(([label, value]) => (
            <div key={label} className="card p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kurslar</h1>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="input w-56" />
          <Link href="/admin/courses/new" className="btn-primary whitespace-nowrap">+ Yangi kurs</Link>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {!courses ? (
        !error && <PageLoader />
      ) : courses.length === 0 ? (
        <EmptyState title="Kurslar yo'q" description="Birinchi kursingizni yarating." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Kurs</th>
                <th className="px-4 py-3">Daraja</th>
                <th className="px-4 py-3">Darslar</th>
                <th className="px-4 py-3">Talabalar</th>
                <th className="px-4 py-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.title}</Link>
                    <p className="text-xs text-slate-500">{c.category?.name ?? "Kategoriyasiz"}</p>
                  </td>
                  <td className="px-4 py-3">{levelLabels[c.level]}</td>
                  <td className="px-4 py-3">{c.lesson_count}</td>
                  <td className="px-4 py-3">{c.student_count}</td>
                  <td className="px-4 py-3">
                    {c.is_published ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Nashr etilgan</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">Qoralama</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
