"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseThumb } from "@/components/course/CourseThumb";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { AwardIcon, BookIcon, CheckIcon, QuizIcon } from "@/components/ui/Icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { DashboardStats, MyCourse } from "@/lib/types";

type Filter = "all" | "active" | "done";

export default function DashboardPage() {
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    Promise.all([api.me.courses(), api.me.dashboard()])
      .then(([c, s]) => {
        setCourses(c);
        setStats(s);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Ma'lumotlarni yuklab bo'lmadi"));
  }, []);

  const visible = (courses ?? []).filter((c) =>
    filter === "all" ? true : filter === "done" ? c.progress_percent === 100 : c.progress_percent < 100,
  );

  return (
    <>
      <DashboardHeader />
      <div className="container-page py-8">
        {error && <Alert>{error}</Alert>}
        {!courses || !stats ? (
          !error && <PageLoader />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<BookIcon />} label="Faol kurslar" value={stats.in_progress_courses} tone="brand" />
              <StatCard icon={<CheckIcon />} label="Tugallangan darslar" value={stats.completed_lessons} tone="emerald" />
              <StatCard icon={<QuizIcon />} label="O'tilgan testlar" value={stats.quizzes_passed} tone="amber" />
              <StatCard icon={<AwardIcon />} label="Sertifikatlar" value={stats.certificates} tone="violet" />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Mening kurslarim</h2>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
                {([["all", "Barchasi"], ["active", "Jarayonda"], ["done", "Tugallangan"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn("rounded-md px-3 py-1.5 font-medium", filter === key ? "bg-white shadow-sm" : "text-slate-600")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {courses.length === 0 ? (
                <EmptyState
                  title="Siz hali hech qaysi kursga yozilmagansiz"
                  description="Katalogdan o'zingizga yoqqan kursni tanlang va o'qishni boshlang."
                  action={<Link href="/courses" className="btn-primary">Kurslarni ko&apos;rish</Link>}
                />
              ) : visible.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">Bu bo&apos;limda kurs yo&apos;q.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visible.map((item) => (
                    <MyCourseCard key={item.course.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

const tones = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: keyof typeof tones }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MyCourseCard({ item }: { item: MyCourse }) {
  const { course } = item;
  const learnHref = `/learn/${course.slug}${item.next_lesson_id ? `?lesson=${item.next_lesson_id}` : ""}`;
  return (
    <div className="card flex flex-col overflow-hidden">
      <Link href={learnHref}>
        <CourseThumb id={course.id} title={course.title} url={course.thumbnail_url} icon={course.category?.icon} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-slate-500">{course.category?.name}</p>
        <Link href={learnHref} className="mt-1 line-clamp-2 font-semibold hover:text-brand-700">{course.title}</Link>
        <div className="mt-auto pt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-600">
            <span>{item.completed_lessons} / {item.total_lessons} dars</span>
            <span className="font-semibold">{item.progress_percent}%</span>
          </div>
          <ProgressBar value={item.progress_percent} />
          <div className="mt-4 flex gap-2">
            <Link href={learnHref} className="btn-primary flex-1">
              {item.progress_percent === 0 ? "Boshlash" : item.progress_percent === 100 ? "Qayta ko'rish" : "Davom ettirish"}
            </Link>
            {item.certificate_code && (
              <Link href={`/certificates/${item.certificate_code}`} className="btn-secondary" title="Sertifikat">
                <AwardIcon width={18} height={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
