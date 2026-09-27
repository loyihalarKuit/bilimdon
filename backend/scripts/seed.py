"""Demo ma'lumotlar bilan bazani to'ldiradi.

Ishga tushirish:  python -m scripts.seed
Qayta ishga tushirilsa mavjud yozuvlarni takrorlamaydi.
"""

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import AnswerOption, Category, Course, CourseLevel, Lesson, Question, Quiz, User, UserRole
from app.services.slug import slugify

# Demo videolar (ochiq litsenziyali). Real kurslarda o'z videolaringiz havolasini qo'ying:
# YouTube, Vimeo yoki to'g'ridan-to'g'ri .mp4 havola qo'llab-quvvatlanadi.
DEMO_VIDEOS = [
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
]

CATEGORIES = [
    ("Dasturlash", "code", "Python, JavaScript, veb va mobil dasturlash"),
    ("Dizayn", "palette", "UI/UX, grafik dizayn va Figma"),
    ("Biznes va marketing", "briefcase", "Tadbirkorlik, SMM va raqamli marketing"),
    ("Ma'lumotlar tahlili", "chart", "Excel, SQL va ma'lumotlar bilan ishlash"),
    ("Xorijiy tillar", "globe", "Ingliz, rus va boshqa tillar"),
    ("Shaxsiy rivojlanish", "sparkles", "Vaqtni boshqarish, muloqot va yetakchilik"),
]

