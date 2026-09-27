"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { ApiError } from "@/lib/api";
import { safeNext } from "@/lib/url";

export function RegisterForm() {
  const { register, user } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
    if (form.password !== form.confirm) return setError("Parollar mos kelmadi");
    setSubmitting(true);
    try {
      await register(form.full_name, form.email, form.password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ro'yxatdan o'tishda xatolik");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Hisob yaratish"
      subtitle="Bepul ro'yxatdan o'ting va o'qishni boshlang"
      footer={
        <>
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">Kirish</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div>
          <label htmlFor="full_name" className="label">Ism va familiya</label>
          <input id="full_name" required minLength={2} autoComplete="name" className="input"
            value={form.full_name} onChange={update("full_name")} placeholder="Ism Familiya" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input"
            value={form.email} onChange={update("email")} placeholder="siz@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Parol</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input"
            value={form.password} onChange={update("password")} placeholder="Kamida 8 ta belgi" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Parolni tasdiqlang</label>
          <input id="confirm" type="password" required autoComplete="new-password" className="input"
            value={form.confirm} onChange={update("confirm")} />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
          {submitting ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
        </button>
      </form>
    </AuthCard>
  );
}
