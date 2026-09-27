# Bilimdon — o'zbek tilidagi online ta'lim platformasi (MVP)

Coursera uslubidagi kichik platforma: video darslar, testlar, progress kuzatuvi va kurs yakunida onlayn tekshiriladigan sertifikat.

| Qism | Texnologiya |
|------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4 |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic |
| Ma'lumotlar bazasi | PostgreSQL 16 |
| Autentifikatsiya | JWT (Bearer token), bcrypt |
| Deploy | Frontend → Vercel, Backend → VPS (Docker) |

## Imkoniyatlar

**Talaba uchun**
- Bosh sahifa: platforma haqida, kategoriyalar, mashhur kurslar, "Kurslarni ko'rish", Login/Register
- Ro'yxatdan o'tish (ism, email, parol), kirish, chiqish — JWT
- Kurslar katalogi: qidiruv, kategoriya va daraja bo'yicha filtr, sahifalash
- Kurs sahifasi: tavsif, dasturi, bepul tanishuv darsi, kursga yozilish
- O'quv rejimi: video pleer (YouTube / Vimeo / .mp4), darslar ro'yxati, "Darsni tugatdim", keyingi/oldingi dars
- Testlar: javoblarni tekshirish, to'g'ri/noto'g'ri ko'rsatish, qayta topshirish, o'tish bali
- Shaxsiy kabinet: mening kurslarim, progress, statistika, sertifikatlar
- Sertifikat: kurs to'liq tugagach avtomatik beriladi, noyob raqam, PDF sifatida chop etish, ochiq tekshirish sahifasi
- Profil: ismni o'zgartirish (sertifikatda shu ism chiqadi), parolni almashtirish

**O'qituvchi / administrator uchun** (`/admin`)
- Kurs yaratish, tahrirlash, nashr qilish, "mashhur" deb belgilash, o'chirish
- Darslarni qo'shish/tahrirlash (video havola, konspekt, davomiylik, tartib, bepul dars)
- Test yaratish: savollar, variantlar, to'g'ri javob, o'tish bali
- Kategoriyalar va foydalanuvchi rollarini boshqarish (faqat admin)
- O'qituvchi faqat o'z kurslarini boshqaradi, admin — hammasini

**Kurs tugashi qoidasi:** barcha darslar "tugatildi" deb belgilangan **va** kursdagi barcha testlardan o'tilgan bo'lsa → sertifikat avtomatik yaratiladi. Progress = (tugatilgan darslar + o'tilgan testlar) / (jami darslar + jami testlar).

## Loyiha tuzilmasi

```
backend/
  app/
    core/        # sozlamalar, DB ulanishi, JWT va parol xeshlash
    models/      # SQLAlchemy modellari (user, course, lesson, quiz, enrollment, certificate...)
    schemas/     # Pydantic so'rov/javob sxemalari
    services/    # biznes-logika (progress, sertifikat, test baholash, slug)
    api/v1/endpoints/  # auth, courses, learning, me, certificates, admin
  alembic/       # DB migratsiyalari
  scripts/seed.py  # demo ma'lumotlar
  tests/         # pytest (SQLite'da ishlaydi)
frontend/
  src/app/       # sahifalar (App Router)
  src/components/  # UI, layout, kurs, auth, admin komponentlari
  src/lib/       # API klient, tiplar, formatlash
```

## Lokal ishga tushirish

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # DATABASE_URL va JWT_SECRET_KEY ni sozlang

# PostgreSQL kerak. Eng osoni — Docker:
docker compose up -d db          # (loyiha ildizidan)

alembic upgrade head             # jadvallarni yaratish
python -m scripts.seed           # demo kurslar va foydalanuvchilar
uvicorn app.main:app --reload    # http://localhost:8000/docs
```

Testlar: `pytest`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev                      # http://localhost:3000
```

### Demo hisoblar (seed'dan keyin)

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | admin@bilimdon.uz | Admin12345 |
| O'qituvchi | teacher@bilimdon.uz | Teacher12345 |
| Talaba | student@bilimdon.uz | Student12345 |

> Seed'dagi videolar ochiq litsenziyali namunalar — o'z darslaringiz havolalari bilan almashtiring.

## Deploy

### Backend (VPS)

```bash
git clone <repo> && cd <repo>
cp backend/.env.example backend/.env
# backend/.env da: ENVIRONMENT=production, uzun JWT_SECRET_KEY,
# CORS_ORIGINS=https://sizning-domen.uz (Vercel manzili ham)
export POSTGRES_PASSWORD=<kuchli-parol>
docker compose up -d --build
docker compose exec backend python -m scripts.seed   # ixtiyoriy
```

Konteyner ishga tushganda `alembic upgrade head` avtomatik bajariladi. Oldiga Nginx/Caddy qo'yib HTTPS yoqing (`api.domen.uz → localhost:8000`). Productionda `/docs` o'chiriladi, zaif `JWT_SECRET_KEY` bilan ilova ishga tushmaydi.

### Frontend (Vercel)

1. Vercel'da yangi loyiha → repo → **Root Directory: `frontend`**
2. Environment variable: `NEXT_PUBLIC_API_URL=https://api.domen.uz/api/v1`
3. Deploy

## API qisqacha

| Metod | Yo'l | Tavsif |
|-------|------|--------|
| POST | `/api/v1/auth/register`, `/auth/login` | Ro'yxatdan o'tish / kirish → JWT |
| GET | `/api/v1/auth/me` | Joriy foydalanuvchi |
| GET | `/api/v1/courses`, `/courses/{slug}` | Katalog va kurs |
| POST | `/api/v1/courses/{slug}/enroll` | Kursga yozilish |
| GET | `/api/v1/courses/{slug}/lessons/{id}` | Dars (yozilganlar yoki bepul dars) |
| POST/DELETE | `/api/v1/lessons/{id}/complete` | Darsni tugatish / bekor qilish |
| GET/POST | `/api/v1/quizzes/{id}`, `/quizzes/{id}/submit` | Test olish / topshirish |
| GET | `/api/v1/me/courses`, `/me/dashboard`, `/me/certificates` | Kabinet |
| GET | `/api/v1/certificates/{code}` | Sertifikatni ochiq tekshirish |
| * | `/api/v1/admin/...` | Kurs, dars, test, kategoriya, foydalanuvchi boshqaruvi |

To'liq hujjat: `http://localhost:8000/docs` (Swagger).

## Kelajakda kengaytirish uchun g'oyalar

- To'lov tizimi (Payme, Click) — `Course.price` maydoni tayyor
- Modullar (bo'limlar), topshiriqlar, izohlar va reyting
- Refresh token va httpOnly cookie, email tasdiqlash, parolni tiklash
- Video fayllarni S3/CDN'ga yuklash, HLS stream
- Server tomonda PDF sertifikat generatsiyasi, QR kod
- Rus/ingliz tillari (i18n), mobil ilova
