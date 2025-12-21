from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.schemas.search import SearchRequest
from app.services.exa_service import ExaSearchResult
from app.schemas.search import PersonCard, CompanyCard
from app.schemas.common import CardType


@pytest.mark.asyncio
async def test_people_search_success(client: TestClient, mock_services):
    result = ExaSearchResult(
        request_id="req_people",
        results=[
            PersonCard(
                card_type=CardType.PERSON,
                name="John",
                headline="Engineer",
                current_role="Engineer",
                company="Tech",
                location="Berlin",
                linkedin_url="https://linkedin.com/in/john",
                summary=None,
                skills=["Python"],
                image_url=None,
            )
        ],
    )
    mock_services["exa"].search_people = AsyncMock(return_value=result)

    response = client.post(
        "/api/v1/search/people",
        json={"query": "engineer", "num_results": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == "req_people"
    assert len(data["results"]) == 1
    assert data["results"][0]["name"] == "John"


@pytest.mark.asyncio
async def test_people_search_handles_error(client: TestClient, mock_services):
    mock_services["exa"].search_people = AsyncMock(
        return_value=ExaSearchResult(request_id="error", results=[])
    )

    response = client.post(
        "/api/v1/search/people",
        json={"query": "engineer", "num_results": 1},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "EXA_API_ERROR"


@pytest.mark.asyncio
async def test_company_search_success(client: TestClient, mock_services):
    result = ExaSearchResult(
        request_id="req_companies",
        results=[
            CompanyCard(
                card_type=CardType.COMPANY,
                name="TechCorp",
                industry="AI",
                founded_year=2020,
                description=None,
                location="Berlin",
                website_url="https://techcorp.com",
                linkedin_url=None,
                estimated_employees="11-50",
            )
        ],
    )
    mock_services["exa"].search_companies = AsyncMock(return_value=result)

    response = client.post(
        "/api/v1/search/companies",
        json={"query": "ai companies", "num_results": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == "req_companies"
    assert data["results"][0]["name"] == "TechCorp"


@pytest.mark.asyncio
async def test_company_search_handles_error(client: TestClient, mock_services):
    mock_services["exa"].search_companies = AsyncMock(
        return_value=ExaSearchResult(request_id="error", results=[])
    )

    response = client.post(
        "/api/v1/search/companies",
        json={"query": "ai companies", "num_results": 1},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "EXA_API_ERROR"
