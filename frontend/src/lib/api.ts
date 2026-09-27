import type {
  AdminStats,
  Category,
  Certificate,
  CourseAdminDetail,
  CourseDetail,
  CourseListItem,
  CourseProgress,
  DashboardStats,
  Lesson,
  MyCourse,
  Page,
  QuizAdmin,
  QuizPublic,
  QuizResult,
  TokenResponse,
  User,
  UserRole,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "bilimdon_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private rejimda localStorage yopiq bo'lishi mumkin */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* e'tiborsiz */
    }
  },
};

function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: string[] };
    const field = first.loc?.[first.loc.length - 1];
    return field ? `${field}: ${first.msg}` : (first.msg ?? "Ma'lumotlar noto'g'ri");
  }
  if (status >= 500) return "Serverda xatolik yuz berdi. Keyinroq urinib ko'ring.";
  return "So'rovni bajarib bo'lmadi";
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function request<T>(path: string, { body, auth = true, headers, ...init }: RequestOptions = {}): Promise<T> {
  const token = auth ? tokenStorage.get() : null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStorage.clear();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(res.status, errorMessage(data, res.status));
  }
  return data as T;
}

/** Server komponentlar uchun: xatolikda `fallback` qaytaradi, sahifa yiqilmaydi. */
export async function serverFetch<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${process.env.API_URL_INTERNAL ?? API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const api = {
  auth: {
    register: (data: { full_name: string; email: string; password: string }) =>
      request<TokenResponse>("/auth/register", { method: "POST", body: data, auth: false }),
    login: (data: { email: string; password: string }) =>
      request<TokenResponse>("/auth/login", { method: "POST", body: data, auth: false }),
    me: () => request<User>("/auth/me"),
  },
  users: {
    updateMe: (data: { full_name: string }) => request<User>("/users/me", { method: "PATCH", body: data }),
    changePassword: (data: { current_password: string; new_password: string }) =>
      request<{ detail: string }>("/users/me/password", { method: "POST", body: data }),
  },
  courses: {
    get: (slug: string) => request<CourseDetail>(`/courses/${slug}`),
    enroll: (slug: string) => request<CourseProgress>(`/courses/${slug}/enroll`, { method: "POST" }),
    progress: (slug: string) => request<CourseProgress>(`/courses/${slug}/progress`),
    lesson: (slug: string, lessonId: number) => request<Lesson>(`/courses/${slug}/lessons/${lessonId}`),
  },
  learning: {
    completeLesson: (id: number) => request<CourseProgress>(`/lessons/${id}/complete`, { method: "POST" }),
    uncompleteLesson: (id: number) => request<CourseProgress>(`/lessons/${id}/complete`, { method: "DELETE" }),
    quiz: (id: number) => request<QuizPublic>(`/quizzes/${id}`),
    submitQuiz: (id: number, answers: { question_id: number; option_id: number }[]) =>
      request<QuizResult>(`/quizzes/${id}/submit`, { method: "POST", body: { answers } }),
  },
  me: {
    courses: () => request<MyCourse[]>("/me/courses"),
    dashboard: () => request<DashboardStats>("/me/dashboard"),
    certificates: () => request<Certificate[]>("/me/certificates"),
  },
  certificates: {
    verify: (code: string) => request<Certificate>(`/certificates/${encodeURIComponent(code)}`, { auth: false }),
  },
  admin: {
    stats: () => request<AdminStats>("/admin/stats"),
    courses: (params: { search?: string; page?: number } = {}) =>
      request<Page<CourseListItem>>(`/admin/courses${qs({ ...params, size: 50 })}`),
    course: (id: number) => request<CourseAdminDetail>(`/admin/courses/${id}`),
    createCourse: (data: CourseInput) => request<CourseAdminDetail>("/admin/courses", { method: "POST", body: data }),
    updateCourse: (id: number, data: Partial<CourseInput>) =>
      request<CourseAdminDetail>(`/admin/courses/${id}`, { method: "PATCH", body: data }),
    deleteCourse: (id: number) => request<void>(`/admin/courses/${id}`, { method: "DELETE" }),
    createLesson: (courseId: number, data: LessonInput) =>
      request<Lesson>(`/admin/courses/${courseId}/lessons`, { method: "POST", body: data }),
    updateLesson: (id: number, data: Partial<LessonInput>) =>
      request<Lesson>(`/admin/lessons/${id}`, { method: "PATCH", body: data }),
    deleteLesson: (id: number) => request<void>(`/admin/lessons/${id}`, { method: "DELETE" }),
    quiz: (id: number) => request<QuizAdmin>(`/admin/quizzes/${id}`),
    createQuiz: (courseId: number, data: QuizInput) =>
      request<QuizAdmin>(`/admin/courses/${courseId}/quizzes`, { method: "POST", body: data }),
    updateQuiz: (id: number, data: QuizInput) => request<QuizAdmin>(`/admin/quizzes/${id}`, { method: "PUT", body: data }),
    deleteQuiz: (id: number) => request<void>(`/admin/quizzes/${id}`, { method: "DELETE" }),
    categories: () => request<Category[]>("/admin/categories"),
    createCategory: (data: { name: string; description?: string; icon?: string }) =>
      request<Category>("/admin/categories", { method: "POST", body: data }),
    deleteCategory: (id: number) => request<void>(`/admin/categories/${id}`, { method: "DELETE" }),
    users: (params: { search?: string; page?: number } = {}) =>
      request<Page<User>>(`/admin/users${qs({ ...params, size: 50 })}`),
    setRole: (id: number, role: UserRole) =>
      request<User>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  },
};

export interface CourseInput {
  title: string;
  short_description: string;
  description: string;
  thumbnail_url: string | null;
  level: string;
  price: number;
  category_id: number | null;
  is_published: boolean;
  is_featured: boolean;
}

export interface LessonInput {
  title: string;
  content: string;
  video_url: string | null;
  duration_minutes: number;
  position?: number | null;
  is_preview: boolean;
}

export interface QuizInput {
  title: string;
  description: string;
  pass_score: number;
  lesson_id: number | null;
  questions: { text: string; options: { text: string; is_correct: boolean }[] }[];
}
