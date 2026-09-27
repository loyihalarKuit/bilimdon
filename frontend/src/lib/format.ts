import type { CourseLevel, UserRole } from "./types";

export const levelLabels: Record<CourseLevel, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
};

export const roleLabels: Record<UserRole, string> = {
  student: "Talaba",
  instructor: "O'qituvchi",
  admin: "Administrator",
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} soat ${m} daq` : `${h} soat`;
}

const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatPrice(price: number): string {
  return price === 0 ? "Bepul" : `${price.toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