COURSES = [
    {
        "title": "Python dasturlash asoslari",
        "category": "Dasturlash",
        "level": CourseLevel.BEGINNER,
        "featured": True,
        "short": "Noldan boshlab Python tilini o'rganing: o'zgaruvchilar, shartlar, sikllar va funksiyalar.",
        "description": (
            "Bu kurs dasturlashni hech qachon o'rganmaganlar uchun mo'ljallangan. "
            "Kurs davomida Python tilining asosiy tushunchalarini amaliy misollar orqali o'rganasiz "
            "va kurs oxirida o'zingizning kichik loyihangizni yozasiz."
        ),
        "lessons": [
            ("Python nima va nima uchun uni o'rganish kerak?", 8, True),
            ("Python va VS Code o'rnatish", 12, False),
            ("O'zgaruvchilar va ma'lumot turlari", 15, False),
            ("Shartli operatorlar: if, elif, else", 14, False),
            ("Sikllar: for va while", 16, False),
            ("Funksiyalar", 18, False),
        ],
        "quiz": (
            "Python asoslari bo'yicha yakuniy test",
            [
                ("Python'da ekranga matn chiqarish uchun qaysi funksiya ishlatiladi?",
                 ["print()", "echo()", "console.log()", "write()"], 0),
                ("Quyidagilardan qaysi biri ro'yxat (list) hisoblanadi?",
                 ["(1, 2, 3)", "[1, 2, 3]", "{1, 2, 3}", "<1, 2, 3>"], 1),
                ("Funksiya qaysi kalit so'z bilan e'lon qilinadi?",
                 ["function", "func", "def", "lambda"], 2),
                ("range(3) qanday qiymatlarni beradi?",
                 ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3"], 1),
            ],
        ),
    },
    {
        "title": "Zamonaviy veb-sayt yaratish: HTML va CSS",
        "category": "Dasturlash",
        "level": CourseLevel.BEGINNER,
        "featured": True,
        "short": "HTML va CSS yordamida chiroyli va moslashuvchan veb-sahifalar yaratishni o'rganing.",
        "description": "Kurs yakunida o'zingizning shaxsiy portfolio saytingizni yaratib, internetga joylaysiz.",
        "lessons": [
            ("Veb qanday ishlaydi?", 10, True),
            ("HTML teglari va sahifa tuzilishi", 17, False),
            ("CSS asoslari: selektorlar va ranglar", 15, False),
            ("Flexbox va Grid", 20, False),
            ("Moslashuvchan (responsive) dizayn", 18, False),
        ],
        "quiz": (
            "HTML va CSS testi",
            [
                ("HTML'da eng katta sarlavha tegi qaysi?", ["<h6>", "<head>", "<h1>", "<title>"], 2),
                ("CSS'da matn rangini o'zgartiruvchi xususiyat?", ["font-color", "color", "text-color", "background"], 1),
                ("Flexbox'ni yoqish uchun nima yoziladi?",
                 ["display: flex", "flex: on", "position: flex", "layout: flex"], 0),
            ],
        ),
    },
    {
        "title": "Figma'da UI/UX dizayn",
        "category": "Dizayn",
        "level": CourseLevel.BEGINNER,
        "featured": True,
        "short": "Mobil ilova va veb-saytlar uchun professional interfeyslar loyihalashni o'rganing.",
        "description": "Figma bilan ishlash, dizayn tizimlari, prototiplash va foydalanuvchi tajribasi asoslari.",
        "lessons": [
            ("UI va UX farqi", 9, True),
            ("Figma interfeysi bilan tanishuv", 14, False),
            ("Auto Layout va komponentlar", 19, False),
            ("Prototip yaratish", 16, False),
        ],
        "quiz": (
            "UI/UX asoslari testi",
            [
                ("UX nimani anglatadi?", ["User Experience", "User Extension", "Unique Experience", "Universal Exchange"], 0),
                ("Figma'da qayta ishlatiladigan element nima deb ataladi?", ["Frame", "Komponent", "Layer", "Group"], 1),
            ],
        ),
    },
    {
        "title": "SMM va raqamli marketing",
        "category": "Biznes va marketing",
        "level": CourseLevel.INTERMEDIATE,
        "featured": True,
        "short": "Instagram va Telegram orqali biznesingizni rivojlantirish strategiyalari.",
        "description": "Kontent reja tuzish, auditoriyani tahlil qilish, reklama sozlash va natijalarni o'lchash.",
        "lessons": [
            ("Raqamli marketing nima?", 11, True),
            ("Maqsadli auditoriyani aniqlash", 15, False),
            ("Kontent reja tuzish", 17, False),
            ("Targeting reklama asoslari", 20, False),
        ],
        "quiz": (
            "Marketing testi",
            [
                ("CTR nimani o'lchaydi?", ["Bosishlar ulushini", "Sotuvlar sonini", "Obunachilar sonini", "Byudjetni"], 0),
                ("Kontent reja nima uchun kerak?",
                 ["Postlarni tizimli va muntazam chiqarish uchun", "Reklama narxini kamaytirish uchun",
                  "Soliq hisoboti uchun", "Kerak emas"], 0),
            ],
        ),
    },
    {
        "title": "Excel: boshlang'ichdan professionalgacha",
        "category": "Ma'lumotlar tahlili",
        "level": CourseLevel.BEGINNER,
        "featured": False,
        "short": "Formulalar, jadvallar, diagrammalar va pivot jadvallar bilan ishlashni o'rganing.",
        "description": "Ish joyida eng ko'p kerak bo'ladigan Excel ko'nikmalarini amaliy topshiriqlar orqali egallang.",
        "lessons": [
            ("Excel interfeysi", 8, True),
            ("Asosiy formulalar: SUM, AVERAGE, IF", 16, False),
            ("VLOOKUP va XLOOKUP", 18, False),
            ("Pivot jadvallar", 20, False),
        ],
        "quiz": (
            "Excel testi",
            [
                ("Yig'indini hisoblovchi funksiya?", ["COUNT", "SUM", "MAX", "ADD"], 1),
                ("Formulalar qaysi belgi bilan boshlanadi?", ["#", "=", "$", "@"], 1),
            ],
        ),
    },
    {
        "title": "Ingliz tili: A1-A2 daraja",
        "category": "Xorijiy tillar",
        "level": CourseLevel.BEGINNER,
        "featured": False,
        "short": "Kundalik muloqot uchun zarur bo'lgan ingliz tili grammatikasi va so'z boyligi.",
        "description": "O'zbek tilida tushuntirilgan grammatika darslari va amaliy mashqlar.",
        "lessons": [
            ("Alifbo va talaffuz", 12, True),
            ("To be fe'li", 14, False),
            ("Present Simple", 16, False),
        ],
        "quiz": (
            "Grammatika testi",
            [
                ("'She ___ a teacher.' Bo'sh joyga nima qo'yiladi?", ["am", "is", "are", "be"], 1),
                ("'I ___ coffee every morning.'", ["drinks", "drinking", "drink", "drank"], 2),
            ],
        ),
    },
]


def get_or_create_user(db, email: str, full_name: str, password: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, full_name=full_name, hashed_password=hash_password(password), role=role)
        db.add(user)
        db.flush()
    return user


def run() -> None:
    db = SessionLocal()
    try:
        admin = get_or_create_user(
            db, settings.FIRST_ADMIN_EMAIL.lower(), "Platforma administratori",
            settings.FIRST_ADMIN_PASSWORD, UserRole.ADMIN,
        )
        instructor = get_or_create_user(
            db, "teacher@bilimdon.uz", "Demo O'qituvchi", "Teacher12345", UserRole.INSTRUCTOR
        )
        get_or_create_user(db, "student@bilimdon.uz", "Demo Talaba", "Student12345", UserRole.STUDENT)

        categories: dict[str, Category] = {}
        for name, icon, description in CATEGORIES:
            category = db.scalar(select(Category).where(Category.name == name))
            if category is None:
                category = Category(name=name, slug=slugify(name), icon=icon, description=description)
                db.add(category)
                db.flush()
            categories[name] = category

        for index, data in enumerate(COURSES):
            slug = slugify(data["title"])
            if db.scalar(select(Course.id).where(Course.slug == slug)):
                continue
            course = Course(
                title=data["title"],
                slug=slug,
                short_description=data["short"],
                description=data["description"],
                level=data["level"],
                is_published=True,
                is_featured=data["featured"],
                category_id=categories[data["category"]].id,
                instructor_id=(instructor if index % 2 == 0 else admin).id,
            )
            course.lessons = [
                Lesson(
                    title=title,
                    duration_minutes=minutes,
                    position=pos,
                    is_preview=preview,
                    video_url=DEMO_VIDEOS[pos % len(DEMO_VIDEOS)],
                    content=f"{title} mavzusi bo'yicha dars konspekti. Videoni ko'rib bo'lgach, "
                    "\"Darsni tugatdim\" tugmasini bosing.",
                )
                for pos, (title, minutes, preview) in enumerate(data["lessons"], start=1)
            ]
            quiz_title, questions = data["quiz"]
            course.quizzes = [
                Quiz(
                    title=quiz_title,
                    description="Kursni yakunlash va sertifikat olish uchun kamida 70% to'plang.",
                    pass_score=70,
                    questions=[
                        Question(
                            text=text,
                            position=i,
                            options=[AnswerOption(text=o, is_correct=j == correct) for j, o in enumerate(options)],
                        )
                        for i, (text, options, correct) in enumerate(questions)
                    ],
                )
            ]
            db.add(course)

        db.commit()
        print("Seed tayyor ✔")
        print(f"  Admin:        {settings.FIRST_ADMIN_EMAIL} / {settings.FIRST_ADMIN_PASSWORD}")
        print("  O'qituvchi:   teacher@bilimdon.uz / Teacher12345")
        print("  Talaba:       student@bilimdon.uz / Student12345")
    finally:
        db.close()


if __name__ == "__main__":
    run()
