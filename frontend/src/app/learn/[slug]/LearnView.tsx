"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { QuizRunner } from "@/components/course/QuizRunner";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { Alert } from "@/components/ui/Alert";
import { AwardIcon, CheckIcon, ChevronLeftIcon, LockIcon, MenuIcon, PlayIcon, QuizIcon, XIcon } from "@/components/ui/Icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { CourseDetail, CourseProgress, Lesson } from "@/lib/types";

export function LearnView({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const lessonParam = Number(params.get("lesson")) || null;
  const quizParam = Number(params.get("quiz")) || null;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [lessonState, setLessonState] = useState<{ id: number; lesson: Lesson | null; error: string } | null>(null);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const canAccessAll =
    !!progress?.is_enrolled || (!!user && !!course && (user.role === "admin" || course.instructor?.id === user.id));

  const refreshProgress = useCallback(() => {
    if (!user) return;
    api.courses.progress(slug).then(setProgress).catch(() => undefined);
  }, [slug, user]);

  // Kurs va progressni yuklash
  useEffect(() => {
    if (authLoading) return;
    Promise.all([api.courses.get(slug), user ? api.courses.progress(slug).catch(() => null) : Promise.resolve(null)])
      .then(([c, p]) => {
        setCourse(c);
        setProgress(p);
      })
      .catch((e) => setPageError(e instanceof ApiError ? e.message : "Kursni yuklab bo'lmadi"));
  }, [slug, user, authLoading]);

  // Tanlangan element yo'q bo'lsa — keyingi tugallanmagan darsga o'tamiz
  const activeLessonId =
    quizParam !== null
      ? null
      : (lessonParam ?? progress?.next_lesson_id ?? course?.lessons[0]?.id ?? null);

  useEffect(() => {
    if (!course || activeLessonId === null) return;
    api.courses
      .lesson(slug, activeLessonId)
      .then((lesson) => setLessonState({ id: activeLessonId, lesson, error: "" }))
      .catch((e) =>
        setLessonState({
          id: activeLessonId,
          lesson: null,
          error: e instanceof ApiError ? e.message : "Darsni yuklab bo'lmadi",
        }),
      );
  }, [course, slug, activeLessonId, progress?.is_enrolled]);
  const current = lessonState?.id === activeLessonId ? lessonState : null;
  const lesson = current?.lesson ?? null;
  const lessonError = current?.error ?? "";

  const go = (query: string) => {
    setSidebarOpen(false);
    router.push(`/learn/${slug}?${query}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  if (pageError) {
    return (
      <div className="container-page py-20">
        <Alert>{pageError}</Alert>
        <Link href="/courses" className="btn-secondary mt-4">Kurslarga qaytish</Link>
      </div>
    );
  }
  if (!course || authLoading) return <PageLoader />;

  const completed = new Set(progress?.completed_lesson_ids ?? []);
  const lessonIndex = course.lessons.findIndex((l) => l.id === activeLessonId);
  const nextLesson = lessonIndex >= 0 ? course.lessons[lessonIndex + 1] : undefined;
  const firstQuiz = course.quizzes[0];

  const toggleComplete = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      const updated = completed.has(lesson.id)
        ? await api.learning.uncompleteLesson(lesson.id)
        : await api.learning.completeLesson(lesson.id);
      setProgress(updated);
      if (!completed.has(lesson.id)) {
        if (nextLesson) go(`lesson=${nextLesson.id}`);
        else if (firstQuiz) go(`quiz=${firstQuiz.id}`);
        else go(`lesson=${lesson.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const enroll = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/learn/${slug}`)}`);
      return;
    }
    setProgress(await api.courses.enroll(slug));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Yuqori panel */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white">
        <Link href={`/courses/${slug}`} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white">
          <ChevronLeftIcon width={18} height={18} />
          <span className="hidden sm:inline">Kursga qaytish</span>
        </Link>
        <span className="h-5 w-px bg-slate-700" />
        <h1 className="flex-1 truncate text-sm font-semibold">{course.title}</h1>
        {progress?.is_enrolled && (
          <div className="hidden w-48 items-center gap-2 sm:flex">
            <ProgressBar value={progress.progress_percent} className="bg-slate-700" />
            <span className="text-xs text-slate-300">{progress.progress_percent}%</span>
          </div>
        )}
        {progress?.certificate_code && (
          <Link href={`/certificates/${progress.certificate_code}`} className="hidden items-center gap-1 text-sm text-accent-400 md:flex">
            <AwardIcon width={16} height={16} /> Sertifikat
          </Link>
        )}
        <button className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)} aria-label="Darslar ro'yxati">
          {sidebarOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </header>

      <div className="flex flex-1">
        {/* Asosiy qism */}
        <main className="min-w-0 flex-1">
          {quizParam !== null ? (
            <div className="px-4 py-8 sm:px-8">
              {canAccessAll ? (
                <QuizRunner key={quizParam} quizId={quizParam} onSubmitted={refreshProgress} />
              ) : (
                <LockedNotice onEnroll={enroll} />
              )}
            </div>
          ) : (
            <>
              <div className="bg-black">
                <div className="mx-auto max-w-5xl">
                  {lesson ? (
                    <VideoPlayer url={lesson.video_url} title={lesson.title} />
                  ) : lessonError ? (
                    <div className="flex aspect-video items-center justify-center text-slate-400">
                      <LockIcon width={40} height={40} />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center"><Spinner /></div>
                  )}
                </div>
              </div>

              <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
                {lessonError ? (
                  <LockedNotice message={lessonError} onEnroll={enroll} />
                ) : lesson ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          {lessonIndex + 1}-dars / {course.lessons.length}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
                      </div>
                      {progress?.is_enrolled && (
                        <button
                          onClick={toggleComplete}
                          disabled={saving}
                          className={completed.has(lesson.id) ? "btn-secondary" : "btn-primary"}
                        >
                          <CheckIcon width={16} height={16} />
                          {completed.has(lesson.id) ? "Tugallangan" : "Darsni tugatdim"}
                        </button>
                      )}
                    </div>
                    {lesson.content && (
                      <div className="mt-6 leading-relaxed whitespace-pre-line text-slate-700">{lesson.content}</div>
                    )}
                    {!progress?.is_enrolled && (
                      <Alert type="info" className="mt-6">
                        Bu bepul tanishuv darsi. Barcha darslar, testlar va sertifikat uchun{" "}
                        <button onClick={enroll} className="font-semibold underline">kursga yoziling</button>.
                      </Alert>
                    )}
                    <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
                      {lessonIndex > 0 ? (
                        <button onClick={() => go(`lesson=${course.lessons[lessonIndex - 1].id}`)} className="btn-secondary">
                          Oldingi dars
                        </button>
                      ) : <span />}
                      {nextLesson ? (
                        <button onClick={() => go(`lesson=${nextLesson.id}`)} className="btn-secondary">
                          Keyingi dars
                        </button>
                      ) : firstQuiz ? (
                        <button onClick={() => go(`quiz=${firstQuiz.id}`)} className="btn-secondary">
                          Testga o&apos;tish
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </main>

        {/* Darslar ro'yxati */}
        <aside
          className={cn(
            "fixed inset-y-14 right-0 z-20 w-80 overflow-y-auto border-l border-slate-200 bg-white transition-transform lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0",
            sidebarOpen ? "translate-x-0 shadow-xl" : "translate-x-full",
          )}
        >
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold">Kurs mazmuni</h2>
            {progress?.is_enrolled ? (
              <p className="mt-1 text-xs text-slate-500">
                {completed.size} / {course.lessons.length} dars tugallandi
              </p>
            ) : (
              <button onClick={enroll} className="btn-primary mt-3 w-full">Kursga yozilish</button>
            )}
          </div>
          <ul>
            {course.lessons.map((l, i) => {
              const active = l.id === activeLessonId;
              const locked = !canAccessAll && !l.is_preview;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => go(`lesson=${l.id}`)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50",
                      active && "bg-brand-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                        completed.has(l.id) ? "border-accent-500 bg-accent-500 text-white" : "border-slate-300 text-slate-500",
                      )}
                    >
                      {completed.has(l.id) ? <CheckIcon width={12} height={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="flex-1">
                      <span className={cn("block", active && "font-semibold text-brand-800")}>{l.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <PlayIcon width={11} height={11} /> {l.duration_minutes} daq
                      </span>
                    </span>
                    {locked && <LockIcon width={14} height={14} className="mt-1 text-slate-400" />}
                  </button>
                </li>
              );
            })}
            {course.quizzes.map((q) => {
              const qp = progress?.quizzes.find((x) => x.quiz_id === q.id);
              return (
                <li key={`q-${q.id}`}>
                  <button
                    onClick={() => go(`quiz=${q.id}`)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50",
                      quizParam === q.id && "bg-brand-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        qp?.passed ? "bg-accent-500 text-white" : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {qp?.passed ? <CheckIcon width={12} height={12} strokeWidth={3} /> : <QuizIcon width={12} height={12} />}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{q.title}</span>
                      <span className="text-xs text-slate-500">
                        {qp?.best_score != null ? `Eng yaxshi natija: ${qp.best_score}%` : `${q.question_count} ta savol`}
                      </span>
                    </span>
                    {!canAccessAll && <LockIcon width={14} height={14} className="mt-1 text-slate-400" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function LockedNotice({ message, onEnroll }: { message?: string; onEnroll: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <LockIcon />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Bu kontent yopiq</h2>
      <p className="mt-2 text-sm text-slate-600">{message ?? "Testni topshirish uchun kursga yoziling."}</p>
      <button onClick={onEnroll} className="btn-primary mt-6">Kursga yozilish</button>
    </div>
  );
}
