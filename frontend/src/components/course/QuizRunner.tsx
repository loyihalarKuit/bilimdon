"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { AwardIcon, CheckIcon, XIcon } from "@/components/ui/Icons";
import { PageLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { QuizPublic, QuizResult } from "@/lib/types";

export function QuizRunner({ quizId, onSubmitted }: { quizId: number; onSubmitted: () => void }) {
  const [quiz, setQuiz] = useState<QuizPublic | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.learning
      .quiz(quizId)
      .then(setQuiz)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Testni yuklab bo'lmadi"));
  }, [quizId]);

  if (error && !quiz) return <Alert>{error}</Alert>;
  if (!quiz) return <PageLoader />;

  const answeredAll = quiz.questions.every((q) => answers[q.id] !== undefined);
  const resultById = new Map(result?.results.map((r) => [r.question_id, r]));

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.learning.submitQuiz(
        quiz.id,
        Object.entries(answers).map(([question_id, option_id]) => ({ question_id: Number(question_id), option_id })),
      );
      setResult(res);
      onSubmitted();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers({});
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{quiz.title}</h1>
      {quiz.description && <p className="mt-2 text-slate-600">{quiz.description}</p>}
      <p className="mt-1 text-sm text-slate-500">
        {quiz.questions.length} ta savol • o&apos;tish uchun kamida {quiz.pass_score}% kerak
      </p>

      {result && (
        <div
          className={cn(
            "mt-6 rounded-2xl border p-6",
            result.passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
          )}
        >
          <p className="text-sm font-medium text-slate-600">Natijangiz</p>
          <p className={cn("text-4xl font-bold", result.passed ? "text-emerald-700" : "text-amber-700")}>{result.score}%</p>
          <p className="mt-1 text-sm text-slate-700">
            {result.correct_count} / {result.total_count} ta to&apos;g&apos;ri javob.{" "}
            {result.passed ? "Tabriklaymiz, testdan o'tdingiz!" : "Afsuski, o'tish bali yetmadi. Qayta urinib ko'ring."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {!result.passed && (
              <button onClick={retry} className="btn-primary">
                Qayta topshirish
              </button>
            )}
            {result.certificate_code && (
              <Link href={`/certificates/${result.certificate_code}`} className="btn bg-emerald-600 text-white hover:bg-emerald-700">
                <AwardIcon width={18} height={18} /> Sertifikatni olish
              </Link>
            )}
          </div>
        </div>
      )}

      <ol className="mt-8 space-y-6">
        {quiz.questions.map((q, qi) => {
          const r = resultById.get(q.id);
          return (
            <li key={q.id} className="card p-6">
              <p className="font-semibold">
                {qi + 1}. {q.text}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((o) => {
                  const selected = answers[q.id] === o.id;
                  const isCorrect = r && r.correct_option_id === o.id;
                  const isWrongPick = r && selected && !r.is_correct;
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition",
                        !r && selected && "border-brand-500 bg-brand-50",
                        !r && !selected && "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        isCorrect && "border-emerald-400 bg-emerald-50",
                        isWrongPick && "border-red-300 bg-red-50",
                        r && !isCorrect && !isWrongPick && "border-slate-200 opacity-70",
                        r && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="accent-brand-600"
                        checked={selected}
                        disabled={!!r}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      />
                      <span className="flex-1">{o.text}</span>
                      {isCorrect && <CheckIcon width={18} height={18} className="text-emerald-600" />}
                      {isWrongPick && <XIcon width={18} height={18} className="text-red-600" />}
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {Object.keys(answers).length} / {quiz.questions.length} ta savolga javob berildi
          </p>
          <button onClick={submit} disabled={!answeredAll || submitting} className="btn-primary btn-lg">
            {submitting ? "Tekshirilmoqda..." : "Javoblarni yuborish"}
          </button>
        </div>
      )}
      {error && <Alert className="mt-4">{error}</Alert>}
    </div>
  );
}
