import Link from "next/link";

import { BookIcon, ClockIcon, UsersIcon } from "@/components/ui/Icons";
import { formatDuration, formatPrice, levelLabels } from "@/lib/format";
import type { CourseListItem } from "@/lib/types";

import { CourseThumb } from "./CourseThumb";

export function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <CourseThumb id={course.id} title={course.title} url={course.thumbnail_url} icon={course.category?.icon} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          {course.category && <span className="badge bg-brand-50 text-brand-700">{course.category.name}</span>}
          <span className="badge bg-slate-100 text-slate-600">{levelLabels[course.level]}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-700">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{course.short_description}</p>
        {course.instructor && <p className="mt-3 text-xs text-slate-500">{course.instructor.full_name}</p>}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><BookIcon width={14} height={14} />{course.lesson_count} dars</span>
            <span className="flex items-center gap-1"><ClockIcon width={14} height={14} />{formatDuration(course.total_minutes)}</span>
            <span className="flex items-center gap-1"><UsersIcon width={14} height={14} />{course.student_count}</span>
          </div>
          <span className="font-semibold text-accent-600">{formatPrice(course.price)}</span>
        </div>
      </div>
    </Link>
  );
}
