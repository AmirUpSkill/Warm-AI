import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.api.deps import get_gemini_service, get_exa_service
from app.services.exa_service import ExaSearchResult


@pytest.fixture()
def mock_services():
    mock_gemini = MagicMock()

    async def empty_stream(*_args, **_kwargs):
        if False:
            yield None

    mock_gemini.chat_stream = empty_stream

    mock_exa = MagicMock()
    mock_exa.search_people = AsyncMock(
        return_value=ExaSearchResult(request_id="req", results=[])
    )
    mock_exa.search_companies = AsyncMock(
        return_value=ExaSearchResult(request_id="req", results=[])
    )

    return {"gemini": mock_gemini, "exa": mock_exa}


@pytest.fixture(autouse=True)
def override_dependencies(mock_services):
    app.dependency_overrides[get_gemini_service] = lambda: mock_services["gemini"]
    app.dependency_overrides[get_exa_service] = lambda: mock_services["exa"]
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
def client(mock_services):
    return TestClient(app)
