"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CourseForm } from "@/components/admin/CourseForm";
import { LessonsManager } from "@/components/admin/LessonsManager";
import { Alert } from "@/components/ui/Alert";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import type { CourseAdminDetail } from "@/lib/types";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const router = useRouter();
  const [course, setCourse] = useState<CourseAdminDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.admin
      .course(courseId)
      .then(setCourse)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Kursni yuklab bo'lmadi"));
  }, [courseId]);

  useEffect(load, [load]);

  if (error) return <Alert>{error}</Alert>;
  if (!course) return <PageLoader />;

  const remove = async () => {
    if (!confirm(`"${course.title}" kursini butunlay o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    await api.admin.deleteCourse(course.id);
    router.push("/admin");
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Kurslar</Link>
          <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/learn/${course.slug}`} className="btn-secondary">Ko&apos;rish</Link>
          <button onClick={remove} className="btn-danger">O&apos;chirish</button>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Asosiy ma&apos;lumotlar</h2>
        <CourseForm
          key={course.updated_at}
          initial={{
            title: course.title,
            short_description: course.short_description,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            price: course.price,
            category_id: course.category?.id ?? null,
            is_published: course.is_published,
            is_featured: course.is_featured,
          }}
          submitLabel="O'zgarishlarni saqlash"
          onSubmit={async (data) => {
            setCourse(await api.admin.updateCourse(course.id, data));
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Darslar ({course.lessons.length})</h2>
        <LessonsManager courseId={course.id} lessons={course.lessons} onChange={load} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Testlar ({course.quizzes.length})</h2>
          <Link href={`/admin/courses/${course.id}/quizzes/new`} className="btn-primary">+ Test qo&apos;shish</Link>
        </div>
        {course.quizzes.length === 0 ? (
          <p className="card p-6 text-sm text-slate-500">
            Hali test yo&apos;q. Sertifikat berish uchun kamida bitta yakuniy test qo&apos;shish tavsiya etiladi.
          </p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {course.quizzes.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{q.title}</p>
                  <p className="text-xs text-slate-500">{q.question_count} ta savol • o&apos;tish bali {q.pass_score}%</p>
                </div>
                <Link href={`/admin/courses/${course.id}/quizzes/${q.id}`} className="btn-secondary">Tahrirlash</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
