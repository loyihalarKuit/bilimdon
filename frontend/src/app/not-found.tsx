import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold">Sahifa topilmadi</h1>
      <p className="mt-2 text-slate-600">Siz qidirgan sahifa mavjud emas yoki o&apos;chirilgan.</p>
      <Link href="/" className="btn-primary mt-8">Bosh sahifaga qaytish</Link>
    </div>
  );
}
