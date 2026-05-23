import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Access Control Hub API"
    API_V1_STR: str = "/api"
    
    # Auth (Must match Node.js JWT Secret)
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database URL
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/access_control"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
