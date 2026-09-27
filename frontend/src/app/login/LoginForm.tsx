"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { ApiError } from "@/lib/api";
import { safeNext } from "@/lib/url";

export function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirishda xatolik");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Xush kelibsiz!"
      subtitle="Hisobingizga kiring va o'qishni davom ettiring"
      footer={
        <>
          Hisobingiz yo&apos;qmi?{" "}
          <Link href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="siz@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Parol</label>
          <input id="password" type="password" required autoComplete="current-password" className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
          {submitting ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </AuthCard>
  );
}
