import pytest
from unittest.mock import MagicMock, patch
from app.services.exa_service import ExaService
from app.schemas.common import CardType

@pytest.fixture
def mock_exa_response():
    """
        Matches the structure of Exa's search_and_contents response
    """
    mock_result = MagicMock()
    mock_result.results = [
        MagicMock(
            author="John Doe",
            title="Senior AI Engineer at TechCorp",
            url="https://linkedin.com/in/johndoe",
            text="## Skills\nPython, FastAPI, Tensorflow\n\nBerlin, Germany (DE)",
            image="https://example.com/image.jpg"
        )
    ]
    mock_result.requestId = "req_123"
    return mock_result

@pytest.fixture
def mock_exa_company_response():
    """
        Matches the structure of Exa's company search response
    """
    mock_result = MagicMock()
    mock_result.results = [
        MagicMock(
            title="TechCorp",
            url="https://techcorp.com",
            summary='{"company_name": "TechCorp", "industry": "AI", "founding_year": 2023, "description": "AI for good", "location": "Berlin", "estimated_employees": "11-50"}'
        )
    ]
    mock_result.requestId = "req_456"
    return mock_result

def test_search_people(mock_exa_response):
    with patch("app.services.exa_service.Exa") as MockClient:
        # --- Setup Mock ---
        instance = MockClient.return_value
        instance.search_and_contents.return_value = mock_exa_response
        
        service = ExaService()
        result_wrapper = service.search_people("AI Engineer")
        
        # --- Assertions ---
        assert result_wrapper.request_id == "req_123"
        assert len(result_wrapper.results) == 1
        
        card = result_wrapper.results[0]
        assert card.card_type == CardType.PERSON
        assert card.name == "John Doe"
        assert card.current_role == "Senior AI Engineer"
        assert card.company == "TechCorp"
        assert card.location == "Berlin, Germany"
        assert "Python" in card.skills
        assert card.image_url == "https://example.com/image.jpg"
        assert "linkedin.com/in/johndoe" in str(card.linkedin_url)

def test_search_companies(mock_exa_company_response):
    with patch("app.services.exa_service.Exa") as MockClient:
        # --- Setup Mock ---
        instance = MockClient.return_value
        instance.search_and_contents.return_value = mock_exa_company_response
        
        service = ExaService()
        result_wrapper = service.search_companies("AI Startups")
        
        # --- Assertions ---
        assert result_wrapper.request_id == "req_456"
        assert len(result_wrapper.results) == 1
        
        card = result_wrapper.results[0]
        assert card.card_type == CardType.COMPANY
        assert card.name == "TechCorp"
        assert card.industry == "AI"
        assert card.founded_year == 2023
        assert "techcorp.com" in str(card.website_url)
        assert card.estimated_employees == "11-50"
