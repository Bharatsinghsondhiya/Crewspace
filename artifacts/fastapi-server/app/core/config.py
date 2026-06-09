import os
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Access Control Hub API"
    API_V1_STR: str = "/api"
    
    # Auth — MUST be set via JWT_SECRET environment variable. No insecure default.
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database URL — MUST be set via DATABASE_URL environment variable.
    DATABASE_URL: str
    
    # Redis — defaults to localhost only for local dev; override in production.
    REDIS_URL: str = "redis://localhost:6379/0"

    # SMTP Settings (optional, falls back to nodemailer ethereal account)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    SMTP_FROM: str | None = None
    
    # Frontend URL for password reset link
    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        # Guard against accidentally using a weak / placeholder key
        insecure_defaults = {"super-secret-key", "secret", "changeme", "password", ""}
        if v.lower() in insecure_defaults or len(v) < 32:
            raise ValueError(
                "SECRET_KEY is insecure. Set a strong random key (>=32 chars) via JWT_SECRET env var."
            )
        return v

    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_prefix = ""


settings = Settings()
