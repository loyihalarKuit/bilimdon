"use client";

import { useRouter } from "next/navigation";

import { CourseForm } from "@/components/admin/CourseForm";
import { api } from "@/lib/api";

export default function NewCoursePage() {
  const router = useRouter();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yangi kurs</h1>
      <CourseForm
        submitLabel="Kursni yaratish"
        onSubmit={async (data) => {
          const course = await api.admin.createCourse(data);
          router.push(`/admin/courses/${course.id}`);
        }}
      />
    </div>
  );
}
