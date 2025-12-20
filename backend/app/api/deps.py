from functools import lru_cache
from app.core.config import Settings, get_settings
from app.services.llm_service import GeminiService
from app.services.exa_service import ExaService


# --- Cached Service Instances ---
@lru_cache()
def get_gemini_service() -> GeminiService:
    """Returns a cached GeminiService instance."""
    return GeminiService()


@lru_cache()
def get_exa_service() -> ExaService:
    """Returns a cached ExaService instance."""
    return ExaService()


# --- Re-export settings for convenience ---
def get_app_settings() -> Settings:
    """Returns application settings."""
    return get_settings()
