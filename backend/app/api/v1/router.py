from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, categories, certificates, courses, learning, me, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(courses.router)
api_router.include_router(learning.router)
api_router.include_router(me.router)
api_router.include_router(certificates.router)
api_router.include_router(admin.router)
