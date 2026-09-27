import Link from "next/link";

import { CourseCard } from "@/components/course/CourseCard";
import { ArrowRightIcon, AwardIcon, BarChartIcon, CategoryIcon, PlayIcon, QuizIcon } from "@/components/ui/Icons";
import { serverFetch } from "@/lib/api";
import type { Category, CourseListItem, Page } from "@/lib/types";

const emptyPage: Page<CourseListItem> = { items: [], total: 0, page: 1, size: 8 };

const features = [
  { icon: PlayIcon, title: "Video darslar", text: "Tajribali mutaxassislardan o'zbek tilidagi sifatli video darslar." },
  { icon: QuizIcon, title: "Testlar", text: "Har bir kurs yakunida bilimingizni testlar orqali mustahkamlang." },
  { icon: BarChartIcon, title: "Progress kuzatuvi", text: "Qaysi darslar tugaganini va qancha qolganini doim ko'rib turing." },
  { icon: AwardIcon, title: "Sertifikat", text: "Kursni tugatgach, onlayn tekshiriladigan sertifikat oling." },
];

const steps = [
  { n: "01", title: "Ro'yxatdan o'ting", text: "Ism, email va parol bilan bir daqiqada hisob yarating." },
  { n: "02", title: "Kursni tanlang", text: "O'zingizga kerakli yo'nalishdagi kursga yoziling." },
  { n: "03", title: "O'rganing", text: "Video darslarni ko'ring, testlarni topshiring." },
  { n: "04", title: "Sertifikat oling", text: "Kursni yakunlab, sertifikatingizni yuklab oling." },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    serverFetch<Page<CourseListItem>>("/courses?featured=true&size=8", emptyPage),
    serverFetch<Category[]>("/categories", []),
  ]);
  const totalCourses = categories.reduce((sum, c) => sum + c.course_count, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(96,139,250,0.35),transparent_45%)]" />
        <div className="container-page relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="badge bg-white/10 px-3 py-1 text-brand-100 ring-1 ring-white/20">
              O&apos;zbek tilidagi online ta&apos;lim platformasi
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Kelajak kasbini <span className="text-accent-400">bugun</span> o&apos;rganing
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100">
              Dasturlash, dizayn, marketing va boshqa yo&apos;nalishlar bo&apos;yicha video darslar, amaliy testlar
              va rasmiy sertifikat — barchasi ona tilingizda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn btn-lg bg-white text-brand-800 hover:bg-brand-50">
                Kurslarni ko&apos;rish <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link href="/register" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">
                Bepul boshlash
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                [String(totalCourses || "10+"), "kurslar"],
                [String(categories.length || "6"), "yo'nalish"],
                ["100%", "o'zbek tilida"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-3xl font-bold">{value}</dt>
                  <dd className="text-sm text-brand-200">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-xl">
                  <PlayIcon width={28} height={28} className="ml-1" />
                </span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Python dasturlash asoslari</span>
                  <span className="text-accent-400">67%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div className="h-2 w-2/3 rounded-full bg-accent-400" />
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/15 text-accent-600">
                <AwardIcon />
              </span>
              <div>
                <p className="text-sm font-semibold">Sertifikat berildi</p>
                <p className="text-xs text-slate-500">Kurs muvaffaqiyatli yakunlandi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Afzalliklar */}
      <section className="container-page -mt-10 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kategoriyalar */}
      <section id="kategoriyalar" className="container-page scroll-mt-20 pt-20">
        <SectionHeading title="Kategoriyalar" subtitle="O'zingizga qiziq yo'nalishni tanlang" />
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">Kategoriyalar hozircha mavjud emas.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/courses?category=${c.slug}`}
                className="card group flex items-center gap-4 p-5 transition hover:border-brand-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <CategoryIcon icon={c.icon} width={24} height={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="truncate text-sm text-slate-500">{c.course_count} ta kurs</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Mashhur kurslar */}
      <section className="container-page pt-20">
        <SectionHeading
          title="Mashhur kurslar"
          subtitle="Talabalar eng ko'p tanlayotgan kurslar"
          action={
            <Link href="/courses" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Barchasi <ArrowRightIcon width={16} height={16} />
            </Link>
          }
        />
        {featured.items.length === 0 ? (
          <p className="text-sm text-slate-500">Kurslar tez orada qo&apos;shiladi.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Qanday ishlaydi */}
      <section className="container-page pt-20">
        <SectionHeading title="Qanday ishlaydi?" subtitle="To'rt qadamda yangi bilim" />
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <span className="text-4xl font-extrabold text-brand-200">{s.n}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 to-indigo-700 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-bold">Bugunoq o&apos;rganishni boshlang</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Ro&apos;yxatdan o&apos;tish bepul. Birinchi darsingizni hoziroq ko&apos;ring.
          </p>
          <Link href="/register" className="btn btn-lg mt-8 bg-white text-brand-800 hover:bg-brand-50">
            Bepul ro&apos;yxatdan o&apos;tish
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
