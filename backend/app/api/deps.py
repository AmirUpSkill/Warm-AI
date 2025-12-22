from typing import AsyncGenerator

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.services.exa_service import ExaService
from app.services.history_service import HistoryService
from app.services.llm_service import GeminiService
from sqlalchemy.ext.asyncio import AsyncSession


# --- Cached Service Instances ---
# NOTE: We keep the services cached at module level so that heavy initialisation
# (model loading, auth handshakes, etc.) happens only once per process.
_gemini_service: GeminiService | None = None
_exa_service: ExaService | None = None


def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service


def get_exa_service() -> ExaService:
    global _exa_service
    if _exa_service is None:
        _exa_service = ExaService()
    return _exa_service


# --- Re-export settings for convenience ---
def get_app_settings() -> Settings:
    """Returns application settings."""
    return get_settings()


# --- Database session dependency ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


# --- History Service Dependency ---
def get_history_service(db: AsyncSession = Depends(get_db)) -> HistoryService:
    return HistoryService(db)
