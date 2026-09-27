from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models import Certificate, Course
from app.schemas.learning import CertificateOut
from app.services.certificates import to_certificate_out

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/{code}", response_model=CertificateOut, summary="Sertifikatni tekshirish (ochiq)")
def verify_certificate(code: str, db: DbSession):
    certificate = db.scalar(
        select(Certificate)
        .options(selectinload(Certificate.course).selectinload(Course.instructor), selectinload(Certificate.user))
        .where(Certificate.code == code.upper())
    )
    if certificate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sertifikat topilmadi")
    return to_certificate_out(db, certificate)
