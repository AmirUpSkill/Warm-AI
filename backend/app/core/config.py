from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # --- Core ---
    UVICORN_PORT: int = 8000
    ENVIRONMENT: str = "development"

    # --- Database ---
    DATABASE_URL: str

    # --- API Keys ---
    EXA_API_KEY: str
    GEMINI_API_KEY: str

    # --- Security ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Frontend ---
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Config ---
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()