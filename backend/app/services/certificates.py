from sqlalchemy.orm import Session

from app.models import Certificate
from app.schemas.learning import CertificateOut
from app.services.courses import get_course_stats


def to_certificate_out(db: Session, certificate: Certificate) -> CertificateOut:
    course = certificate.course
    stats = get_course_stats(db, [course.id])[course.id]
    return CertificateOut(
        code=certificate.code,
        issued_at=certificate.issued_at,
        student_name=certificate.user.full_name,
        course_title=course.title,
        course_slug=course.slug,
        instructor_name=course.instructor.full_name if course.instructor else None,
        total_minutes=stats.total_minutes,
    )
