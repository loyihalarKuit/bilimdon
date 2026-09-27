from functools import lru_cache
from typing import Annotated

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Bilimdon API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+psycopg://bilim:bilim@localhost:5432/bilim"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    FIRST_ADMIN_EMAIL: str = "admin@bilimdon.uz"
    FIRST_ADMIN_PASSWORD: str = "Admin12345"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def check_production_secret(self):
        if self.is_production and (self.JWT_SECRET_KEY == "change-me" or len(self.JWT_SECRET_KEY) < 32):
            raise ValueError("Productionda JWT_SECRET_KEY kamida 32 belgili tasodifiy qiymat bo'lishi shart")
        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
