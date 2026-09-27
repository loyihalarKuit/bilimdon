import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseThumb } from "@/components/course/CourseThumb";
import { EnrollPanel } from "@/components/course/EnrollPanel";
import { AwardIcon, BookIcon, ClockIcon, PlayIcon, QuizIcon, UsersIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import { formatDuration, levelLabels } from "@/lib/format";
import type { CourseDetail } from "@/lib/types";

async function getCourse(slug: string) {
  return serverFetch<CourseDetail | null>(`/courses/${encodeURIComponent(slug)}`, null, 60);
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: course.title, description: course.short_description } : { title: "Kurs topilmadi" };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap gap-2">
              {course.category && <span className="badge bg-brand-500/20 text-brand-200">{course.category.name}</span>}
              <span className="badge bg-white/10 text-slate-200">{levelLabels[course.level]}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
            <p className="mt-4 text-lg text-slate-300">{course.short_description}</p>
            {course.instructor && (
              <p className="mt-4 text-sm text-slate-400">
                O&apos;qituvchi: <span className="font-medium text-white">{course.instructor.full_name}</span>
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><BookIcon width={16} height={16} />{course.lesson_count} ta dars</span>
              <span className="flex items-center gap-1.5"><ClockIcon width={16} height={16} />{formatDuration(course.total_minutes)}</span>
              <span className="flex items-center gap-1.5"><QuizIcon width={16} height={16} />{course.quizzes.length} ta test</span>
              <span className="flex items-center gap-1.5"><UsersIcon width={16} height={16} />{course.student_count} talaba</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="order-2 space-y-10 lg:order-1">
          <section>
            <h2 className="text-xl font-bold">Kurs haqida</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-700">
              {course.description || course.short_description}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Kurs dasturi</h2>
            <p className="mt-1 text-sm text-slate-500">
              {course.lesson_count} ta dars • {formatDuration(course.total_minutes)}
            </p>
            <ol className="card mt-4 divide-y divide-slate-100">
              {course.lessons.map((lesson, i) => (
                <li key={lesson.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    {lesson.is_preview && <span className="text-xs font-medium text-accent-600">Bepul ko&apos;rish mumkin</span>}
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-slate-500">
                    <PlayIcon width={14} height={14} /> {lesson.duration_minutes} daq
                  </span>
                </li>
              ))}
              {course.quizzes.map((quiz) => (
                <li key={`q-${quiz.id}`} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <QuizIcon width={16} height={16} />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {quiz.question_count} ta savol • o&apos;tish bali {quiz.pass_score}%
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card flex items-start gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600">
              <AwardIcon />
            </span>
            <div>
              <h3 className="font-semibold">Kurs yakunida sertifikat</h3>
              <p className="mt-1 text-sm text-slate-600">
                Barcha darslarni tugatib, testlardan o&apos;tsangiz, noyob raqamli va onlayn tekshiriladigan sertifikat
                olasiz.
              </p>
            </div>
          </section>
        </div>

        <aside className="order-1 lg:order-2 lg:-mt-64">
          <div className="card sticky top-24 overflow-hidden">
            <CourseThumb id={course.id} title={course.title} url={course.thumbnail_url} icon={course.category?.icon} />
            <EnrollPanel course={course} />
          </div>
        </aside>
      </div>
    </>
  );
}
