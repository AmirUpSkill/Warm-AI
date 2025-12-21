import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.common import CardType
from app.services.exa_service import ExaSearchResult, ExaService


@pytest.fixture
def exa_service():
    """Instantiate ExaService with the Exa SDK patched."""
    with patch("app.services.exa_service.Exa"):
        service = ExaService()
        # Replace the real client with a MagicMock so we can control responses
        service.client = MagicMock()
        yield service


def test_extract_skills_from_text(exa_service):
    text = "## Skills\nPython\nFastAPI\nTensorFlow\n\n## Experience"
    assert exa_service._extract_skills_from_text(text) == [
        "Python",
        "FastAPI",
        "TensorFlow",
    ]


def test_extract_skills_from_text_handles_missing_section(exa_service):
    assert exa_service._extract_skills_from_text("No skills here") == []


def test_extract_location_from_text(exa_service):
    text = "Berlin, Germany (DE)\nOther info"
    assert exa_service._extract_location_from_text(text) == "Berlin, Germany"


def test_extract_location_from_text_missing(exa_service):
    assert exa_service._extract_location_from_text("Unknown") is None


def test_parse_headline_with_company(exa_service):
    role, company = exa_service._parse_headline(
        "Jane Doe | Staff ML Engineer at OpenAI"
    )
    assert role == "Staff ML Engineer"
    assert company == "OpenAI"


def test_parse_headline_without_company(exa_service):
    role, company = exa_service._parse_headline("Solo Contributor")
    assert role == "Solo Contributor"
    assert company is None


def test_is_linkedin_url(exa_service):
    assert exa_service._is_linkedin_url("https://linkedin.com/in/test") is True
    assert exa_service._is_linkedin_url("https://example.com") is False


def test_search_people_sync_success(exa_service):
    response = MagicMock()
    response.requestId = "req_people"
    response.results = [
        MagicMock(
            author="Jane Doe",
            title="Jane Doe | Staff ML Engineer at OpenAI",
            text=(
                "Berlin, Germany (DE)\n\n"
                "## Skills\nPython, FastAPI, TensorFlow\n"
                "## Summary\nExtensive experience in AI"
            ),
            url="https://linkedin.com/in/janedoe",
            image="https://example.com/avatar.png",
        )
    ]
    exa_service.client.search_and_contents.return_value = response

    result = exa_service._search_people_sync("ml engineer", 3)

    assert result.request_id == "req_people"
    assert len(result.results) == 1
    card = result.results[0]
    assert card.card_type == CardType.PERSON
    assert card.name == "Jane Doe"
    assert card.current_role == "Staff ML Engineer"
    assert card.company == "OpenAI"
    assert card.location == "Berlin, Germany"
    assert card.skills == ["Python", "FastAPI", "TensorFlow"]
    assert card.image_url == "https://example.com/avatar.png"
    assert "linkedin.com" in str(card.linkedin_url)


def test_search_people_sync_handles_exception(exa_service):
    exa_service.client.search_and_contents.side_effect = RuntimeError("boom")

    result = exa_service._search_people_sync("query", 2)

    assert result.request_id == "error"
    assert result.results == []


def test_search_companies_sync_success(exa_service):
    response = MagicMock()
    response.requestId = "req_companies"
    response.results = [
        MagicMock(
            title="TechCorp",
            url="https://linkedin.com/company/techcorp",
            summary=json.dumps(
                {
                    "company_name": "TechCorp",
                    "industry": "AI",
                    "founding_year": 2019,
                    "description": "AI for recruiters",
                    "location": "Berlin",
                    "estimated_employees": "51-100",
                }
            ),
        )
    ]
    exa_service.client.search_and_contents.return_value = response

    result = exa_service._search_companies_sync("ai startups", 4)

    assert result.request_id == "req_companies"
    assert len(result.results) == 1
    company = result.results[0]
    assert company.card_type == CardType.COMPANY
    assert company.name == "TechCorp"
    assert company.industry == "AI"
    assert company.founded_year == 2019
    assert company.location == "Berlin"
    assert str(company.linkedin_url) == "https://linkedin.com/company/techcorp"
    assert company.website_url is None
    assert company.estimated_employees == "51-100"


def test_search_companies_sync_handles_exception(exa_service):
    exa_service.client.search_and_contents.side_effect = ValueError("bad request")

    result = exa_service._search_companies_sync("query", 1)

    assert result.request_id == "error"
    assert result.results == []


@pytest.mark.asyncio
async def test_search_people_async_wrapper(exa_service):
    with patch(
        "app.services.exa_service.run_in_threadpool", new_callable=AsyncMock
    ) as mock_threadpool:
        mock_threadpool.return_value = ExaSearchResult(request_id="async", results=[])

        result = await exa_service.search_people("async query", 5)

        assert result.request_id == "async"
        mock_threadpool.assert_awaited_once_with(
            exa_service._search_people_sync, "async query", 5
        )


@pytest.mark.asyncio
async def test_search_companies_async_wrapper(exa_service):
    with patch(
        "app.services.exa_service.run_in_threadpool", new_callable=AsyncMock
    ) as mock_threadpool:
        mock_threadpool.return_value = ExaSearchResult(request_id="async", results=[])

        result = await exa_service.search_companies("async query", 2)

        assert result.request_id == "async"
        mock_threadpool.assert_awaited_once_with(
            exa_service._search_companies_sync, "async query", 2
        )
