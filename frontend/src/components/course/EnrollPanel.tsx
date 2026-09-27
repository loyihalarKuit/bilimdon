"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { CheckIcon } from "@/components/ui/Icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { CourseDetail, CourseProgress } from "@/lib/types";

export function EnrollPanel({ course }: { course: CourseDetail }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Progress qaysi foydalanuvchi uchun yuklanganini ham saqlaymiz
  const [loaded, setLoaded] = useState<{ userId: number; progress: CourseProgress | null } | null>(null);
  const checking = !!user && loaded?.userId !== user.id;
  const progress = user && loaded?.userId === user.id ? loaded.progress : null;
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.courses
      .progress(course.slug)
      .catch(() => null)
      .then((p) => setLoaded({ userId: user.id, progress: p }));
  }, [user, course.slug]);

  const enroll = async () => {
    if (!user) {
      router.push(`/login?next=/courses/${course.slug}`);
      return;
    }
    setEnrolling(true);
    setError("");
    try {
      await api.courses.enroll(course.slug);
      router.push(`/learn/${course.slug}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Xatolik yuz berdi");
      setEnrolling(false);
    }
  };

  const preview = course.lessons.find((l) => l.is_preview);

  return (
    <div className="p-6">
      <p className="text-3xl font-bold">{formatPrice(course.price)}</p>

      {loading || checking ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : progress?.is_enrolled ? (
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">Sizning progressingiz</span>
              <span className="font-semibold">{progress.progress_percent}%</span>
            </div>
            <ProgressBar value={progress.progress_percent} />
          </div>
          <Link href={`/learn/${course.slug}`} className="btn-primary btn-lg w-full">
            {progress.progress_percent > 0 ? "O'qishni davom ettirish" : "O'qishni boshlash"}
          </Link>
          {progress.certificate_code && (
            <Link href={`/certificates/${progress.certificate_code}`} className="btn-secondary w-full">
              Sertifikatni ko&apos;rish
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {error && <Alert>{error}</Alert>}
          <button onClick={enroll} disabled={enrolling} className="btn-primary btn-lg w-full">
            {enrolling ? "Yozilmoqda..." : "Kursga yozilish"}
          </button>
          {preview && (
            <Link href={`/learn/${course.slug}?lesson=${preview.id}`} className="btn-secondary w-full">
              Bepul darsni ko&apos;rish
            </Link>
          )}
        </div>
      )}

      <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
        {[
          `${course.lesson_count} ta video dars`,
          `${course.quizzes.length} ta test`,
          "Progressni kuzatish",
          "Yakunda sertifikat",
          "Umrbod kirish imkoniyati",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckIcon width={16} height={16} className="text-accent-600" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
