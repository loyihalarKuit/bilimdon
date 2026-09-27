def _create_course(client, admin_headers):
    cat = client.post("/api/v1/admin/categories", json={"name": "Dasturlash"}, headers=admin_headers)
    assert cat.status_code == 201, cat.text

    course = client.post(
        "/api/v1/admin/courses",
        json={
            "title": "Python asoslari",
            "short_description": "Python dasturlash tilini noldan o'rganing",
            "category_id": cat.json()["id"],
            "is_published": True,
            "is_featured": True,
        },
        headers=admin_headers,
    )
    assert course.status_code == 201, course.text
    course_id = course.json()["id"]

    lessons = []
    for i, preview in enumerate([True, False]):
        res = client.post(
            f"/api/v1/admin/courses/{course_id}/lessons",
            json={"title": f"Dars {i + 1}", "duration_minutes": 10, "is_preview": preview},
            headers=admin_headers,
        )
        assert res.status_code == 201, res.text
        lessons.append(res.json())

    quiz = client.post(
        f"/api/v1/admin/courses/{course_id}/quizzes",
        json={
            "title": "Yakuniy test",
            "pass_score": 50,
            "questions": [
                {"text": "2 + 2 = ?", "options": [{"text": "4", "is_correct": True}, {"text": "5"}]},
                {"text": "print nima?", "options": [{"text": "funksiya", "is_correct": True}, {"text": "sikl"}]},
            ],
        },
        headers=admin_headers,
    )
    assert quiz.status_code == 201, quiz.text
    return course.json(), lessons, quiz.json()


def test_full_learning_flow(client, admin_headers, student_headers):
    course, lessons, quiz = _create_course(client, admin_headers)
    slug = course["slug"]
    assert slug == "python-asoslari"

    listing = client.get("/api/v1/courses?featured=true").json()
    assert listing["total"] == 1
    assert listing["items"][0]["lesson_count"] == 2
    assert listing["items"][0]["total_minutes"] == 20

    cats = client.get("/api/v1/categories").json()
    assert cats[0]["course_count"] == 1

    # Preview dars ochiq, qolgani yopiq
    assert client.get(f"/api/v1/courses/{slug}/lessons/{lessons[0]['id']}").status_code == 200
    assert client.get(f"/api/v1/courses/{slug}/lessons/{lessons[1]['id']}", headers=student_headers).status_code == 403
    assert client.post(f"/api/v1/lessons/{lessons[1]['id']}/complete", headers=student_headers).status_code == 403

    enroll = client.post(f"/api/v1/courses/{slug}/enroll", headers=student_headers)
    assert enroll.status_code == 201
    assert enroll.json()["progress_percent"] == 0
    assert client.get(f"/api/v1/courses/{slug}", headers=student_headers).json()["is_enrolled"] is True

    # Talabaga to'g'ri javoblar ko'rinmasligi kerak
    public_quiz = client.get(f"/api/v1/quizzes/{quiz['id']}", headers=student_headers).json()
    assert "is_correct" not in public_quiz["questions"][0]["options"][0]

    for lesson in lessons:
        progress = client.post(f"/api/v1/lessons/{lesson['id']}/complete", headers=student_headers).json()
    assert progress["progress_percent"] == 67
    assert progress["certificate_code"] is None

    # Yiqilgan urinish
    wrong = [
        {"question_id": q["id"], "option_id": next(o["id"] for o in q["options"] if not o["is_correct"])}
        for q in quiz["questions"]
    ]
    res = client.post(f"/api/v1/quizzes/{quiz['id']}/submit", json={"answers": wrong}, headers=student_headers).json()
    assert res["passed"] is False and res["score"] == 0

    right = [
        {"question_id": q["id"], "option_id": next(o["id"] for o in q["options"] if o["is_correct"])}
        for q in quiz["questions"]
    ]
    res = client.post(f"/api/v1/quizzes/{quiz['id']}/submit", json={"answers": right}, headers=student_headers).json()
    assert res["passed"] is True and res["score"] == 100
    assert res["course_completed"] is True
    code = res["certificate_code"]
    assert code

    my = client.get("/api/v1/me/courses", headers=student_headers).json()
    assert my[0]["progress_percent"] == 100
    assert my[0]["certificate_code"] == code

    stats = client.get("/api/v1/me/dashboard", headers=student_headers).json()
    assert stats == {
        "enrolled_courses": 1,
        "completed_courses": 1,
        "in_progress_courses": 0,
        "certificates": 1,
        "completed_lessons": 2,
        "quizzes_passed": 1,
    }

    cert = client.get(f"/api/v1/certificates/{code.lower()}").json()
    assert cert["student_name"] == "Talaba"
    assert cert["course_title"] == "Python asoslari"
    assert client.get("/api/v1/certificates/NOPE").status_code == 404


def test_unpublished_course_hidden(client, admin_headers, student_headers):
    course = client.post(
        "/api/v1/admin/courses",
        json={"title": "Qoralama kurs", "short_description": "Hali tayyor bo'lmagan kurs"},
        headers=admin_headers,
    ).json()
    assert client.get("/api/v1/courses").json()["total"] == 0
    assert client.get(f"/api/v1/courses/{course['slug']}").status_code == 404
    assert client.get(f"/api/v1/courses/{course['slug']}", headers=admin_headers).status_code == 200


def test_student_cannot_use_admin(client, student_headers):
    res = client.post(
        "/api/v1/admin/courses",
        json={"title": "Hack", "short_description": "Ruxsatsiz kurs yaratish"},
        headers=student_headers,
    )
    assert res.status_code == 403


def test_quiz_requires_single_correct_option(client, admin_headers):
    course = client.post(
        "/api/v1/admin/courses",
        json={"title": "Test kurs", "short_description": "Test uchun kurs tavsifi"},
        headers=admin_headers,
    ).json()
    res = client.post(
        f"/api/v1/admin/courses/{course['id']}/quizzes",
        json={"title": "T", "questions": [{"text": "Savol", "options": [{"text": "a"}, {"text": "b"}]}]},
        headers=admin_headers,
    )
    assert res.status_code == 422
