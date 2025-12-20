import pytest 
from app.core.config import Settings , get_settings 

def test_settings_loading(monkeypatch):
    """
        Test If Settings load correctly from env vars . 
    """
    # --- Mock Env Vars --- 
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test_db")
    monkeypatch.setenv("EXA_API_KEY","test_exa_key")
    monkeypatch.setenv("GEMINI_API_KEY","test_gemini_key")
    monkeypatch.setenv("JWT_SECRET_KEY","test_secret")

    settings = Settings()

    assert settings.DATABASE_URL == "postgresql+asyncpg://test:test@localhost/test_db"
    assert settings.EXA_API_KEY == "test_exa_key"
    assert settings.GEMINI_API_KEY == "test_gemini_key"
    assert settings.JWT_SECRET_KEY == "test_secret"

def test_get_settings_cache():
    """
        Test If get_settings returns a singleton (cached) instance . "
    """
    settings1 = get_settings()
    settings2 = get_settings()
    assert settings1 is settings2 